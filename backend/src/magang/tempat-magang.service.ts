import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTempatMagangDto } from './dto/create-tempat-magang.dto';
import { UpdateTempatMagangDto } from './dto/update-tempat-magang.dto';

// Kuota terpakai = penempatan yang sudah aktif + yang masih menunggu guru pembimbing.
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

  // Daftar pilihan untuk siswa: nama + sisa kuota saja.
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
