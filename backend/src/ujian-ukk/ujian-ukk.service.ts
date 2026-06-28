import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTahapanDto } from './dto/create-tahapan.dto';
import { TipeUKK } from '../../generated/prisma/client';
import { CreateSoalDto } from './dto/create-soal.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { CreateDiskusiDto } from './dto/create-diskusi.dto';

const INCLUDE_USER = { select: { id: true, nama: true, role: true } };

@Injectable()
export class UjianUkkService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Tahapan ───────────────────────────────────────────────────────────────

  findAllTahapan() {
    return this.prisma.tahapanUKK.findMany({
      orderBy: [{ tanggal: 'asc' }, { hariKe: 'asc' }],
      include: { soal: { select: { id: true, judul: true, deskripsi: true, fileName: true, fileUrl: true } } },
    });
  }

  async findTahapanSaya(userId: string) {
    const SOAL_SELECT = { select: { id: true, judul: true, deskripsi: true, fileName: true, fileUrl: true } };

    // Global container selalu dikembalikan (jadwal & soal files)
    const globalContainer = await this.prisma.tahapanUKK.findFirst({
      where: { hariKe: 0 },
      include: { soal: SOAL_SELECT },
    });

    // Cari siswa yang login
    const siswa = userId
      ? await this.prisma.siswa.findUnique({ where: { userId } })
      : null;

    let taskList: any[] = [];

    if (siswa) {
      // Ambil task yang di-assign ke siswa ini
      const peserta = await this.prisma.pesertaUKK.findMany({
        where: { siswaId: siswa.id },
        include: { tahapan: { include: { soal: SOAL_SELECT } } },
      });
      taskList = peserta.map(p => p.tahapan);
    }

    // Fallback: jika belum ada assignment, tampilkan 1 task pertama sebagai dummy
    if (taskList.length === 0) {
      const firstTask = await this.prisma.tahapanUKK.findFirst({
        where: { hariKe: { gt: 0 } },
        orderBy: { createdAt: 'asc' },
        include: { soal: SOAL_SELECT },
      });
      if (firstTask) taskList = [firstTask];
    }

    const result = [...taskList];
    if (globalContainer) result.unshift(globalContainer);
    return result;
  }

  async createTahapan(dto: CreateTahapanDto) {
    return this.prisma.tahapanUKK.create({
      data: {
        ...dto,
        tipe: TipeUKK.INTERNAL,
        tanggal: new Date(dto.tanggal),
      },
    });
  }

  async updateTahapan(id: string, dto: Partial<CreateTahapanDto>) {
    await this.findTahapanOrFail(id);
    return this.prisma.tahapanUKK.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.tanggal ? { tanggal: new Date(dto.tanggal) } : {}),
      },
    });
  }

  async deleteTahapan(id: string) {
    await this.findTahapanOrFail(id);
    return this.prisma.tahapanUKK.delete({ where: { id } });
  }

  private async findTahapanOrFail(id: string) {
    const t = await this.prisma.tahapanUKK.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tahapan tidak ditemukan');
    return t;
  }

  // ── Soal ──────────────────────────────────────────────────────────────────

  findAllSoal() {
    return this.prisma.soalTahapanUKK.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tahapan: { select: { id: true, judul: true, hariKe: true } },
        _count:  { select: { submisi: true } },
      },
    });
  }

  async createSoal(dto: CreateSoalDto, fileUrl: string, fileName: string) {
    return this.prisma.soalTahapanUKK.create({
      data: { ...dto, fileUrl, fileName },
      include: { tahapan: { select: { id: true, judul: true } } },
    });
  }

  async deleteSoal(id: string) {
    const soal = await this.prisma.soalTahapanUKK.findUnique({ where: { id } });
    if (!soal) throw new NotFoundException('Soal tidak ditemukan');
    return this.prisma.soalTahapanUKK.delete({ where: { id } });
  }

  // ── Submisi Project ───────────────────────────────────────────────────────

  findAllSubmisi() {
    return this.prisma.submisiProjectUKK.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        soal:  { select: { id: true, judul: true } },
        siswa: { include: { user: { select: { id: true, nama: true } } } },
      },
    });
  }

  async findMySubmisi(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) return [];
    return this.prisma.submisiProjectUKK.findMany({
      where: { siswaId: siswa.id },
      orderBy: { submittedAt: 'desc' },
      include: { soal: { select: { id: true, judul: true } } },
    });
  }

  async submitProject(userId: string, dto: SubmitProjectDto, fileUrl: string, fileName: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const soal = await this.prisma.soalTahapanUKK.findUnique({ where: { id: dto.soalId } });
    if (!soal) throw new NotFoundException('Soal tidak ditemukan');

    return this.prisma.submisiProjectUKK.upsert({
      where: { soalId_siswaId: { soalId: dto.soalId, siswaId: siswa.id } },
      create: { soalId: dto.soalId, siswaId: siswa.id, fileUrl, fileName, catatan: dto.catatan },
      update: { fileUrl, fileName, catatan: dto.catatan, status: 'TERKIRIM', updatedAt: new Date() },
      include: { soal: { select: { id: true, judul: true } } },
    });
  }

  async updateStatusSubmisi(id: string, status: 'TERKIRIM' | 'DITERIMA' | 'REVISI', pesanRevisi?: string) {
    const submisi = await this.prisma.submisiProjectUKK.findUnique({ where: { id } });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    return this.prisma.submisiProjectUKK.update({
      where: { id },
      data: {
        status,
        pesanRevisi: status === 'REVISI' ? (pesanRevisi ?? null) : null,
      },
    });
  }

  // ── Diskusi ───────────────────────────────────────────────────────────────

  findAllDiskusi() {
    return this.prisma.diskusiUKK.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: INCLUDE_USER,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: INCLUDE_USER },
        },
      },
    });
  }

  createDiskusi(userId: string, dto: CreateDiskusiDto) {
    return this.prisma.diskusiUKK.create({
      data: { userId, konten: dto.konten, parentId: dto.parentId ?? null },
      include: { user: INCLUDE_USER },
    });
  }

  async deleteDiskusi(id: string, userId: string, userRole: string) {
    const d = await this.prisma.diskusiUKK.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Diskusi tidak ditemukan');
    if (d.userId !== userId && userRole !== 'ADMIN') throw new ForbiddenException();
    return this.prisma.diskusiUKK.delete({ where: { id } });
  }

  // ── Absensi UKK ──────────────────────────────────────────────────────────

  async getAbsensiByTahapan(tahapanId: string, tanggal: string) {
    const tahapan = await this.prisma.tahapanUKK.findUnique({ where: { id: tahapanId } });
    if (!tahapan) throw new NotFoundException('Tahapan tidak ditemukan');

    // Ambil semua siswa yang di-assign ke tahapan ini; fallback: semua siswa
    const peserta = await this.prisma.pesertaUKK.findMany({
      where: { tahapanId },
      include: { siswa: { include: { user: { select: { id: true, nama: true } } } } },
      orderBy: { siswa: { nama: 'asc' } },
    });

    const existing = await this.prisma.absensiUKK.findMany({
      where: { tahapanId, tanggal },
    });
    const docMap = new Map(existing.map((a) => [a.siswaId, a]));

    const rekap = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    const siswaList = peserta.map(({ siswa: s }) => {
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

    return { tahapanId, tahapan, tanggal, rekap, siswa: siswaList };
  }

  async getAllAbsensi(tanggal: string) {
    const tahapanList = await this.prisma.tahapanUKK.findMany({
      where: { hariKe: { gt: 0 } },
      orderBy: { hariKe: 'asc' },
    });

    return Promise.all(tahapanList.map((t) => this.getAbsensiByTahapan(t.id, tanggal)));
  }

  async getStatusAbsensiSaya(userId: string, tahapanId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) return { sudahAbsen: false, status: null };
    const today = new Date().toISOString().split('T')[0];
    const record = await this.prisma.absensiUKK.findUnique({
      where: { tahapanId_siswaId_tanggal: { tahapanId, siswaId: siswa.id, tanggal: today } },
    });
    return { sudahAbsen: !!record, status: record?.status ?? null, tanggal: today, record };
  }

  async absenSendiriUkk(
    userId: string,
    tahapanId: string,
    extras: { lokasi?: string; waktuAbsen?: string; ttd?: string; fotoUrl?: string; catatan?: string } = {},
  ) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    const today = new Date().toISOString().split('T')[0];
    const data = {
      status: 'HADIR',
      lokasi: extras.lokasi,
      waktuAbsen: extras.waktuAbsen,
      ttd: extras.ttd,
      foto: extras.fotoUrl,
      catatan: extras.catatan,
    };
    return this.prisma.absensiUKK.upsert({
      where: { tahapanId_siswaId_tanggal: { tahapanId, siswaId: siswa.id, tanggal: today } },
      update: data,
      create: { tahapanId, siswaId: siswa.id, tanggal: today, ...data },
    });
  }

  async upsertAbsensiUkk(tahapanId: string, tanggal: string, absensi: { siswaId: string; status: string }[]) {
    const ops = absensi.map((item) =>
      this.prisma.absensiUKK.upsert({
        where: { tahapanId_siswaId_tanggal: { tahapanId, siswaId: item.siswaId, tanggal } },
        update: { status: item.status },
        create: { tahapanId, siswaId: item.siswaId, tanggal, status: item.status },
      }),
    );
    return this.prisma.$transaction(ops);
  }
}
