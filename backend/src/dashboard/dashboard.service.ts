import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekDates() {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStats() {
    const today = todayStr();
    const dates = weekDates();

    const [
      totalSiswa,
      totalGuru,
      totalJadwal,
      pengumuman,
      submisiTerbaru,
      absensiHariIni,
      absensiWeekRaw,
      kelasDistinct,
    ] = await Promise.all([
      this.prisma.siswa.count(),
      this.prisma.guru.count(),
      this.prisma.jadwalKelas.count(),
      this.prisma.pengumuman.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, nama: true, role: true } },
          _count: { select: { komentar: true } },
        },
      }),
      this.prisma.submisiTugas.findMany({
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          siswa: { select: { nama: true } },
          tugas: {
            select: {
              judul: true,
              jadwalKelas: { select: { mataPelajaran: true, kelas: true } },
            },
          },
        },
      }),
      this.prisma.absensiKelas.findMany({
        where: { tanggal: today },
        select: { status: true },
      }),
      this.prisma.absensiKelas.findMany({
        where: { tanggal: { in: dates } },
        select: { tanggal: true, status: true },
      }),
      this.prisma.siswa.findMany({
        distinct: ['kelas'],
        select: { kelas: true },
      }),
    ]);

    const hadirHariIni = absensiHariIni.filter((a) => a.status === 'HADIR').length;
    const totalAbsensiHariIni = absensiHariIni.length;

    const weeklyAbsensi = dates.map((date, i) => ({
      hari: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'][i],
      date,
      hadir: absensiWeekRaw.filter((a) => a.tanggal === date && a.status === 'HADIR').length,
      total: absensiWeekRaw.filter((a) => a.tanggal === date).length,
    }));

    const absensiPerKelasRaw = await this.prisma.absensiKelas.findMany({
      where: { tanggal: today },
      select: {
        status: true,
        jadwalKelas: { select: { kelas: true } },
      },
    });

    const kelasGroups: Record<string, { hadir: number; total: number }> = {};
    absensiPerKelasRaw.forEach((a) => {
      const k = (a as any).jadwalKelas?.kelas ?? '';
      if (!k) return;
      if (!kelasGroups[k]) kelasGroups[k] = { hadir: 0, total: 0 };
      kelasGroups[k].total++;
      if (a.status === 'HADIR') kelasGroups[k].hadir++;
    });

    const siswaCountPerKelas = await this.prisma.siswa.groupBy({
      by: ['kelas'],
      _count: { _all: true },
    });
    const siswaMap: Record<string, number> = Object.fromEntries(
      siswaCountPerKelas.map((s) => [s.kelas, s._count._all]),
    );

    const kehadiranPerKelas = Object.entries(kelasGroups)
      .map(([kelas, { hadir, total }]) => {
        const totalSiswa = siswaMap[kelas] ?? total;
        return {
          kelas,
          totalSiswa,
          hadir,
          tidakHadir: total - hadir,
          persentase: totalSiswa > 0 ? Math.round((hadir / totalSiswa) * 100) : 0,
        };
      })
      .sort((a, b) => a.kelas.localeCompare(b.kelas));

    return {
      totalSiswa,
      totalGuru,
      totalKelas: kelasDistinct.length,
      totalJadwal,
      kehadiran: {
        hadir: hadirHariIni,
        total: totalAbsensiHariIni,
        persen: totalAbsensiHariIni > 0 ? Math.round((hadirHariIni / totalAbsensiHariIni) * 100) : 0,
      },
      weeklyAbsensi,
      pengumuman,
      submisiTerbaru,
      kehadiranPerKelas,
    };
  }

  async getGuruStats(userId: string) {
    const guru = await this.prisma.guru.findUnique({ where: { userId } });
    if (!guru) return { error: 'Profil guru tidak ditemukan' };

    const today = HARI_NAMES[new Date().getDay()];
    const todayDate = todayStr();

    const [
      jadwalTotal,
      materiTotal,
      tugasTotal,
      jadwalHariIni,
      semuaJadwalGuru,
      submisiTerbaru,
      pengumuman,
      absensiHariIniPerJadwal,
    ] = await Promise.all([
      this.prisma.jadwalKelas.count({ where: { guruId: guru.id } }),
      this.prisma.materiKelas.count({ where: { jadwalKelas: { guruId: guru.id } } }),
      this.prisma.tugasKelas.count({ where: { jadwalKelas: { guruId: guru.id } } }),
      this.prisma.jadwalKelas.findMany({
        where: { guruId: guru.id, hari: today },
        orderBy: { jamMulai: 'asc' },
      }),
      this.prisma.jadwalKelas.findMany({
        where: { guruId: guru.id },
        select: { id: true, slug: true, mataPelajaran: true, kelas: true },
      }),
      this.prisma.submisiTugas.findMany({
        where: { tugas: { jadwalKelas: { guruId: guru.id } } },
        include: {
          siswa: { select: { nama: true } },
          tugas: {
            select: {
              judul: true,
              jadwalKelas: { select: { mataPelajaran: true, kelas: true } },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),
      this.prisma.pengumuman.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, nama: true, role: true } },
          _count: { select: { komentar: true } },
        },
      }),
      this.prisma.absensiKelas.findMany({
        where: { tanggal: todayDate, jadwalKelas: { guruId: guru.id } },
        select: { jadwalKelasId: true, status: true },
      }),
    ]);

    // Siswa count per kelas
    const uniqueKelas = [...new Set(semuaJadwalGuru.map((j) => j.kelas))];
    const siswaKelasRaw = uniqueKelas.length > 0
      ? await this.prisma.siswa.groupBy({
          by: ['kelas'],
          where: { kelas: { in: uniqueKelas } },
          _count: { _all: true },
        })
      : [];
    const siswaPerKelas: Record<string, number> = Object.fromEntries(
      siswaKelasRaw.map((s) => [s.kelas, s._count._all]),
    );

    // Kehadiran per jadwal hari ini
    const kehadiranPerMapel = semuaJadwalGuru.map((jadwal) => {
      const absensiJadwal = absensiHariIniPerJadwal.filter((a) => a.jadwalKelasId === jadwal.id);
      const hadir = absensiJadwal.filter((a) => a.status === 'HADIR').length;
      const totalAbsensi = absensiJadwal.length;
      const totalSiswa = siswaPerKelas[jadwal.kelas] ?? 0;
      return {
        jadwalKelasId: jadwal.id,
        slug: jadwal.slug,
        mataPelajaran: jadwal.mataPelajaran,
        kelas: jadwal.kelas,
        totalSiswa,
        hadir,
        tidakHadir: totalAbsensi - hadir,
        persentase: totalSiswa > 0 ? Math.round((hadir / totalSiswa) * 100) : 0,
      };
    });

    // Aggregate untuk donut
    const totalHadir = kehadiranPerMapel.reduce((s, k) => s + k.hadir, 0);
    const totalSiswaAll = kehadiranPerMapel.reduce((s, k) => s + k.totalSiswa, 0);
    const kehadiran = {
      hadir: totalHadir,
      total: totalSiswaAll,
      persen: totalSiswaAll > 0 ? Math.round((totalHadir / totalSiswaAll) * 100) : 0,
    };

    const siswaAmpu = Object.values(siswaPerKelas).reduce((s, c) => s + c, 0);

    return {
      siswaAmpu,
      jadwalTotal,
      materiTotal,
      tugasTotal,
      jadwalHariIni,
      submisiTerbaru,
      pengumuman,
      kehadiran,
      kehadiranPerMapel,
    };
  }

  async getSiswaStats(userId: string) {
    const siswaRecord = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswaRecord) return { error: 'Profil siswa tidak ditemukan' };

    const today = HARI_NAMES[new Date().getDay()];
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      absensiList,
      jadwalHariIni,
      tugasBelumDikumpulkan,
      tugasTotal,
      tugasDikumpulkan,
      pengumuman,
    ] = await Promise.all([
      this.prisma.absensiKelas.findMany({
        where: { siswaId: userId },
        select: { status: true },
      }),
      this.prisma.jadwalKelas.findMany({
        where: { kelas: siswaRecord.kelas, hari: today },
        include: {
          guru: { include: { user: { select: { nama: true } } } },
        },
        orderBy: { jamMulai: 'asc' },
      }),
      this.prisma.tugasKelas.findMany({
        where: {
          jadwalKelas: { kelas: siswaRecord.kelas },
          deadline: { gte: now, lte: sevenDays },
          submisi: { none: { siswaId: userId } },
        },
        include: { jadwalKelas: { select: { mataPelajaran: true } } },
        orderBy: { deadline: 'asc' },
        take: 5,
      }),
      this.prisma.tugasKelas.count({
        where: { jadwalKelas: { kelas: siswaRecord.kelas } },
      }),
      this.prisma.submisiTugas.count({ where: { siswaId: userId } }),
      this.prisma.pengumuman.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, nama: true, role: true } },
          _count: { select: { komentar: true } },
        },
      }),
    ]);

    const hadir = absensiList.filter((a) => a.status === 'HADIR').length;
    const izin  = absensiList.filter((a) => a.status === 'IZIN').length;
    const alpa  = absensiList.filter((a) => a.status === 'ALPA').length;
    const totalAbsensi = absensiList.length;
    const persentase = totalAbsensi > 0 ? Math.round((hadir / totalAbsensi) * 1000) / 10 : 0;

    return {
      kelas: siswaRecord.kelas,
      absensi: { hadir, izin, alpa, total: totalAbsensi, persentase },
      jadwalHariIni,
      tugasBelumDikumpulkan,
      tugasProgress: { total: tugasTotal, dikumpulkan: tugasDikumpulkan },
      pengumuman,
    };
  }
}
