import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { DaftarMagangDto } from './dto/pendaftaran-magang.dto';
import { pastikanJenisKelaminCocok } from './jenis-kelamin.util';
import { pastikanKuotaTersedia } from './kuota.util';

const INCLUDE_SISWA = {
  siswa: {
    select: {
      id: true,
      nis: true,
      nama: true,
      kelas: { select: { id: true, nama: true } },
      user: { select: { id: true, nama: true, fotoProfil: true } },
    },
  },
  tempatMagang: {
    select: { id: true, namaTempat: true, alamat: true, dukuh: true, rt: true, rw: true, desa: true, kecamatan: true, kabupaten: true, kuota: true, jenisKelamin: true },
  },
} as const;

type StatusD = 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';

@Injectable()
export class PendaftaranMagangService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async findSaya(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId },
      include: {
        kelas: { select: { nama: true } },
        user: { select: { nama: true } },
        pendaftaranMagang: { include: { tempatMagang: { select: { id: true, namaTempat: true } } } },
        _count: { select: { penempatan: true } },
      },
    });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    const penempatanTerkunci = await this.prisma.penempatanMagang.count({
      where: { siswaId: siswa.id, status: { in: ['MENUNGGU', 'AKTIF', 'SELESAI'] } },
    });
    const statusDaftar = siswa.pendaftaranMagang?.status;
    return {
      bisaGantiInstansi: penempatanTerkunci === 0 && (statusDaftar === 'MENUNGGU' || statusDaftar === 'DITERIMA'),
      profil: {
        nama: siswa.user?.nama ?? siswa.nama ?? '',
        nis: siswa.nis,
        jenisKelamin: siswa.jenisKelamin,
        kelas: siswa.kelas?.nama ?? '',
        noHp: siswa.noHp ?? '',
        dukuh: siswa.dukuh ?? '',
        rt: siswa.rt ?? '',
        rw: siswa.rw ?? '',
        desa: siswa.desa ?? '',
        kecamatan: siswa.kecamatan ?? '',
        kabupaten: siswa.kabupaten ?? '',
      },
      pendaftaran: siswa.pendaftaranMagang,
      sudahPenempatan: siswa._count.penempatan > 0,
    };
  }

  async daftar(userId: string, dto: DaftarMagangDto) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId },
      include: { user: { select: { nama: true } }, kelas: { select: { nama: true } }, pendaftaranMagang: true },
    });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    if (siswa.pendaftaranMagang?.status === 'DITERIMA') {
      throw new BadRequestException('Pendaftaran PKL kamu sudah diverifikasi admin');
    }

    const tempatMagangId = dto.tempatMagangId.trim();
    if (!tempatMagangId) throw new BadRequestException('Tempat PKL wajib dipilih');
    const tempat = await this.prisma.tempatMagang.findUnique({ where: { id: tempatMagangId }, select: { id: true, namaTempat: true, jenisKelamin: true, kuota: true, dibuatSiswa: true } });
    if (!tempat) throw new BadRequestException('Tempat PKL yang dipilih tidak ditemukan');
    pastikanJenisKelaminCocok(tempat, siswa);
    await pastikanKuotaTersedia(this.prisma, tempat, siswa.id);

    const data = {
      tempatMagangId,
      noWa: dto.noWa.trim(),
      dukuh: dto.dukuh.trim(),
      rt: dto.rt.trim(),
      rw: dto.rw.trim(),
      desa: dto.desa.trim(),
      kecamatan: dto.kecamatan.trim(),
      kabupaten: dto.kabupaten.trim(),
      status: 'MENUNGGU' as const,
      alasanTolak: null,
      diverifikasiAt: null,
    };
    await this.prisma.pendaftaranMagang.upsert({
      where: { siswaId: siswa.id },
      create: { siswaId: siswa.id, ...data },
      update: data,
    });

    if (!siswa.pendaftaranMagang || siswa.pendaftaranMagang.status === 'DITOLAK') {
      const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
      await this.notificationService.createMany(admins.map((a) => a.id), {
        title: 'Pendaftaran PKL baru',
        message: `${siswa.user?.nama ?? siswa.nama ?? 'Siswa'} (${siswa.kelas?.nama ?? '-'}) mendaftar PKL. Mohon verifikasi.`,
        type: NotificationType.MAGANG,
        link: '/magang/pendaftaran',
      });
    }

    return this.findSaya(userId);
  }

  async gantiInstansi(userId: string, tempatMagangIdBaru: string) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId },
      include: {
        user: { select: { nama: true } },
        kelas: { select: { nama: true } },
        pendaftaranMagang: { include: { tempatMagang: { select: { namaTempat: true } } } },
      },
    });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    const lama = siswa.pendaftaranMagang;
    if (!lama || lama.status === 'DITOLAK') {
      throw new BadRequestException('Ganti instansi hanya bisa dilakukan setelah mendaftar PKL');
    }
    const penempatanTerkunci = await this.prisma.penempatanMagang.count({
      where: { siswaId: siswa.id, status: { in: ['MENUNGGU', 'AKTIF', 'SELESAI'] } },
    });
    if (penempatanTerkunci > 0) {
      throw new BadRequestException('Instansi tidak bisa diganti karena form penempatan sudah dikirim. Hubungi admin.');
    }

    const tempatMagangId = tempatMagangIdBaru.trim();
    if (tempatMagangId === lama.tempatMagangId) {
      throw new BadRequestException('Pilih instansi yang berbeda dari instansi saat ini');
    }
    const tempat = await this.prisma.tempatMagang.findUnique({
      where: { id: tempatMagangId },
      select: { id: true, namaTempat: true, jenisKelamin: true, kuota: true, dibuatSiswa: true },
    });
    if (!tempat) throw new BadRequestException('Instansi yang dipilih tidak ditemukan');
    pastikanJenisKelaminCocok(tempat, siswa);
    await pastikanKuotaTersedia(this.prisma, tempat, siswa.id);

    await this.prisma.pendaftaranMagang.update({
      where: { id: lama.id },
      data: { tempatMagangId, status: 'MENUNGGU', alasanTolak: null, diverifikasiAt: null },
    });

    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    await this.notificationService.createMany(admins.map((a) => a.id), {
      title: 'Siswa mengganti instansi PKL',
      message: `${siswa.user?.nama ?? siswa.nama ?? 'Siswa'} (${siswa.kelas?.nama ?? '-'}) pindah dari ${lama.tempatMagang?.namaTempat ?? '-'} ke ${tempat.namaTempat}. Mohon verifikasi ulang.`,
      type: NotificationType.MAGANG,
      link: '/magang/pendaftaran',
    });

    return this.findSaya(userId);
  }

  async belumDaftar() {
    const kelas = await this.prisma.kelas.findMany({
      where: { OR: [{ nama: { startsWith: 'XII', mode: 'insensitive' } }, { nama: { startsWith: '12' } }] },
      select: {
        id: true,
        nama: true,
        _count: { select: { siswa: { where: { status: 'AKTIF' } } } },
        siswa: {
          where: { status: 'AKTIF', pendaftaranMagang: { is: null }, penempatan: { none: { status: { not: 'BATAL' } } } },
          select: { id: true, nis: true, nama: true, user: { select: { nama: true, fotoProfil: true } } },
        },
      },
      orderBy: { nama: 'asc' },
    });
    return kelas
      .filter((k) => /^(XII|12)(?![0-9A-Z])/i.test(k.nama.trim()))
      .map((k) => ({
        id: k.id,
        nama: k.nama,
        total: k._count.siswa,
        siswa: k.siswa
          .map((s) => ({ id: s.id, nis: s.nis, nama: s.user?.nama ?? s.nama ?? 'Siswa', fotoProfil: s.user?.fotoProfil ?? null }))
          .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' })),
      }));
  }

  findAll(status?: string) {
    return this.prisma.pendaftaranMagang.findMany({
      where: status ? { status: status as StatusD } : {},
      include: INCLUDE_SISWA,
      orderBy: { createdAt: 'desc' },
    });
  }

  async terima(id: string) {
    const row = await this.prisma.pendaftaranMagang.findUnique({ where: { id }, include: { siswa: { select: { userId: true, jenisKelamin: true } } } });
    if (!row) throw new NotFoundException('Pendaftaran tidak ditemukan');
    if (row.status === 'DITERIMA') throw new BadRequestException('Pendaftaran ini sudah diverifikasi');
    if (row.tempatMagangId) {
      const tempat = await this.prisma.tempatMagang.findUnique({ where: { id: row.tempatMagangId }, select: { id: true, namaTempat: true, kuota: true, dibuatSiswa: true, jenisKelamin: true } });
      if (tempat) {
        pastikanJenisKelaminCocok(tempat, row.siswa);
        await pastikanKuotaTersedia(this.prisma, tempat, row.siswaId);
      }
    }
    await this.prisma.pendaftaranMagang.update({
      where: { id },
      data: { status: 'DITERIMA', alasanTolak: null, diverifikasiAt: new Date() },
    });
    if (row.siswa.userId) {
      await this.notificationService.create({
        userId: row.siswa.userId,
        title: 'Pendaftaran PKL diverifikasi',
        message: 'Pendaftaran PKL kamu sudah diverifikasi. Ambil surat permohonan PKL di Gedung G Lab PPLG, lalu isi data instansi di menu Penempatan.',
        type: NotificationType.MAGANG,
        link: '/magang/penempatan',
      });
    }
    return this.findAll();
  }

  async tolak(id: string, alasan: string) {
    if (!alasan?.trim()) throw new BadRequestException('Alasan penolakan wajib diisi');
    const row = await this.prisma.pendaftaranMagang.findUnique({ where: { id }, include: { siswa: { select: { userId: true } } } });
    if (!row) throw new NotFoundException('Pendaftaran tidak ditemukan');
    if (row.status !== 'MENUNGGU') throw new BadRequestException('Pendaftaran ini sudah diproses');
    await this.prisma.pendaftaranMagang.update({
      where: { id },
      data: { status: 'DITOLAK', alasanTolak: alasan.trim(), diverifikasiAt: new Date() },
    });
    if (row.siswa.userId) {
      await this.notificationService.create({
        userId: row.siswa.userId,
        title: 'Pendaftaran PKL ditolak',
        message: `Pendaftaran PKL kamu ditolak admin. Alasan: ${alasan.trim()} Silakan perbaiki dan kirim ulang.`,
        type: NotificationType.MAGANG,
        link: '/magang/penempatan',
      });
    }
    return this.findAll();
  }

  async batalkanVerifikasi(id: string) {
    const row = await this.prisma.pendaftaranMagang.findUnique({ where: { id }, include: { siswa: { select: { _count: { select: { penempatan: { where: { status: { in: ['MENUNGGU', 'AKTIF'] } } } } } } } } });
    if (!row) throw new NotFoundException('Pendaftaran tidak ditemukan');
    if (row.siswa._count.penempatan > 0) {
      throw new BadRequestException('Siswa ini sudah mengajukan penempatan, verifikasi tidak dapat dibatalkan');
    }
    await this.prisma.pendaftaranMagang.update({
      where: { id },
      data: { status: 'MENUNGGU', alasanTolak: null, diverifikasiAt: null },
    });
    return this.findAll();
  }

  async isTerverifikasi(siswaId: string) {
    const row = await this.prisma.pendaftaranMagang.findUnique({ where: { siswaId } });
    return row?.status === 'DITERIMA';
  }
}
