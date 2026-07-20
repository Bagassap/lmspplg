import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KelasService } from '../kelas/kelas.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';

// new Date().getHours()/toISOString() read the server process's OS timezone (often UTC),
// not WIB — extract Jakarta-local date/hour explicitly so the window check is correct
// regardless of where the server runs.
function jakartaParts() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

function todayStr() {
  return jakartaParts().date;
}

export type AbsenWindow = 'HADIR' | 'PULANG' | 'CLOSED';

function currentWindow(): AbsenWindow {
  const { hour } = jakartaParts();
  if (hour >= 6 && hour < 11) return 'HADIR';
  if (hour >= 11 && hour < 23) return 'PULANG';
  return 'CLOSED';
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
      include: { user: { select: { id: true, nama: true } } },
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
      if (window !== 'PULANG') {
        throw new ForbiddenException(
          window === 'HADIR'
            ? 'Absen pulang belum tersedia. Absen pulang dibuka mulai jam 11.00 WIB'
            : 'Waktu absen pulang hari ini sudah berakhir',
        );
      }
      if (!extras.fotoUrl) throw new BadRequestException('Foto wajib diisi untuk absen pulang');
      if (!extras.lokasi) throw new BadRequestException('Lokasi (GPS) wajib diisi untuk absen pulang');
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
    if (window !== 'HADIR') {
      throw new ForbiddenException('Absen datang hanya tersedia jam 06.00-11.00 WIB');
    }
    if (existing?.status) {
      throw new BadRequestException('Anda sudah mengisi absensi hari ini');
    }
    if (tipe === 'HADIR') {
      if (!extras.fotoUrl) throw new BadRequestException('Foto wajib diisi untuk absen hadir');
      if (!extras.lokasi) throw new BadRequestException('Lokasi (GPS) wajib diisi untuk absen hadir');
      if (!extras.ttd) throw new BadRequestException('Tanda tangan wajib diisi untuk absen hadir');
    }
    if ((tipe === 'IZIN' || tipe === 'SAKIT') && !extras.catatan?.trim()) {
      throw new BadRequestException('Keterangan wajib diisi untuk Izin/Sakit');
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
