import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KelasService } from '../kelas/kelas.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { jakartaParts, todayJakarta as todayStr, effectiveWeekdaysInRange, monthToDateRange } from '../common/utils/jakarta-date.util';

export type RangeSiswaSummary = { HADIR: number; IZIN: number; SAKIT: number; ALPA: number; totalHariEfektif: number; persentaseKehadiran: number };
export type RangeSiswaRow = {
  siswaId: string;
  nama: string | null;
  nis: string | null;
  byTanggal: Record<string, { status: string | null; waktuAbsen: string | null; waktuPulang: string | null }>;
  summary: RangeSiswaSummary;
};
export type RekapRangeData = {
  kelas: { nama: string } | null;
  tanggalMulai: string;
  tanggalSelesai: string;
  tanggalList: string[];
  siswa: RangeSiswaRow[];
};

export type AbsenWindow = 'HADIR' | 'PULANG' | 'BOTH' | 'CLOSED';

// TEMPORARY OVERRIDE — 2026-07-24: gangguan teknis pagi ini membuat siswa
// tidak bisa absen Datang tepat waktu, dan jendela Datang (06.00-09.00) sudah
// tertutup saat perbaikan ini dibuat. Untuk TANGGAL INI SAJA, window Datang
// dan Pulang dibuka BERSAMAAN (sampai jam 23.00 WIB) supaya siswa tetap bisa
// mencatat kehadiran hari ini. Aman dibiarkan di kode setelah tanggal ini
// berlalu — perbandingan tanggal di bawah otomatis bernilai false untuk
// hari-hari berikutnya, sehingga jadwal normal berlaku kembali TANPA perlu
// deploy ulang atau tindakan manual apa pun. Boleh dihapus kapan saja setelah
// 2026-07-24 kalau ingin membersihkan kode.
const OVERRIDE_DATE = '2026-07-24';
const OVERRIDE_END_MINUTES = 23 * 60; // 23.00 WIB

// Absen datang: 06.00-09.00 WIB, Senin-Jumat.
// Absen pulang: 14.00-17.00 WIB Senin-Kamis, atau 11.00-12.00 WIB khusus Jumat.
// Sabtu-Minggu tidak ada jendela absen sama sekali.
function currentWindow(): AbsenWindow {
  const { hour, minute, dayOfWeek } = jakartaParts();

  if (todayStr() === OVERRIDE_DATE) {
    const minutesNow = hour * 60 + minute;
    return minutesNow < OVERRIDE_END_MINUTES ? 'BOTH' : 'CLOSED';
  }

  const minutesNow = hour * 60 + minute;
  const isMonFri = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isMonThu = dayOfWeek >= 1 && dayOfWeek <= 4;
  const isFriday = dayOfWeek === 5;

  if (isMonFri && minutesNow >= 6 * 60 && minutesNow < 9 * 60) return 'HADIR';
  if (isMonThu && minutesNow >= 14 * 60 && minutesNow < 17 * 60) return 'PULANG';
  if (isFriday && minutesNow >= 11 * 60 && minutesNow < 12 * 60) return 'PULANG';
  return 'CLOSED';
}

function pulangWindowLabel(): string {
  const { dayOfWeek } = jakartaParts();
  return dayOfWeek === 5 ? '11.00-12.00 WIB (Jumat)' : '14.00-17.00 WIB (Senin-Kamis)';
}

// GPS is mandatory for Hadir/Pulang — a truthy check alone lets a client
// (buggy, stale-cached, or a direct API call bypassing the UI entirely)
// submit a placeholder string like "GPS tidak tersedia" as if it were a
// real location. Require an actual "lat,lng" pair within valid ranges.
function isValidGpsLokasi(lokasi?: string): boolean {
  if (!lokasi) return false;
  const parts = lokasi.split(',');
  if (parts.length !== 2) return false;
  const lat = Number(parts[0].trim());
  const lng = Number(parts[1].trim());
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}

