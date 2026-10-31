import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTahapanDto } from './dto/create-tahapan.dto';
import { NotificationType, TipeUKK } from '../../generated/prisma/client';
import { CreateSoalDto } from './dto/create-soal.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { CreateDiskusiDto } from './dto/create-diskusi.dto';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { NotificationService } from '../notification/notification.service';
import { unlink } from 'fs';
import { join } from 'path';

const INCLUDE_USER = { select: { id: true, nama: true, role: true } };

@Injectable()
export class UjianUkkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drive: GoogleDriveService,
    private readonly notificationService: NotificationService,
  ) {}

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
      where: { status: { not: 'REVISI' } },
      orderBy: { submittedAt: 'desc' },
      include: {
        soal:  { select: { id: true, judul: true } },
        tahapan: { select: { id: true, judul: true } },
        siswa: { include: { user: { select: { id: true, nama: true } }, kelas: { select: { id: true, nama: true } } } },
      },
    });
  }

  async findSubmisiById(id: string) {
    const row = await this.prisma.submisiProjectUKK.findUnique({ where: { id }, select: { id: true, fileUrl: true, fileName: true } });
    if (!row) throw new NotFoundException('Pengumpulan tidak ditemukan');
    return row;
  }

  submisiUntukZip(filter: { tahapanId?: string; kelasId?: string }) {
    return this.prisma.submisiProjectUKK.findMany({
      where: {
        status: { not: 'REVISI' },
        ...(filter.tahapanId ? { tahapanId: filter.tahapanId } : {}),
        ...(filter.kelasId ? { siswa: { kelasId: filter.kelasId } } : {}),
      },
      orderBy: { submittedAt: 'asc' },
      include: {
        tahapan: { select: { judul: true } },
        siswa: { select: { nama: true, kelas: { select: { nama: true } } } },
      },
    });
  }

  async pesertaKelasXII() {
    const kelas = await this.prisma.kelas.findMany({
      where: { nama: { startsWith: 'XII', mode: 'insensitive' } },
      orderBy: { nama: 'asc' },
      select: {
        id: true,
        nama: true,
        siswa: {
          where: { status: 'AKTIF' },
          orderBy: { nama: 'asc' },
          select: { id: true, nama: true, nis: true, user: { select: { nama: true } } },
        },
      },
    });
    return kelas.filter((k) => /^XII(\s|$)/i.test(k.nama));
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
      where: { siswaId: siswa.id, status: { not: 'REVISI' } },
      orderBy: { submittedAt: 'desc' },
      include: {
        soal: { select: { id: true, judul: true } },
        tahapan: { select: { id: true, judul: true } },
      },
    });
  }

  async submitProject(userId: string, dto: SubmitProjectDto, fileUrl: string, fileName: string, localPath?: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId }, include: { kelas: { select: { nama: true } } } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const soal = await this.prisma.soalTahapanUKK.findUnique({ where: { id: dto.soalId } });
    if (!soal) throw new NotFoundException('Soal tidak ditemukan');

    const task = await this.prisma.tahapanUKK.findUnique({ where: { id: dto.tahapanId } });
    if (!task || task.hariKe === 0) throw new NotFoundException('Task tidak ditemukan');

    const ymd = (d: Date) => d.toISOString().slice(0, 10);
    const buka = new Date(`${ymd(task.tanggal)}T${task.jamMulai}:00+07:00`);
    const tutup = new Date(`${ymd(task.tanggalSelesai ?? task.tanggal)}T${task.jamSelesai}:00+07:00`);
    const label = (d: Date) =>
      new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d) + ' WIB';
    const sekarang = new Date();
    if (!Number.isNaN(buka.getTime()) && sekarang < buka) {
      throw new BadRequestException(`Pengumpulan task "${task.judul}" belum dibuka. Dibuka ${label(buka)}.`);
    }
    if (!Number.isNaN(tutup.getTime()) && sekarang > tutup) {
      throw new BadRequestException(`Waktu pengumpulan task "${task.judul}" sudah berakhir (${label(tutup)}).`);
    }

    const akhir = task.tanggalSelesai ?? task.tanggal;
    const kembar = await this.prisma.submisiProjectUKK.findFirst({
      where: {
        siswaId: siswa.id,
        tahapanId: { not: task.id },
        status: { not: 'REVISI' },
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
    if (ada && ada.status === 'TERKIRIM') {
      throw new BadRequestException(`Pengiriman task "${task.judul}" masih menunggu persetujuan admin. Kamu bisa mengirim lagi jika file ditolak.`);
    }
    if (ada && ada.status === 'DITERIMA') {
      throw new BadRequestException(`Pengiriman task "${task.judul}" sudah diterima admin.`);
    }
    const simpan = ada
      ? await this.prisma.submisiProjectUKK.update({
          where: { id: ada.id },
          data: { soalId: dto.soalId, fileUrl, fileName, catatan: dto.catatan, status: 'TERKIRIM', pesanRevisi: null, submittedAt: new Date(), updatedAt: new Date(), driveFileId: null, driveUrl: null, driveFolderUrl: null },
          include,
        })
      : await this.prisma.submisiProjectUKK.create({
          data: { soalId: dto.soalId, tahapanId: task.id, siswaId: siswa.id, fileUrl, fileName, catatan: dto.catatan },
          include,
        });

    if (localPath && this.drive.isConfigured()) {
      try {
        const bersih = (s: string) => s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
        const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
        const namaFile = `${bersih(siswa.nama ?? 'Siswa')} - ${bersih(task.judul)}${ext}`;
        const hasil = await this.drive.uploadKeFolderKelas({
          kelasNama: bersih(siswa.kelas?.nama ?? 'Tanpa Kelas'),
          fileName: namaFile,
          localPath,
        });
        return await this.prisma.submisiProjectUKK.update({
          where: { id: simpan.id },
          data: { driveFileId: hasil.fileId, driveUrl: hasil.fileUrl, driveFolderUrl: hasil.folderUrl },
          include,
        });
      } catch (e) {
        console.error('[UKK] Gagal unggah ke Google Drive:', (e as Error).message);
      }
    }
    return simpan;
  }

  async updateStatusSubmisi(id: string, status: 'TERKIRIM' | 'DITERIMA' | 'REVISI', pesanRevisi?: string) {
    if (status !== 'DITERIMA' && status !== 'REVISI') throw new BadRequestException('Status harus DITERIMA atau REVISI');
    const submisi = await this.prisma.submisiProjectUKK.findUnique({
      where: { id },
      include: { tahapan: { select: { judul: true } }, siswa: { select: { userId: true } } },
    });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    if (submisi.status === 'DITERIMA' && status === 'REVISI') throw new BadRequestException('Pengiriman yang sudah diterima tidak bisa ditolak');
    if (submisi.status === 'REVISI' && status === 'DITERIMA') throw new BadRequestException('Pengiriman yang sudah ditolak tidak bisa diterima, tunggu siswa mengirim ulang');
    const alasan = status === 'REVISI' ? (pesanRevisi ?? '').trim() : '';
    if (status === 'REVISI' && !alasan) throw new BadRequestException('Alasan penolakan wajib diisi');
    const hasil = status === 'REVISI'
      ? await this.prisma.submisiProjectUKK.delete({ where: { id } })
      : await this.prisma.submisiProjectUKK.update({ where: { id }, data: { status, pesanRevisi: null } });
    if (status === 'REVISI' && submisi.fileUrl.startsWith('/uploads/')) {
      unlink(join(process.cwd(), submisi.fileUrl), () => undefined);
    }
    const judul = submisi.tahapan?.judul ?? 'UKK';
    if (submisi.siswa?.userId) {
      void this.notificationService.create(
        status === 'DITERIMA'
          ? {
              userId: submisi.siswa.userId,
              title: 'Project UKK diterima',
              message: `Pengiriman task "${judul}" telah diterima admin.`,
              type: NotificationType.UKK,
              link: '/ujian-ukk/jadwal-soal',
            }
          : {
              userId: submisi.siswa.userId,
              title: 'Project UKK ditolak',
              message: `Pengiriman task "${judul}" ditolak. Alasan: ${alasan}. Silakan kirim ulang.`,
              type: NotificationType.UKK,
              link: '/ujian-ukk/jadwal-soal',
            },
      ).catch(() => undefined);
    }
    return hasil;
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
