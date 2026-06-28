import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJadwalKelasDto } from './dto/create-jadwal-kelas.dto';
import { UpdateJadwalKelasDto } from './dto/update-jadwal-kelas.dto';

const INCLUDE_GURU = {
  guru: {
    include: {
      user: { select: { id: true, nama: true } },
    },
  },
} as const;

const ORDER = [{ hari: 'asc' as const }, { jamMulai: 'asc' as const }];

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function toBaseSlug(mataPelajaran: string, kelas: string): string {
  return `${mataPelajaran}-${kelas}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

@Injectable()
export class JadwalKelasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(kelas?: string) {
    return this.prisma.jadwalKelas.findMany({
      where: kelas ? { kelas } : undefined,
      include: INCLUDE_GURU,
      orderBy: ORDER,
    });
  }

  async findMine(userId: string, role: string) {
    if (role === 'GURU') {
      const guru = await this.prisma.guru.findUnique({ where: { userId } });
      if (!guru) return [];
      return this.prisma.jadwalKelas.findMany({
        where: { guruId: guru.id },
        include: INCLUDE_GURU,
        orderBy: ORDER,
      });
    }

    if (role === 'SISWA') {
      const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
      if (!siswa) return [];
      return this.prisma.jadwalKelas.findMany({
        where: { kelas: siswa.kelas },
        include: INCLUDE_GURU,
        orderBy: ORDER,
      });
    }

    // ADMIN — return all
    return this.findAll();
  }

  getGuruList() {
    return this.prisma.guru.findMany({
      include: { user: { select: { id: true, nama: true } } },
      orderBy: { user: { nama: 'asc' } },
    });
  }

  async create(dto: CreateJadwalKelasDto) {
    const slug = await this.ensureUniqueSlug(dto.mataPelajaran, dto.kelas, dto.hari);
    return this.prisma.jadwalKelas.create({
      data: { ...dto, slug },
      include: INCLUDE_GURU,
    });
  }

  async update(id: string, dto: UpdateJadwalKelasDto) {
    const current = await this.findOne(id);
    let slug: string | undefined;
    const newMapel = dto.mataPelajaran ?? current.mataPelajaran;
    const newKelas = dto.kelas ?? current.kelas;
    const newHari = dto.hari ?? current.hari;
    if (dto.mataPelajaran !== undefined || dto.kelas !== undefined || dto.hari !== undefined) {
      const oldBase = toBaseSlug(current.mataPelajaran, current.kelas);
      const newBase = toBaseSlug(newMapel, newKelas);
      if (newBase !== oldBase) {
        slug = await this.ensureUniqueSlug(newMapel, newKelas, newHari, current.id);
      }
    }
    return this.prisma.jadwalKelas.update({
      where: { id: current.id },
      data: { ...dto, ...(slug ? { slug } : {}) },
      include: INCLUDE_GURU,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.jadwalKelas.delete({ where: { id } });
  }

  async findOne(idOrSlug: string) {
    const item = await this.prisma.jadwalKelas.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: INCLUDE_GURU,
    });
    if (!item) throw new NotFoundException('Jadwal tidak ditemukan');
    return item;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async ensureUniqueSlug(
    mataPelajaran: string,
    kelas: string,
    hari: string,
    excludeId?: string,
  ): Promise<string> {
    const base = toBaseSlug(mataPelajaran, kelas);

    const taken = async (slug: string) => {
      const found = await this.prisma.jadwalKelas.findUnique({ where: { slug } });
      return found !== null && found.id !== excludeId;
    };

    if (!(await taken(base))) return base;

    const withHari = `${base}-${hari.toLowerCase().replace(/\s+/g, '-')}`;
    if (!(await taken(withHari))) return withHari;

    for (let i = 2; i < 100; i++) {
      const candidate = `${withHari}-${i}`;
      if (!(await taken(candidate))) return candidate;
    }

    return `${withHari}-${Date.now()}`;
  }
}
