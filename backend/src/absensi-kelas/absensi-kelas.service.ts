import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAbsensiDto } from './dto/upsert-absensi.dto';

@Injectable()
export class AbsensiKelasService {
  constructor(private readonly prisma: PrismaService) {}

  async getByJadwalAndTanggal(jadwalKelasId: string, tanggal: string) {
    const jadwal = await this.prisma.jadwalKelas.findUnique({
      where: { id: jadwalKelasId },
    });
    if (!jadwal) throw new NotFoundException('Jadwal tidak ditemukan');

    const allSiswa = await this.prisma.siswa.findMany({
      where: { kelas: jadwal.kelas },
      include: { user: { select: { id: true, nama: true } } },
      orderBy: { nama: 'asc' },
    });

    const existing = await this.prisma.absensiKelas.findMany({
      where: { jadwalKelasId, tanggal },
      select: {
        siswaId: true,
        status: true,
        waktuAbsen: true,
        lokasi: true,
        foto: true,
        ttd: true,
      },
    });

    const docMap = new Map(existing.map((a) => [a.siswaId, a]));

    const rekap = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    const siswaList = allSiswa.map((s) => {
      const doc = s.userId ? (docMap.get(s.userId) ?? null) : null;
      const status = doc?.status ?? null;
      if (status && status in rekap) rekap[status as keyof typeof rekap]++;
      return {
        userId: s.userId,
        nama: s.user?.nama ?? s.nama,
        status,
        waktuAbsen: doc?.waktuAbsen ?? null,
        lokasi: doc?.lokasi ?? null,
        foto: doc?.foto ?? null,
        ttd: doc?.ttd ?? null,
      };
    });

    return { jadwalKelasId, tanggal, rekap, siswa: siswaList };
  }

  async getStatusSaya(userId: string, jadwalKelasId: string) {
    const today = new Date().toISOString().split('T')[0];
    const record = await this.prisma.absensiKelas.findUnique({
      where: {
        jadwalKelasId_siswaId_tanggal: { jadwalKelasId, siswaId: userId, tanggal: today },
      },
    });
    return { sudahAbsen: !!record, status: record?.status ?? null, tanggal: today };
  }

  async absenSendiri(
    userId: string,
    jadwalKelasId: string,
    extras: { lokasi?: string; waktuAbsen?: string; ttd?: string; fotoUrl?: string } = {},
  ) {
    const jadwal = await this.prisma.jadwalKelas.findUnique({ where: { id: jadwalKelasId } });
    if (!jadwal) throw new NotFoundException('Jadwal tidak ditemukan');
    const today = new Date().toISOString().split('T')[0];
    const data = {
      status: 'HADIR',
      lokasi: extras.lokasi,
      waktuAbsen: extras.waktuAbsen,
      ttd: extras.ttd,
      foto: extras.fotoUrl,
    };
    return this.prisma.absensiKelas.upsert({
      where: {
        jadwalKelasId_siswaId_tanggal: { jadwalKelasId, siswaId: userId, tanggal: today },
      },
      update: data,
      create: { jadwalKelasId, siswaId: userId, tanggal: today, ...data },
    });
  }

  async upsert(dto: UpsertAbsensiDto) {
    const ops = dto.absensi.map((item) =>
      this.prisma.absensiKelas.upsert({
        where: {
          jadwalKelasId_siswaId_tanggal: {
            jadwalKelasId: dto.jadwalKelasId,
            siswaId: item.siswaId,
            tanggal: dto.tanggal,
          },
        },
        update: { status: item.status },
        create: {
          jadwalKelasId: dto.jadwalKelasId,
          siswaId: item.siswaId,
          tanggal: dto.tanggal,
          status: item.status,
        },
      }),
    );
    return this.prisma.$transaction(ops);
  }
}
