import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { todayJakarta } from '../common/utils/jakarta-date.util';
import { AjukanPenempatanDto, TetapkanGuruDto, UpdatePenempatanDto } from './dto/create-penempatan.dto';

const INCLUDE_DETAIL = {
  siswa: {
    select: {
      id: true,
      nis: true,
      nama: true,
      kelas: { select: { id: true, nama: true } },
      user: { select: { id: true, nama: true, fotoProfil: true } },
    },
  },
  tempatMagang: true,
  guruPembimbing: { select: { id: true, user: { select: { id: true, nama: true } } } },
} as const;

type StatusP = 'MENUNGGU' | 'AKTIF' | 'SELESAI' | 'BATAL';
const AKTIF_ATAU_MENUNGGU: ('MENUNGGU' | 'AKTIF')[] = ['MENUNGGU', 'AKTIF'];

@Injectable()
export class PenempatanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  findAll(query: { status?: string; tempatMagangId?: string; kelasId?: string }) {
    return this.prisma.penempatanMagang.findMany({
      where: {
        ...(query.status ? { status: query.status as StatusP } : {}),
        ...(query.tempatMagangId ? { tempatMagangId: query.tempatMagangId } : {}),
        ...(query.kelasId ? { siswa: { kelasId: query.kelasId } } : {}),
      },
      include: INCLUDE_DETAIL,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSaya(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) return [];
    return this.prisma.penempatanMagang.findMany({
      where: { siswaId: siswa.id },
      include: INCLUDE_DETAIL,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBimbingan(userId: string) {
    const guru = await this.prisma.guru.findUnique({ where: { userId } });
    if (!guru) return [];
    return this.prisma.penempatanMagang.findMany({
      where: { guruPembimbingId: guru.id },
      include: INCLUDE_DETAIL,
      orderBy: { createdAt: 'desc' },
    });
  }

  async ajukan(userId: string, dto: AjukanPenempatanDto, surat: { url: string; nama: string }) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId },
      include: { user: { select: { nama: true } }, pendaftaranMagang: { select: { status: true } } },
    });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    if (siswa.pendaftaranMagang?.status !== 'DITERIMA') {
      throw new BadRequestException('Pendaftaran PKL kamu belum diverifikasi admin');
    }

    const bentrok = await this.prisma.penempatanMagang.findFirst({
      where: { siswaId: siswa.id, status: { in: AKTIF_ATAU_MENUNGGU } },
    });
    if (bentrok) throw new BadRequestException('Kamu sudah memiliki pengajuan/penempatan PKL');

    let tempatId: string;
    let namaTempat: string;
    if (dto.tempatMagangId) {
      const tempat = await this.prisma.tempatMagang.findUnique({
        where: { id: dto.tempatMagangId },
        include: { _count: { select: { penempatan: { where: { status: { in: AKTIF_ATAU_MENUNGGU } } } } } },
      });
      if (!tempat) throw new NotFoundException('Instansi tidak ditemukan');
      if (tempat.dibuatSiswa) {
        if (tempat._count.penempatan + 1 > tempat.kuota) {
          await this.prisma.tempatMagang.update({ where: { id: tempat.id }, data: { kuota: tempat._count.penempatan + 1 } });
        }
      } else if (tempat.kuota - tempat._count.penempatan < 1) {
        throw new BadRequestException(`Kuota "${tempat.namaTempat}" sudah penuh`);
      }
      tempatId = tempat.id;
      namaTempat = tempat.namaTempat;
    } else if (dto.tempatBaru) {
      const t = dto.tempatBaru;
      const v = {
        dukuh: t.dukuh.trim(), rt: t.rt.trim(), rw: t.rw.trim(),
        desa: t.desa.trim(), kecamatan: t.kecamatan.trim(), kabupaten: t.kabupaten.trim(),
      };
      const alamat = `Dukuh ${v.dukuh} RT ${v.rt}/RW ${v.rw}, Desa ${v.desa}, Kec. ${v.kecamatan}, Kab. ${v.kabupaten}`;
      const ada = await this.prisma.tempatMagang.findFirst({
        where: { namaTempat: { equals: t.namaTempat.trim(), mode: 'insensitive' } },
        include: { _count: { select: { penempatan: { where: { status: { in: AKTIF_ATAU_MENUNGGU } } } } } },
      });
      if (ada) {
        if (!ada.dibuatSiswa && ada.kuota - ada._count.penempatan < 1) {
          throw new BadRequestException(`Kuota "${ada.namaTempat}" sudah penuh`);
        }
        const kosong = !ada.desa || !ada.kecamatan || !ada.kabupaten;
        await this.prisma.tempatMagang.update({
          where: { id: ada.id },
          data: {
            ...(kosong ? { ...v, alamat } : {}),
            ...(!ada.namaPimpinan ? { namaPimpinan: t.namaPimpinan.trim() } : {}),
            ...(!ada.noWaUsaha ? { noWaUsaha: t.noWaUsaha.trim(), kontak: ada.kontak ?? t.noWaUsaha.trim() } : {}),
            ...(ada.dibuatSiswa && ada._count.penempatan + 1 > ada.kuota ? { kuota: ada._count.penempatan + 1 } : {}),
          },
        });
        tempatId = ada.id;
        namaTempat = ada.namaTempat;
      } else {
        const baru = await this.prisma.tempatMagang.create({
          data: {
            namaTempat: t.namaTempat.trim(),
            alamat,
            ...v,
            namaPimpinan: t.namaPimpinan.trim(),
            noWaUsaha: t.noWaUsaha.trim(),
            kontak: t.noWaUsaha.trim(),
            kuota: 1,
            dibuatSiswa: true,
          },
        });
        tempatId = baru.id;
        namaTempat = baru.namaTempat;
      }
    } else {
      throw new BadRequestException('Pilih instansi dari daftar atau isi data instansi');
    }

    const lama = await this.prisma.penempatanMagang.findUnique({
      where: { siswaId_tempatMagangId: { siswaId: siswa.id, tempatMagangId: tempatId } },
    });
    const tanggalMulai = new Date(todayJakarta());
    const data = {
      kelompokId: null, tanggalMulai, tanggalSelesai: null, guruPembimbingId: null, status: 'MENUNGGU' as const,
      suratKeteranganUrl: surat.url, suratKeteranganNama: surat.nama,
    };
    if (lama) {
      await this.prisma.penempatanMagang.update({ where: { id: lama.id }, data });
    } else {
      await this.prisma.penempatanMagang.create({ data: { siswaId: siswa.id, tempatMagangId: tempatId, ...data } });
    }

    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    await this.notificationService.createMany(admins.map((a) => a.id), {
      title: 'Pengajuan penempatan PKL baru',
      message: `${siswa.user?.nama ?? siswa.nama ?? 'Siswa'} mengajukan penempatan PKL di ${namaTempat}. Verifikasi dan tetapkan guru pembimbing.`,
      type: NotificationType.MAGANG,
      link: '/magang/penempatan',
    });

    return this.findSaya(userId);
  }

