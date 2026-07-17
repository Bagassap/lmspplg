import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiswaDto } from './dto/update-siswa.dto';
import { UpdateProfilSiswaDto } from './dto/update-profil-siswa.dto';

const INCLUDE_USER = {
  user: { select: { id: true, nama: true, email: true, mustChangePassword: true } },
  kelas: {
    include: {
      waliKelasGuru: { include: { user: { select: { id: true, nama: true } } } },
    },
  },
} as const;

@Injectable()
export class SiswaService {
  constructor(private readonly prisma: PrismaService) {}

  private async kelasWaliIds(userId: string): Promise<string[]> {
    const guru = await this.prisma.guru.findUnique({ where: { userId } });
    if (!guru) return [];
    const kelasWali = await this.prisma.kelas.findMany({ where: { waliKelasGuruId: guru.id }, select: { id: true } });
    return kelasWali.map((k) => k.id);
  }

  async findAll(
    query: { search?: string; kelasId?: string; jurusan?: string; jenisKelamin?: string },
    actor: { id: string; role: string },
  ) {
    const { search, kelasId, jurusan, jenisKelamin } = query;

    let kelasIdFilter: string | { in: string[] } | undefined = kelasId;
    if (actor.role === 'GURU') {
      const waliIds = await this.kelasWaliIds(actor.id);
      kelasIdFilter = kelasId
        ? (waliIds.includes(kelasId) ? kelasId : { in: [] })
        : { in: waliIds };
    }

    return this.prisma.siswa.findMany({
      where: {
        ...(kelasIdFilter ? { kelasId: kelasIdFilter } : {}),
        ...(jurusan ? { jurusan } : {}),
        ...(jenisKelamin ? { jenisKelamin } : {}),
        ...(search
          ? {
              OR: [
                { nama: { contains: search, mode: 'insensitive' } },
                { nis: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: INCLUDE_USER,
      orderBy: [{ kelas: { nama: 'asc' } }, { nama: 'asc' }],
    });
  }

  async findOne(id: string, actor: { id: string; role: string }) {
    const siswa = await this.prisma.siswa.findUnique({ where: { id }, include: INCLUDE_USER });
    if (!siswa) throw new NotFoundException('Siswa tidak ditemukan');
    if (actor.role === 'GURU') {
      const waliIds = await this.kelasWaliIds(actor.id);
      if (!waliIds.includes(siswa.kelasId)) throw new NotFoundException('Siswa tidak ditemukan');
    }
    return siswa;
  }

  async findMine(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId }, include: INCLUDE_USER });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    return siswa;
  }

  async update(id: string, dto: UpdateSiswaDto) {
    const exists = await this.prisma.siswa.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Siswa tidak ditemukan');
    const data: Record<string, unknown> = { ...dto };
    if (dto.tanggalLahir) data.tanggalLahir = new Date(dto.tanggalLahir);
    return this.prisma.siswa.update({ where: { id }, data, include: INCLUDE_USER });
  }

  async updateMine(userId: string, dto: UpdateProfilSiswaDto) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const data: Record<string, unknown> = {
      jenisKelamin: dto.jenisKelamin,
      tempatLahir: dto.tempatLahir,
      namaOrtu: dto.namaOrtu,
      noHp: dto.noHp,
      alamat: dto.alamat,
    };
    if (dto.tanggalLahir) data.tanggalLahir = new Date(dto.tanggalLahir);
    return this.prisma.siswa.update({
      where: { id: siswa.id },
      data,
      include: INCLUDE_USER,
    });
  }
}
