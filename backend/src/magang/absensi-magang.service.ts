import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { todayJakarta as todayStr } from '../common/utils/jakarta-date.util';
import { isValidGpsLokasi } from '../common/utils/gps.util';

type BimbinganPenempatan = { id: string; siswaId: string; tempatMagangId: string };

@Injectable()
export class AbsensiMagangService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // Daftar penempatan AKTIF di mana user ini adalah guru pembimbingnya —
  // dasar dari pembatasan "guru pembimbing hanya lihat siswa bimbingannya".
  private async getBimbinganAktif(userId: string): Promise<BimbinganPenempatan[]> {
    const guru = await this.prisma.guru.findUnique({ where: { userId } });
    if (!guru) return [];
    return this.prisma.penempatanMagang.findMany({
      where: { guruPembimbingId: guru.id, status: 'AKTIF' },
      select: { id: true, siswaId: true, tempatMagangId: true },
    });
  }

  private async getRekapTempat(tempatMagangId: string, tanggal: string, onlySiswaIds?: string[]) {
    const tempat = await this.prisma.tempatMagang.findUnique({ where: { id: tempatMagangId } });
    if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');

    const penempatanList = await this.prisma.penempatanMagang.findMany({
      where: {
        tempatMagangId,
        status: 'AKTIF',
        ...(onlySiswaIds ? { siswaId: { in: onlySiswaIds } } : {}),
      },
      include: {
        siswa: { include: { user: { select: { id: true, nama: true, fotoProfil: true } } } },
        guruPembimbing: { select: { id: true, user: { select: { id: true, nama: true } } } },
      },
      orderBy: { siswa: { nama: 'asc' } },
    });

    const existing = penempatanList.length
      ? await this.prisma.absensiMagang.findMany({
          where: { penempatanId: { in: penempatanList.map((p) => p.id) }, tanggal },
        })
      : [];
    const docMap = new Map(existing.map((a) => [a.penempatanId, a]));

    const rekap = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    let pulangCount = 0;
    const siswa = penempatanList.map((p) => {
      const doc = docMap.get(p.id) ?? null;
      const status = doc?.status ?? null;
      if (status && status in rekap) rekap[status as keyof typeof rekap]++;
      if (doc?.waktuPulang) pulangCount++;
      return {
        penempatanId: p.id,
        siswaId: p.siswaId,
        userId: p.siswa.userId,
        nama: p.siswa.user?.nama ?? p.siswa.nama,
        nis: p.siswa.nis,
        fotoProfil: p.siswa.user?.fotoProfil ?? null,
        guruPembimbing: { id: p.guruPembimbing.id, nama: p.guruPembimbing.user?.nama ?? null },
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

    return { tempatMagangId, tempatMagang: tempat, tanggal, rekap, pulangCount, siswa };
  }

  private async getAllRekapAdmin(tanggal: string) {
    const tempatList = await this.prisma.tempatMagang.findMany({ select: { id: true }, orderBy: { namaTempat: 'asc' } });
    return Promise.all(tempatList.map((t) => this.getRekapTempat(t.id, tanggal)));
  }

  async getForActor(userId: string, role: string, tanggal: string, tempatMagangId?: string) {
    if (role === 'GURU') {
      const bimbingan = await this.getBimbinganAktif(userId);
      const byTempat = new Map<string, string[]>();
      for (const b of bimbingan) {
        const list = byTempat.get(b.tempatMagangId) ?? [];
        list.push(b.siswaId);
        byTempat.set(b.tempatMagangId, list);
      }
      if (tempatMagangId) {
        const siswaIds = byTempat.get(tempatMagangId);
        if (!siswaIds) throw new ForbiddenException('Anda bukan pembimbing PKL untuk siswa di tempat ini');
        return [await this.getRekapTempat(tempatMagangId, tanggal, siswaIds)];
      }
      return Promise.all(
        Array.from(byTempat.entries()).map(([tId, siswaIds]) => this.getRekapTempat(tId, tanggal, siswaIds)),
      );
    }

    if (tempatMagangId) return [await this.getRekapTempat(tempatMagangId, tanggal)];
    return this.getAllRekapAdmin(tanggal);
  }

  async getStatusSaya(userId: string, tanggal?: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) return { hasPenempatan: false, sudahAbsen: false, sudahPulang: false, status: null };

    const penempatan = await this.prisma.penempatanMagang.findFirst({
      where: { siswaId: siswa.id, status: 'AKTIF' },
      include: { tempatMagang: true },
    });
    if (!penempatan) return { hasPenempatan: false, sudahAbsen: false, sudahPulang: false, status: null };

    const tgl = tanggal || todayStr();
    const record = await this.prisma.absensiMagang.findUnique({
      where: { penempatanId_tanggal: { penempatanId: penempatan.id, tanggal: tgl } },
    });
    return {
      hasPenempatan: true,
      tempatMagang: penempatan.tempatMagang,
      sudahAbsen: !!record?.waktuAbsen,
      sudahPulang: !!record?.waktuPulang,
      status: record?.status ?? null,
      tanggal: tgl,
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

    const penempatan = await this.prisma.penempatanMagang.findFirst({
      where: { siswaId: siswa.id, status: 'AKTIF' },
    });
    if (!penempatan) throw new BadRequestException('Anda tidak memiliki penempatan PKL yang aktif saat ini');

    const tanggal = todayStr();
    const existing = await this.prisma.absensiMagang.findUnique({
      where: { penempatanId_tanggal: { penempatanId: penempatan.id, tanggal } },
    });

    if (tipe === 'PULANG') {
      if (!extras.fotoUrl) throw new BadRequestException('Foto wajib diisi untuk absen pulang');
      if (!isValidGpsLokasi(extras.lokasi)) throw new BadRequestException('Lokasi (GPS) wajib diisi dan harus berupa koordinat valid untuk absen pulang');
      if (!extras.ttd) throw new BadRequestException('Tanda tangan wajib diisi untuk absen pulang');

      const pulangData = {
        lokasiPulang: extras.lokasi,
        waktuPulang: extras.waktuAbsen,
        ttdPulang: extras.ttd,
        fotoPulang: extras.fotoUrl,
        catatanPulang: extras.catatan,
      };
      return this.prisma.absensiMagang.upsert({
        where: { penempatanId_tanggal: { penempatanId: penempatan.id, tanggal } },
        update: pulangData,
        create: { siswaId: siswa.id, penempatanId: penempatan.id, tempatMagangId: penempatan.tempatMagangId, tanggal, ...pulangData },
      });
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
      if (!isValidGpsLokasi(extras.lokasi)) throw new BadRequestException('Lokasi (GPS) wajib diisi dan harus berupa koordinat valid untuk Izin/Sakit');
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

    return this.prisma.absensiMagang.upsert({
      where: { penempatanId_tanggal: { penempatanId: penempatan.id, tanggal } },
      update: data,
      create: { siswaId: siswa.id, penempatanId: penempatan.id, tempatMagangId: penempatan.tempatMagangId, tanggal, ...data },
    });
  }

  async upsertAbsensi(
    tempatMagangId: string,
    tanggal: string,
    absensi: { siswaId: string; status: string }[],
    actorUserId: string,
    actorRole: string,
  ) {
    const penempatanList = await this.prisma.penempatanMagang.findMany({
      where: { tempatMagangId, status: 'AKTIF' },
      select: { id: true, siswaId: true, guruPembimbingId: true },
    });
    const penempatanBySiswa = new Map(penempatanList.map((p) => [p.siswaId, p]));

    const invalid = absensi.find((a) => !penempatanBySiswa.has(a.siswaId));
    if (invalid) {
      throw new ForbiddenException('Terdapat siswa yang bukan bagian dari penempatan aktif di tempat ini');
    }

    if (actorRole === 'GURU') {
      const guru = await this.prisma.guru.findUnique({ where: { userId: actorUserId } });
      const bukanBimbingan = absensi.find((a) => penempatanBySiswa.get(a.siswaId)!.guruPembimbingId !== guru?.id);
      if (bukanBimbingan) {
        throw new ForbiddenException('Anda hanya bisa mengisi absensi siswa yang Anda bimbing');
      }
    }

    const ops = absensi.map((item) => {
      const penempatan = penempatanBySiswa.get(item.siswaId)!;
      return this.prisma.absensiMagang.upsert({
        where: { penempatanId_tanggal: { penempatanId: penempatan.id, tanggal } },
        update: { status: item.status },
        create: { siswaId: item.siswaId, penempatanId: penempatan.id, tempatMagangId, tanggal, status: item.status },
      });
    });
    const result = await this.prisma.$transaction(ops);

    const tempat = await this.prisma.tempatMagang.findUnique({ where: { id: tempatMagangId }, select: { namaTempat: true } });
    const siswaUsers = await this.prisma.siswa.findMany({
      where: { id: { in: absensi.map((a) => a.siswaId) }, userId: { not: null } },
      select: { userId: true },
    });
    await this.notificationService.createMany(
      siswaUsers.map((s) => s.userId!),
      {
        title:   'Absensi PKL diperbarui',
        message: `Absensi PKL di ${tempat?.namaTempat ?? ''} tanggal ${tanggal} telah diisi`,
        type:    NotificationType.ABSENSI,
        link:    '/magang/absensi',
      },
    );

    return result;
  }
}
