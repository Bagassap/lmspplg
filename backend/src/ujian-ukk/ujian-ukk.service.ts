import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  findAllTahapan() {
    return this.prisma.tahapanUKK.findMany({
      orderBy: [{ tanggal: 'asc' }, { hariKe: 'asc' }],
      include: { soal: { select: { id: true, judul: true, deskripsi: true, fileName: true, fileUrl: true } } },
    });
  }

  async findTahapanSaya(userId: string) {
    const SOAL_SELECT = { select: { id: true, judul: true, deskripsi: true, fileName: true, fileUrl: true } };

    const globalContainer = await this.prisma.tahapanUKK.findFirst({
      where: { hariKe: 0 },
      include: { soal: SOAL_SELECT },
    });

    const siswa = userId
      ? await this.prisma.siswa.findUnique({ where: { userId } })
      : null;

    let taskList: any[] = [];

    if (siswa) {
      const peserta = await this.prisma.pesertaUKK.findMany({
        where: { siswaId: siswa.id },
        include: { tahapan: { include: { soal: SOAL_SELECT } } },
      });
      taskList = peserta.map(p => p.tahapan);
    }

    // Belum ada pembagian peserta khusus: semua siswa melihat seluruh task UKK.
    if (taskList.length === 0) {
      taskList = await this.prisma.tahapanUKK.findMany({
        where: { hariKe: { gt: 0 } },
        orderBy: [{ tanggal: 'asc' }, { hariKe: 'asc' }],
        include: { soal: SOAL_SELECT },
      });
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
        tanggalSelesai: dto.tanggalSelesai ? new Date(dto.tanggalSelesai) : null,
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
        ...(dto.tanggalSelesai !== undefined ? { tanggalSelesai: dto.tanggalSelesai ? new Date(dto.tanggalSelesai) : null } : {}),
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

  findAllSoal() {
    return this.prisma.soalTahapanUKK.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tahapan: { select: { id: true, judul: true, hariKe: true } },
        _count:  { select: { submisi: true } },
      },
    });
  }

  // Wadah umum (hariKe:0) menampung file Jadwal/Soal yang tidak terikat ke
  // task harian tertentu — dibuat sekali secara lazy saat admin mengupload
  // file pertamanya, bukan lewat seed manual. Tanpa ini, upload pertama di
  // instalasi baru gagal senyap: frontend butuh tahapanId sebelum submit,
  // tapi belum ada tahapan hariKe:0 untuk diambil id-nya.
  private async getOrCreateGlobalContainer() {
    const existing = await this.prisma.tahapanUKK.findFirst({ where: { hariKe: 0 } });
    if (existing) return existing;
    return this.prisma.tahapanUKK.create({
      data: {
        hariKe: 0,
        tipe: TipeUKK.INTERNAL,
        judul: 'Berkas Umum UKK',
        tanggal: new Date(),
        jamMulai: '00:00',
        jamSelesai: '23:59',
        lokasi: '-',
      },
    });
  }

  async createSoal(dto: CreateSoalDto, fileUrl: string, fileName: string) {
    const tahapanId = dto.tahapanId || (await this.getOrCreateGlobalContainer()).id;
    return this.prisma.soalTahapanUKK.create({
      data: { ...dto, tahapanId, fileUrl, fileName },
      include: { tahapan: { select: { id: true, judul: true } } },
    });
  }

  async deleteSoal(id: string) {
    const soal = await this.prisma.soalTahapanUKK.findUnique({ where: { id } });
    if (!soal) throw new NotFoundException('Soal tidak ditemukan');
    return this.prisma.soalTahapanUKK.delete({ where: { id } });
  }

  findAllSubmisi() {
    return this.prisma.submisiProjectUKK.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        soal:  { select: { id: true, judul: true } },
        tahapan: { select: { id: true, judul: true } },
        siswa: { include: { user: { select: { id: true, nama: true } }, kelas: { select: { id: true, nama: true } } } },
      },
    });
  }

  async getSubmisiForExport() {
    const kelasList = await this.prisma.kelas.findMany({
      orderBy: { nama: 'asc' },
      include: {
        siswa: {
          orderBy: { nama: 'asc' },
          include: {
            submisiProjectUkk: {
              orderBy: { submittedAt: 'asc' },
              include: { soal: { select: { judul: true } } },
            },
          },
        },
      },
    });
    return kelasList.map((k) => ({ kelas: { nama: k.nama }, siswa: k.siswa }));
  }

  async findMySubmisi(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) return [];
    return this.prisma.submisiProjectUKK.findMany({
      where: { siswaId: siswa.id },
      orderBy: { submittedAt: 'desc' },
      include: {
        soal: { select: { id: true, judul: true } },
        tahapan: { select: { id: true, judul: true } },
      },
    });
  }

  async submitProject(userId: string, dto: SubmitProjectDto, fileUrl: string, fileName: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const soal = await this.prisma.soalTahapanUKK.findUnique({ where: { id: dto.soalId } });
    if (!soal) throw new NotFoundException('Soal tidak ditemukan');

    const task = await this.prisma.tahapanUKK.findUnique({ where: { id: dto.tahapanId } });
    if (!task || task.hariKe === 0) throw new NotFoundException('Task tidak ditemukan');

    // Satu hari hanya boleh mengirim untuk satu task: tolak jika siswa sudah
    // mengirim untuk task lain yang rentang tanggalnya beririsan.
    const akhir = task.tanggalSelesai ?? task.tanggal;
    const kembar = await this.prisma.submisiProjectUKK.findFirst({
      where: {
        siswaId: siswa.id,
        tahapanId: { not: task.id },
        tahapan: { tanggal: { lte: akhir }, OR: [{ tanggalSelesai: { gte: task.tanggal } }, { tanggalSelesai: null, tanggal: { gte: task.tanggal } }] },
      },
      include: { tahapan: { select: { judul: true } } },
    });
    if (kembar) {
      throw new BadRequestException(
        `Kamu sudah mengirim project untuk task "${kembar.tahapan?.judul ?? 'lain'}" di hari yang sama. Dalam satu hari hanya bisa mengirim untuk satu task.`,
      );
    }

    const include = {
      soal: { select: { id: true, judul: true } },
      tahapan: { select: { id: true, judul: true } },
    };
    const ada = await this.prisma.submisiProjectUKK.findFirst({ where: { tahapanId: task.id, siswaId: siswa.id } });
    if (ada) {
      return this.prisma.submisiProjectUKK.update({
        where: { id: ada.id },
        data: { soalId: dto.soalId, fileUrl, fileName, catatan: dto.catatan, status: 'TERKIRIM', updatedAt: new Date() },
        include,
      });
    }
    return this.prisma.submisiProjectUKK.create({
      data: { soalId: dto.soalId, tahapanId: task.id, siswaId: siswa.id, fileUrl, fileName, catatan: dto.catatan },
      include,
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

}