  async unggahSurat(userId: string, surat: { url: string; nama: string }) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    const mine = await this.prisma.penempatanMagang.findFirst({ where: { siswaId: siswa.id, status: 'MENUNGGU' } });
    if (!mine) throw new BadRequestException('Tidak ada pengajuan PKL yang menunggu');
    await this.prisma.penempatanMagang.updateMany({
      where: mine.kelompokId ? { kelompokId: mine.kelompokId, status: 'MENUNGGU' } : { id: mine.id },
      data: { suratKeteranganUrl: surat.url, suratKeteranganNama: surat.nama },
    });
    return this.findSaya(userId);
  }

  async tolak(id: string, alasan: string) {
    if (!alasan?.trim()) throw new BadRequestException('Alasan penolakan wajib diisi');
    const target = await this.prisma.penempatanMagang.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Pengajuan tidak ditemukan');
    const rows = await this.prisma.penempatanMagang.findMany({
      where: target.kelompokId ? { kelompokId: target.kelompokId, status: 'MENUNGGU' } : { id, status: 'MENUNGGU' },
      include: { siswa: { select: { userId: true } }, tempatMagang: { select: { namaTempat: true } } },
    });
    if (rows.length === 0) throw new BadRequestException('Pengajuan ini sudah diproses');

    await this.prisma.penempatanMagang.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });

    const userIds = rows.map((r) => r.siswa.userId).filter((u): u is string => !!u);
    const catatan = ` Alasan: ${alasan.trim()}`;
    await this.notificationService.createMany(userIds, {
      title: 'Pengajuan PKL ditolak',
      message: `Pengajuan PKL di ${rows[0].tempatMagang.namaTempat} ditolak admin.${catatan} Silakan ajukan ulang.`,
      type: NotificationType.MAGANG,
      link: '/magang/penempatan',
    });
    return this.findAll({});
  }

  async tetapkanGuru(id: string, dto: TetapkanGuruDto) {
    const target = await this.prisma.penempatanMagang.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Pengajuan tidak ditemukan');
    const guru = await this.prisma.guru.findUnique({ where: { id: dto.guruPembimbingId }, include: { user: { select: { id: true, nama: true } } } });
    if (!guru) throw new NotFoundException('Guru pembimbing tidak ditemukan');

    const rows = await this.prisma.penempatanMagang.findMany({
      where: target.kelompokId ? { kelompokId: target.kelompokId, status: 'MENUNGGU' } : { id, status: 'MENUNGGU' },
      include: { siswa: { select: { userId: true } }, tempatMagang: { select: { namaTempat: true } } },
    });
    if (rows.length === 0) throw new BadRequestException('Pengajuan ini sudah diproses');
    if (rows.some((r) => !r.suratKeteranganUrl)) {
      throw new BadRequestException('Pengajuan belum disertai surat keterangan PKL. Minta siswa mengunggahnya dulu.');
    }

    await this.prisma.penempatanMagang.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: {
        guruPembimbingId: guru.id,
        status: 'AKTIF',
        ...(dto.tanggalMulai ? { tanggalMulai: new Date(dto.tanggalMulai) } : {}),
        ...(dto.tanggalSelesai ? { tanggalSelesai: new Date(dto.tanggalSelesai) } : {}),
      },
    });

    const tempat = rows[0].tempatMagang.namaTempat;
    const userIds = rows.map((r) => r.siswa.userId).filter((u): u is string => !!u);
    await this.notificationService.createMany(userIds, {
      title: 'PKL kamu disetujui',
      message: `Penempatan PKL di ${tempat} sudah ditetapkan. Guru pembimbing: ${guru.user?.nama ?? '-'}.`,
      type: NotificationType.MAGANG,
      link: '/magang/penempatan',
    });
    if (guru.user?.id) {
      await this.notificationService.create({
        userId: guru.user.id,
        title: 'Siswa bimbingan PKL baru',
        message: `${rows.length} siswa ditempatkan di ${tempat} dan menjadi bimbingan Anda.`,
        type: NotificationType.MAGANG,
        link: '/magang/penempatan',
      });
    }
    return this.findAll({});
  }

  async update(id: string, dto: UpdatePenempatanDto) {
    const existing = await this.prisma.penempatanMagang.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Penempatan tidak ditemukan');

    if (dto.tempatMagangId && dto.tempatMagangId !== existing.tempatMagangId) {
      const tempat = await this.prisma.tempatMagang.findUnique({
        where: { id: dto.tempatMagangId },
        include: { _count: { select: { penempatan: { where: { status: { in: AKTIF_ATAU_MENUNGGU } } } } } },
      });
      if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');
      if (tempat._count.penempatan >= tempat.kuota) {
        throw new BadRequestException(`Kuota tempat "${tempat.namaTempat}" sudah penuh (${tempat._count.penempatan}/${tempat.kuota})`);
      }
    }

    if (dto.status === 'AKTIF' && existing.status !== 'AKTIF') {
      if (!(dto.guruPembimbingId ?? existing.guruPembimbingId)) {
        throw new BadRequestException('Tetapkan guru pembimbing dulu sebelum mengaktifkan penempatan');
      }
      const sedangAktif = await this.prisma.penempatanMagang.findFirst({
        where: { siswaId: existing.siswaId, status: 'AKTIF', id: { not: id } },
      });
      if (sedangAktif) {
        throw new BadRequestException('Siswa ini masih memiliki penempatan PKL aktif lain. Selesaikan/batalkan dulu sebelum mengaktifkan penempatan ini.');
      }
    }

    const tempatBerubah = dto.tempatMagangId !== undefined && dto.tempatMagangId !== existing.tempatMagangId;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.penempatanMagang.update({
        where: { id },
        data: {
          ...(dto.tempatMagangId !== undefined ? { tempatMagangId: dto.tempatMagangId } : {}),
          ...(dto.guruPembimbingId !== undefined ? { guruPembimbingId: dto.guruPembimbingId } : {}),
          ...(dto.tanggalMulai !== undefined ? { tanggalMulai: new Date(dto.tanggalMulai) } : {}),
          ...(dto.tanggalSelesai !== undefined ? { tanggalSelesai: new Date(dto.tanggalSelesai) } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: INCLUDE_DETAIL,
      });

      if (tempatBerubah && dto.tempatMagangId) {
        await Promise.all([
          tx.absensiMagang.updateMany({ where: { penempatanId: id }, data: { tempatMagangId: dto.tempatMagangId } }),
          tx.laporDiriMagang.updateMany({ where: { penempatanId: id }, data: { tempatMagangId: dto.tempatMagangId } }),
          tx.laporanAkhirMagang.updateMany({ where: { penempatanId: id }, data: { tempatMagangId: dto.tempatMagangId } }),
        ]);
      }

      return updated;
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.penempatanMagang.findUnique({
      where: { id },
      include: { _count: { select: { absensi: true, izin: true } } },
    });
    if (!existing) throw new NotFoundException('Penempatan tidak ditemukan');
    if (existing._count.absensi > 0 || existing._count.izin > 0) {
      throw new BadRequestException('Penempatan ini sudah punya riwayat absensi/izin, ubah statusnya menjadi Selesai/Batal daripada menghapus');
    }
    return this.prisma.penempatanMagang.delete({ where: { id } });
  }
}
