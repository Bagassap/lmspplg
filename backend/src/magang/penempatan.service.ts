import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { basename, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { todayJakarta } from '../common/utils/jakarta-date.util';
import { pastikanJenisKelaminCocok } from './jenis-kelamin.util';
import { AjukanPenempatanDto, TetapkanGuruDto, UpdatePenempatanDto } from './dto/create-penempatan.dto';
import { pastikanKuotaTersedia } from './kuota.util';

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

function pathBerkasSurat(url: string) {
  return join(process.cwd(), 'uploads', 'surat-pkl', basename(url));
}

function hapusBerkasSurat(url: string) {
  fs.rmSync(pathBerkasSurat(url), { force: true });
}

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
    if (dto.tempatMagangId) {
      const tempat = await this.prisma.tempatMagang.findUnique({
        where: { id: dto.tempatMagangId },
        include: { _count: { select: { penempatan: { where: { status: { in: AKTIF_ATAU_MENUNGGU } } } } } },
      });
      if (!tempat) throw new NotFoundException('Instansi tidak ditemukan');
      pastikanJenisKelaminCocok(tempat, siswa);
      if (tempat.dibuatSiswa) {
        if (tempat._count.penempatan + 1 > tempat.kuota) {
          await this.prisma.tempatMagang.update({ where: { id: tempat.id }, data: { kuota: tempat._count.penempatan + 1 } });
        }
      } else {
        await pastikanKuotaTersedia(this.prisma, tempat, siswa.id);
      }
      tempatId = tempat.id;
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
        pastikanJenisKelaminCocok(ada, siswa);
        await pastikanKuotaTersedia(this.prisma, ada, siswa.id);
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

    return this.findSaya(userId);
  }

  async unggahSurat(userId: string, surat: { url: string; nama: string }) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) {
      hapusBerkasSurat(surat.url);
      throw new NotFoundException('Profil siswa tidak ditemukan');
    }
    const mine = await this.prisma.penempatanMagang.findFirst({
      where: { siswaId: siswa.id, status: { in: AKTIF_ATAU_MENUNGGU } },
    });
    if (!mine) {
      hapusBerkasSurat(surat.url);
      throw new BadRequestException('Tidak ada penempatan PKL yang bisa dilengkapi suratnya');
    }
    if (mine.status === 'AKTIF' && mine.suratKeteranganUrl && fs.existsSync(pathBerkasSurat(mine.suratKeteranganUrl))) {
      hapusBerkasSurat(surat.url);
      throw new BadRequestException('Surat penempatan yang sudah diverifikasi tidak bisa diganti');
    }
    await this.prisma.penempatanMagang.updateMany({
      where: mine.status === 'MENUNGGU' && mine.kelompokId ? { kelompokId: mine.kelompokId, status: 'MENUNGGU' } : { id: mine.id },
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
      include: { siswa: { select: { userId: true, jenisKelamin: true } }, tempatMagang: { select: { namaTempat: true, jenisKelamin: true } } },
    });
    if (rows.length === 0) throw new BadRequestException('Pengajuan ini sudah diproses');
    rows.forEach((r) => pastikanJenisKelaminCocok(r.tempatMagang, r.siswa));

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
    const guru = dto.guruPembimbingId
      ? await this.prisma.guru.findUnique({ where: { id: dto.guruPembimbingId }, include: { user: { select: { id: true, nama: true } } } })
      : null;
    if (dto.guruPembimbingId && !guru) throw new NotFoundException('Guru pembimbing tidak ditemukan');

    const rows = await this.prisma.penempatanMagang.findMany({
      where: target.kelompokId ? { kelompokId: target.kelompokId, status: 'MENUNGGU' } : { id, status: 'MENUNGGU' },
      include: { siswa: { select: { userId: true } }, tempatMagang: { select: { namaTempat: true } } },
    });
    if (rows.length === 0) throw new BadRequestException('Pengajuan ini sudah diproses');
    if (rows.some((r) => !r.suratKeteranganUrl)) {
      throw new BadRequestException('Penempatan belum disertai bukti surat instansi. Minta siswa mengunggahnya dulu.');
    }

    await this.prisma.penempatanMagang.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: {
        ...(guru ? { guruPembimbingId: guru.id } : {}),
        status: 'AKTIF',
        ...(dto.tanggalMulai ? { tanggalMulai: new Date(dto.tanggalMulai) } : {}),
        ...(dto.tanggalSelesai ? { tanggalSelesai: new Date(dto.tanggalSelesai) } : {}),
      },
    });

    const tempat = rows[0].tempatMagang.namaTempat;
    const userIds = rows.map((r) => r.siswa.userId).filter((u): u is string => !!u);
    await this.notificationService.createMany(userIds, {
      title: 'Penempatan PKL diverifikasi',
      message: guru
        ? `Penempatan PKL di ${tempat} sudah diverifikasi. Guru pembimbing: ${guru.user?.nama ?? '-'}.`
        : `Penempatan PKL di ${tempat} sudah diverifikasi admin.`,
      type: NotificationType.MAGANG,
      link: '/magang/penempatan',
    });
    if (guru?.user?.id) {
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

  async batalVerifikasi(id: string) {
    const row = await this.prisma.penempatanMagang.findUnique({
      where: { id },
      include: {
        siswa: { select: { userId: true, nama: true, user: { select: { nama: true } } } },
        tempatMagang: { select: { namaTempat: true } },
        guruPembimbing: { select: { userId: true } },
        laporanAkhir: { select: { id: true } },
        _count: { select: { absensi: true, izin: true, laporDiri: true } },
      },
    });
    if (!row) throw new NotFoundException('Penempatan tidak ditemukan');
    if (row.status !== 'AKTIF') throw new BadRequestException('Hanya penempatan aktif yang bisa dibatalkan verifikasinya');
    const pesanRiwayat = 'Verifikasi tidak bisa dibatalkan karena siswa sudah punya riwayat absensi, izin, atau laporan PKL. Ubah statusnya menjadi Selesai atau Batal.';
    if (row._count.absensi + row._count.izin + row._count.laporDiri > 0 || row.laporanAkhir) {
      throw new BadRequestException(pesanRiwayat);
    }

    const hasil = await this.prisma.penempatanMagang.updateMany({
      where: { id, status: 'AKTIF', absensi: { none: {} }, izin: { none: {} }, laporDiri: { none: {} }, laporanAkhir: { is: null } },
      data: { status: 'MENUNGGU', guruPembimbingId: null },
    });
    if (hasil.count === 0) throw new BadRequestException(pesanRiwayat);

    const tempat = row.tempatMagang.namaTempat;
    if (row.siswa.userId) {
      await this.notificationService.create({
        userId: row.siswa.userId,
        title: 'Verifikasi penempatan PKL dibatalkan',
        message: `Verifikasi penempatan PKL di ${tempat} dibatalkan admin. Status kembali menunggu verifikasi.`,
        type: NotificationType.MAGANG,
        link: '/magang/penempatan',
      });
    }
    if (row.guruPembimbing?.userId) {
      await this.notificationService.create({
        userId: row.guruPembimbing.userId,
        title: 'Siswa bimbingan PKL dibatalkan',
        message: `Verifikasi penempatan ${row.siswa.user?.nama ?? row.siswa.nama ?? 'siswa'} di ${tempat} dibatalkan admin, sehingga siswa ini keluar dari bimbingan Anda.`,
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
      await pastikanKuotaTersedia(this.prisma, { ...tempat, dibuatSiswa: false }, existing.siswaId);
    }

    const pindah = !!dto.tempatMagangId && dto.tempatMagangId !== existing.tempatMagangId;
    if (pindah || (dto.status === 'AKTIF' && existing.status !== 'AKTIF')) {
      const [tujuan, pemilik] = await Promise.all([
        this.prisma.tempatMagang.findUnique({ where: { id: dto.tempatMagangId ?? existing.tempatMagangId }, select: { namaTempat: true, jenisKelamin: true } }),
        this.prisma.siswa.findUnique({ where: { id: existing.siswaId }, select: { jenisKelamin: true } }),
      ]);
      if (tujuan && pemilik) pastikanJenisKelaminCocok(tujuan, pemilik);
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
