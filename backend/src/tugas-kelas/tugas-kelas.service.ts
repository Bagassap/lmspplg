import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTugasKelasDto } from './dto/create-tugas-kelas.dto';

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function toTugasSlug(judul: string): string {
  return judul
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
export class TugasKelasService {
  constructor(private readonly prisma: PrismaService) {}

  async findByJadwal(jadwalKelasId: string) {
    // Support slug lookup — resolve to real cuid before querying
    const jadwal = await this.prisma.jadwalKelas.findFirst({
      where: { OR: [{ id: jadwalKelasId }, { slug: jadwalKelasId }] },
      select: { id: true },
    });
    const realId = jadwal?.id ?? jadwalKelasId;
    return this.prisma.tugasKelas.findMany({
      where: { jadwalKelasId: realId },
      include: { _count: { select: { submisi: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateTugasKelasDto) {
    const { deadline, ...rest } = dto;
    const slug = await this.ensureUniqueTugasSlug(dto.judul);
    return this.prisma.tugasKelas.create({
      data: {
        ...rest,
        slug,
        deadline: deadline ? new Date(deadline) : undefined,
      },
    });
  }

  async remove(idOrSlug: string) {
    const item = await this.prisma.tugasKelas.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!item) throw new NotFoundException('Tugas tidak ditemukan');
    return this.prisma.tugasKelas.delete({ where: { id: item.id } });
  }

  async submitTugas(tugasIdOrSlug: string, userId: string, fileUrl?: string) {
    const tugas = await this.prisma.tugasKelas.findFirst({
      where: { OR: [{ id: tugasIdOrSlug }, { slug: tugasIdOrSlug }] },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');
    return this.prisma.submisiTugas.upsert({
      where: { tugasId_siswaId: { tugasId: tugas.id, siswaId: userId } },
      update: { fileUrl, submittedAt: new Date() },
      create: { tugasId: tugas.id, siswaId: userId, fileUrl, submittedAt: new Date() },
    });
  }

  async getSubmisiSaya(tugasIdOrSlug: string, userId: string) {
    const tugas = await this.prisma.tugasKelas.findFirst({
      where: { OR: [{ id: tugasIdOrSlug }, { slug: tugasIdOrSlug }] },
    });
    if (!tugas) return null;
    return this.prisma.submisiTugas.findUnique({
      where: { tugasId_siswaId: { tugasId: tugas.id, siswaId: userId } },
    });
  }

  async getSubmisi(idOrSlug: string) {
    const tugas = await this.prisma.tugasKelas.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { jadwalKelas: true },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');

    const allSiswa = await this.prisma.siswa.findMany({
      where: { kelas: tugas.jadwalKelas.kelas },
      include: { user: { select: { id: true, nama: true } } },
      orderBy: { nama: 'asc' },
    });

    const submisi = await this.prisma.submisiTugas.findMany({
      where: { tugasId: tugas.id },
      select: { siswaId: true, fileUrl: true, submittedAt: true },
    });

    const submisiMap = new Map(submisi.map((s) => [s.siswaId, s]));

    const sudahSubmit = allSiswa
      .filter((s) => s.userId !== null && submisiMap.has(s.userId))
      .map((s) => ({
        userId: s.userId,
        nama: s.user?.nama ?? s.nama,
        ...submisiMap.get(s.userId!),
      }));

    const belumSubmit = allSiswa
      .filter((s) => s.userId === null || !submisiMap.has(s.userId))
      .map((s) => ({ userId: s.userId, nama: s.user?.nama ?? s.nama }));

    return { total: allSiswa.length, sudahSubmit, belumSubmit };
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async ensureUniqueTugasSlug(judul: string, excludeId?: string): Promise<string> {
    const base = toTugasSlug(judul);

    const taken = async (slug: string) => {
      const found = await this.prisma.tugasKelas.findUnique({ where: { slug } });
      return found !== null && found.id !== excludeId;
    };

    if (!(await taken(base))) return base;

    for (let i = 2; i < 100; i++) {
      const candidate = `${base}-${i}`;
      if (!(await taken(candidate))) return candidate;
    }

    return `${base}-${Date.now()}`;
  }
}
