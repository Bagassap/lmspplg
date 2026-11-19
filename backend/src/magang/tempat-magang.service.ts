import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTempatMagangDto } from './dto/create-tempat-magang.dto';
import { UpdateTempatMagangDto } from './dto/update-tempat-magang.dto';

const INCLUDE_COUNT = {
  _count: { select: { penempatan: { where: { status: { in: ['MENUNGGU', 'AKTIF'] as ('MENUNGGU' | 'AKTIF')[] } } } } },
} as const;

@Injectable()
export class TempatMagangService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tempatMagang.findMany({
      include: INCLUDE_COUNT,
      orderBy: { namaTempat: 'asc' },
    });
  }

  async findPilihan() {
    const list = await this.prisma.tempatMagang.findMany({
      include: INCLUDE_COUNT,
      orderBy: { namaTempat: 'asc' },
    });
    return list.map((t) => ({
      id: t.id,
      namaTempat: t.namaTempat,
      kuota: t.kuota,
      terisi: t._count.penempatan,
      sisa: Math.max(0, t.kuota - t._count.penempatan),
    }));
  }

  async findInstansi() {
    const list = await this.prisma.tempatMagang.findMany({
      where: {
        OR: [
          { dibuatSiswa: false },
          { penempatan: { some: { status: { in: ['AKTIF', 'SELESAI'] } } } },
        ],
      },
      include: {
        penempatan: {
          where: { status: { in: ['MENUNGGU', 'AKTIF'] } },
          select: {
            status: true,
            siswa: { select: { id: true, nama: true, kelas: { select: { nama: true } }, user: { select: { nama: true } } } },
          },
        },
      },
      orderBy: { namaTempat: 'asc' },
    });
    return list.map((t) => {
      const terisi = t.penempatan.length;
      const siswa = t.penempatan
        .filter((p) => p.status === 'AKTIF')
        .map((p) => ({ id: p.siswa.id, nama: p.siswa.user?.nama ?? p.siswa.nama ?? 'Siswa', kelas: p.siswa.kelas?.nama ?? '' }))
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
      return {
        id: t.id,
        namaTempat: t.namaTempat,
        namaPimpinan: t.namaPimpinan,
        dukuh: t.dukuh,
        rt: t.rt,
        rw: t.rw,
        desa: t.desa,
        kecamatan: t.kecamatan,
        kabupaten: t.kabupaten,
        alamat: t.alamat,
        noWaUsaha: t.noWaUsaha ?? t.kontak,
        dibuatSiswa: t.dibuatSiswa,
        kuota: t.kuota,
        terisi,
        sisa: t.dibuatSiswa ? null : Math.max(0, t.kuota - terisi),
        siswa,
      };
    });
  }

  async findOne(id: string) {
    const tempat = await this.prisma.tempatMagang.findUnique({ where: { id }, include: INCLUDE_COUNT });
    if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');
    return tempat;
  }

  create(dto: CreateTempatMagangDto) {
    return this.prisma.tempatMagang.create({
      data: { namaTempat: dto.namaTempat.trim(), kuota: dto.kuota ?? 1 },
      include: INCLUDE_COUNT,
    });
  }

  async update(id: string, dto: UpdateTempatMagangDto) {
    await this.findOne(id);
    return this.prisma.tempatMagang.update({
      where: { id },
      data: {
        ...(dto.namaTempat !== undefined ? { namaTempat: dto.namaTempat.trim() } : {}),
        ...(dto.kuota !== undefined ? { kuota: dto.kuota } : {}),
      },
      include: INCLUDE_COUNT,
    });
  }

  async remove(id: string) {
    const tempat = await this.prisma.tempatMagang.findUnique({
      where: { id },
      include: { _count: { select: { penempatan: true } } },
    });
    if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');
    if (tempat._count.penempatan > 0) {
      throw new BadRequestException('Tempat ini masih memiliki riwayat penempatan siswa, tidak dapat dihapus');
    }
    return this.prisma.tempatMagang.delete({ where: { id } });
  }
}