@Injectable()
export class AbsensiHarianService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kelasService: KelasService,
    private readonly notificationService: NotificationService,
  ) {}

  async getRekapKelas(kelasId: string, tanggal: string) {
    const kelas = await this.prisma.kelas.findUnique({
      where: { id: kelasId },
      include: { waliKelasGuru: { include: { user: { select: { nama: true } } } } },
    });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');

    const siswaList = await this.prisma.siswa.findMany({
      where: { kelasId },
      include: { user: { select: { id: true, nama: true, fotoProfil: true } } },
      orderBy: { nama: 'asc' },
    });

    const existing = await this.prisma.absensiHarian.findMany({
      where: { kelasId, tanggal },
    });
    const docMap = new Map(existing.map((a) => [a.siswaId, a]));

    const rekap = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    let pulangCount = 0;
    const siswa = siswaList.map((s) => {
      const doc = docMap.get(s.id) ?? null;
      const status = doc?.status ?? null;
      if (status && status in rekap) rekap[status as keyof typeof rekap]++;
      if (doc?.waktuPulang) pulangCount++;
      return {
        siswaId: s.id,
        userId: s.userId,
        nama: s.user?.nama ?? s.nama,
        nis: s.nis,
        fotoProfil: s.user?.fotoProfil ?? null,
        status,
        waktuAbsen: doc?.waktuAbsen ?? null,
        lokasi: doc?.lokasi ?? null,
        foto: doc?.foto ?? null,
        ttd: doc?.ttd ?? null,
        catatan: doc?.catatan ?? null,
        waktuPulang: doc?.waktuPulang ?? null,
        lokasiPulang: doc?.lokasiPulang ?? null,
        fotoPulang: doc?.fotoPulang ?? null,
        ttdPulang: doc?.ttdPulang ?? null,
        catatanPulang: doc?.catatanPulang ?? null,
      };
    });

    return { kelasId, kelas, tanggal, rekap, pulangCount, siswa };
  }

  async getAllRekap(tanggal: string, userId: string, role: string) {
    let kelasList: { id: string }[];
    if (role === 'GURU') {
      const ids = await this.kelasService.getGuruKelasIds(userId);
      kelasList = ids.map((id) => ({ id }));
    } else {
      kelasList = await this.prisma.kelas.findMany({ select: { id: true } });
    }
    return Promise.all(kelasList.map((k) => this.getRekapKelas(k.id, tanggal)));
  }

  async getForActor(userId: string, role: string, tanggal: string, kelasId?: string) {
    if (role === 'GURU') {
      const myKelasIds = await this.kelasService.getGuruKelasIds(userId);
      if (kelasId) {
        if (!myKelasIds.includes(kelasId)) {
          throw new ForbiddenException('Anda bukan wali kelas untuk kelas ini');
        }
        return [await this.getRekapKelas(kelasId, tanggal)];
      }
      return Promise.all(myKelasIds.map((id) => this.getRekapKelas(id, tanggal)));
    }

    if (kelasId) return [await this.getRekapKelas(kelasId, tanggal)];
    return this.getAllRekap(tanggal, userId, role);
  }

  async getRekapKelasForExport(kelasId: string, tanggal: string, userId: string, role: string) {
    if (role === 'GURU') {
      const myKelasIds = await this.kelasService.getGuruKelasIds(userId);
      if (!myKelasIds.includes(kelasId)) {
        throw new ForbiddenException('Anda bukan wali kelas untuk kelas ini');
      }
    }
    return this.getRekapKelas(kelasId, tanggal);
  }

  private buildRangeSiswaRow(
    siswaId: string,
    nama: string | null,
    nis: string | null,
    tanggalList: string[],
    recMap: Map<string, { status: string | null; waktuAbsen: string | null; waktuPulang: string | null }>,
  ): RangeSiswaRow {
    const byTanggal: RangeSiswaRow['byTanggal'] = {};
    const tally = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    for (const tgl of tanggalList) {
      const rec = recMap.get(`${siswaId}|${tgl}`);
      const status = rec?.status ?? null;
      byTanggal[tgl] = { status, waktuAbsen: rec?.waktuAbsen ?? null, waktuPulang: rec?.waktuPulang ?? null };
      // A day with no record at all counts as Alpa in the RANGE SUMMARY only
      // (unlike the single-day rekap, which leaves null status uncounted) —
      // otherwise the 4 categories wouldn't add up to totalHariEfektif, and a
      // multi-week/month recap needs that invariant to read as a real report.
      const tallyKey = (status ?? 'ALPA') as keyof typeof tally;
      if (tallyKey in tally) tally[tallyKey]++;
    }
    const totalHariEfektif = tanggalList.length;
    const persentaseKehadiran = totalHariEfektif > 0 ? Math.round((tally.HADIR / totalHariEfektif) * 1000) / 10 : 0;
    return { siswaId, nama, nis, byTanggal, summary: { ...tally, totalHariEfektif, persentaseKehadiran } };
  }

  private resolveRange(
    mode: 'mingguan' | 'bulanan',
    tanggalMulai?: string,
    tanggalSelesai?: string,
    bulan?: string,
    tahun?: string,
  ): { start: string; end: string } {
    if (mode === 'bulanan') {
      const b = Number(bulan);
      const t = Number(tahun);
      if (!Number.isInteger(b) || b < 1 || b > 12 || !Number.isInteger(t)) {
        throw new BadRequestException('bulan/tahun tidak valid');
      }
      return monthToDateRange(b, t);
    }
    if (!tanggalMulai || !tanggalSelesai) {
      throw new BadRequestException('tanggalMulai/tanggalSelesai wajib diisi untuk mode mingguan');
    }
    if (tanggalMulai > tanggalSelesai) {
      throw new BadRequestException('tanggalMulai harus sebelum atau sama dengan tanggalSelesai');
    }
    return { start: tanggalMulai, end: tanggalSelesai };
  }

  async getRekapKelasRangeForExport(
    kelasId: string,
    mode: 'mingguan' | 'bulanan',
    userId: string,
    role: string,
    opts: { tanggalMulai?: string; tanggalSelesai?: string; bulan?: string; tahun?: string },
  ): Promise<RekapRangeData> {
    if (role === 'GURU') {
      const myKelasIds = await this.kelasService.getGuruKelasIds(userId);
      if (!myKelasIds.includes(kelasId)) {
        throw new ForbiddenException('Anda bukan wali kelas untuk kelas ini');
      }
    }
    const kelas = await this.prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');

    const { start, end } = this.resolveRange(mode, opts.tanggalMulai, opts.tanggalSelesai, opts.bulan, opts.tahun);
    const tanggalList = effectiveWeekdaysInRange(start, end);

    const siswaList = await this.prisma.siswa.findMany({
      where: { kelasId },
      include: { user: { select: { nama: true } } },
      orderBy: { nama: 'asc' },
    });
    const records = tanggalList.length > 0
      ? await this.prisma.absensiHarian.findMany({ where: { kelasId, tanggal: { in: tanggalList } } })
      : [];
    const recMap = new Map(records.map((r) => [`${r.siswaId}|${r.tanggal}`, r]));

    const siswa = siswaList.map((s) =>
      this.buildRangeSiswaRow(s.id, s.user?.nama ?? s.nama, s.nis, tanggalList, recMap),
    );

    return { kelas: { nama: kelas.nama }, tanggalMulai: start, tanggalSelesai: end, tanggalList, siswa };
  }

  async getSiswaAbsensiRangeForExport(
    siswaId: string,
    mode: 'mingguan' | 'bulanan',
    userId: string,
    role: string,
    opts: { tanggalMulai?: string; tanggalSelesai?: string; bulan?: string; tahun?: string },
  ): Promise<RekapRangeData> {
    const siswa = await this.assertSiswaAccessible(siswaId, userId, role);
    const { start, end } = this.resolveRange(mode, opts.tanggalMulai, opts.tanggalSelesai, opts.bulan, opts.tahun);
    const tanggalList = effectiveWeekdaysInRange(start, end);

    const records = tanggalList.length > 0
      ? await this.prisma.absensiHarian.findMany({ where: { siswaId, tanggal: { in: tanggalList } } })
      : [];
    const recMap = new Map(records.map((r) => [`${r.siswaId}|${r.tanggal}`, r]));
    const row = this.buildRangeSiswaRow(siswa.id, siswa.user?.nama ?? siswa.nama, siswa.nis, tanggalList, recMap);

    return {
      kelas: siswa.kelas ? { nama: siswa.kelas.nama } : null,
      tanggalMulai: start,
      tanggalSelesai: end,
      tanggalList,
      siswa: [row],
    };
  }

  private async assertSiswaAccessible(siswaId: string, userId: string, role: string) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { id: siswaId },
      include: { kelas: true, user: { select: { nama: true } } },
    });
    if (!siswa) throw new NotFoundException('Siswa tidak ditemukan');
    if (role === 'GURU') {
      const myKelasIds = await this.kelasService.getGuruKelasIds(userId);
      if (!myKelasIds.includes(siswa.kelasId)) {
        throw new ForbiddenException('Anda bukan wali kelas untuk siswa ini');
      }
    }
    return siswa;
  }

  async getSiswaAbsensiForExport(siswaId: string, tanggal: string, userId: string, role: string) {
    const siswa = await this.assertSiswaAccessible(siswaId, userId, role);
    const doc = await this.prisma.absensiHarian.findUnique({
      where: { siswaId_tanggal: { siswaId, tanggal } },
    });
    return {
      kelas: siswa.kelas ? { nama: siswa.kelas.nama } : null,
      tanggal,
      siswa: [
        {
          siswaId: siswa.id,
          nama: siswa.user?.nama ?? siswa.nama,
          nis: siswa.nis,
          status: doc?.status ?? null,
          waktuAbsen: doc?.waktuAbsen ?? null,
          lokasi: doc?.lokasi ?? null,
          foto: doc?.foto ?? null,
          ttd: doc?.ttd ?? null,
          catatan: doc?.catatan ?? null,
          waktuPulang: doc?.waktuPulang ?? null,
          lokasiPulang: doc?.lokasiPulang ?? null,
          fotoPulang: doc?.fotoPulang ?? null,
          ttdPulang: doc?.ttdPulang ?? null,
          catatanPulang: doc?.catatanPulang ?? null,
        },
      ],
    };
  }

  async getTtdImage(siswaId: string, tanggal: string, tipe: 'hadir' | 'pulang', userId: string, role: string) {
    await this.assertSiswaAccessible(siswaId, userId, role);
    const doc = await this.prisma.absensiHarian.findUnique({
      where: { siswaId_tanggal: { siswaId, tanggal } },
    });
    const raw = tipe === 'pulang' ? doc?.ttdPulang : doc?.ttd;
    if (!raw) return null;
    const match = /^data:image\/(png|jpe?g);base64,([a-zA-Z0-9+/=]+)$/.exec(raw.trim());
    if (!match) return null;
    return {
      buffer: Buffer.from(match[2], 'base64'),
      mime: `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`,
    };
  }

  async getStatusSaya(userId: string, tanggal?: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    const window = currentWindow();
    if (!siswa) return { sudahAbsen: false, sudahPulang: false, status: null, window };
    const tgl = tanggal || todayStr();
    const record = await this.prisma.absensiHarian.findUnique({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal: tgl } },
    });
    return {
      // "sudahAbsen" specifically means a Datang (HADIR/IZIN/SAKIT) submission
      // exists — not just "some row exists for today", since a Pulang-only
      // row (no prior Hadir) must not read as "already absen datang".
      sudahAbsen: !!record?.waktuAbsen,
      sudahPulang: !!record?.waktuPulang,
      status: record?.status ?? null,
      tanggal: tgl,
      window,
      record,
    };
  }

  async absenSendiri(
    userId: string,
    tipe: 'HADIR' | 'PULANG' | 'IZIN' | 'SAKIT',
    extras: { lokasi?: string; waktuAbsen?: string; ttd?: string; fotoUrl?: string; catatan?: string } = {},
  ) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');

    const window = currentWindow();
    const tanggal = todayStr();
    const existing = await this.prisma.absensiHarian.findUnique({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } },
    });

    if (tipe === 'PULANG') {
      if (window !== 'PULANG' && window !== 'BOTH') {
        throw new ForbiddenException(
          window === 'HADIR'
            ? `Absen pulang belum tersedia. Absen pulang dibuka jam ${pulangWindowLabel()}`
            : `Waktu absen pulang hari ini sudah berakhir atau belum dibuka. Jendela pulang: ${pulangWindowLabel()}`,
        );
      }
      if (!extras.fotoUrl) throw new BadRequestException('Foto wajib diisi untuk absen pulang');
      if (!isValidGpsLokasi(extras.lokasi)) throw new BadRequestException('Lokasi (GPS) wajib diisi dan harus berupa koordinat valid untuk absen pulang');
      if (!extras.ttd) throw new BadRequestException('Tanda tangan wajib diisi untuk absen pulang');

      // Pulang is allowed even without a prior Hadir, but it must never set/imply status HADIR by itself —
      // status stays whatever it already was (null/IZIN/SAKIT/ALPA/HADIR untouched).
      const pulangData = {
        lokasiPulang: extras.lokasi,
        waktuPulang: extras.waktuAbsen,
        ttdPulang: extras.ttd,
        fotoPulang: extras.fotoUrl,
        catatanPulang: extras.catatan,
      };
      return this.prisma.absensiHarian.upsert({
        where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } },
        update: pulangData,
        create: { siswaId: siswa.id, kelasId: siswa.kelasId, tanggal, ...pulangData },
      });
    }

    // HADIR / IZIN / SAKIT — one submission per day
    if (window !== 'HADIR' && window !== 'BOTH') {
      throw new ForbiddenException('Absen datang hanya tersedia jam 06.00-09.00 WIB (Senin-Jumat)');
    }
    if (existing?.status) {
      throw new BadRequestException('Anda sudah mengisi absensi hari ini');
    }
    if (tipe === 'HADIR') {
      if (!extras.fotoUrl) throw new BadRequestException('Foto wajib diisi untuk absen hadir');
      if (!isValidGpsLokasi(extras.lokasi)) throw new BadRequestException('Lokasi (GPS) wajib diisi dan harus berupa koordinat valid untuk absen hadir');
      if (!extras.ttd) throw new BadRequestException('Tanda tangan wajib diisi untuk absen hadir');
    }
    if (tipe === 'IZIN' || tipe === 'SAKIT') {
      if (!extras.catatan?.trim()) throw new BadRequestException('Keterangan wajib diisi untuk Izin/Sakit');
      if (!extras.fotoUrl) throw new BadRequestException('Foto surat izin/sakit wajib diisi');
      if (!extras.ttd) throw new BadRequestException('Tanda tangan wajib diisi untuk Izin/Sakit');
    }

    const data = {
      status: tipe,
      lokasi: extras.lokasi,
      waktuAbsen: extras.waktuAbsen,
      ttd: extras.ttd,
      foto: extras.fotoUrl,
      catatan: extras.catatan,
    };

    return this.prisma.absensiHarian.upsert({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } },
      update: data,
      create: { siswaId: siswa.id, kelasId: siswa.kelasId, tanggal, ...data },
    });
  }

  async upsertAbsensi(
    kelasId: string,
    tanggal: string,
    absensi: { siswaId: string; status: string }[],
    actorUserId: string,
    actorRole: string,
  ) {
    if (actorRole === 'GURU') {
      const myKelasIds = await this.kelasService.getGuruKelasIds(actorUserId);
      if (!myKelasIds.includes(kelasId)) {
        throw new ForbiddenException('Anda bukan wali kelas untuk kelas ini');
      }
    }

    const anggotaKelas = await this.prisma.siswa.findMany({
      where: { kelasId },
      select: { id: true },
    });
    const anggotaSet = new Set(anggotaKelas.map((s) => s.id));
    const invalid = absensi.find((a) => !anggotaSet.has(a.siswaId));
    if (invalid) {
      throw new ForbiddenException('Terdapat siswa yang bukan anggota kelas ini');
    }

    const ops = absensi.map((item) =>
      this.prisma.absensiHarian.upsert({
        where: { siswaId_tanggal: { siswaId: item.siswaId, tanggal } },
        update: { status: item.status },
        create: { siswaId: item.siswaId, kelasId, tanggal, status: item.status },
      }),
    );
    const result = await this.prisma.$transaction(ops);

    const kelas = await this.prisma.kelas.findUnique({ where: { id: kelasId }, select: { nama: true } });
    const siswaUsers = await this.prisma.siswa.findMany({
      where: { id: { in: absensi.map((a) => a.siswaId) }, userId: { not: null } },
      select: { userId: true },
    });
    await this.notificationService.createMany(
      siswaUsers.map((s) => s.userId!),
      {
        title:   'Absensi diperbarui',
        message: `Absensi harian kelas ${kelas?.nama ?? ''} tanggal ${tanggal} telah diisi`,
        type:    NotificationType.ABSENSI,
        link:    '/absensi-harian',
      },
    );

    return result;
  }
}
