import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KelasService } from '../kelas/kelas.service';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

@Injectable()
export class AbsensiHarianService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kelasService: KelasService,
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
    const siswa = siswaList.map((s) => {
      const doc = docMap.get(s.id) ?? null;
      const status = doc?.status ?? null;
      if (status && status in rekap) rekap[status as keyof typeof rekap]++;
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
      };
    });

    return { kelasId, kelas, tanggal, rekap, siswa };
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

    // ADMIN
    if (kelasId) return [await this.getRekapKelas(kelasId, tanggal)];
    return this.getAllRekap(tanggal, userId, role);
  }

  async getStatusSaya(userId: string, tanggal?: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) return { sudahAbsen: false, status: null };
    const tgl = tanggal || todayStr();
    const record = await this.prisma.absensiHarian.findUnique({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal: tgl } },
    });
    return { sudahAbsen: !!record, status: record?.status ?? null, tanggal: tgl, record };
  }

  async absenSendiri(
    userId: string,
    extras: { lokasi?: string; waktuAbsen?: string; ttd?: string; fotoUrl?: string; catatan?: string } = {},
  ) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    const tanggal = todayStr();
    const data = {
      status: 'HADIR',
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
    return this.prisma.$transaction(ops);
  }
}
