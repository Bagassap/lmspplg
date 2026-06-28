import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiswaDto } from './dto/update-siswa.dto';
import { UpdateProfilSiswaDto } from './dto/update-profil-siswa.dto';

const INCLUDE_USER = {
  user: { select: { id: true, nama: true, email: true } },
} as const;

@Injectable()
export class SiswaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: { search?: string; kelas?: string; jurusan?: string; jenisKelamin?: string }) {
    const { search, kelas, jurusan, jenisKelamin } = query;
    return this.prisma.siswa.findMany({
      where: {
        ...(kelas ? { kelas } : {}),
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
      orderBy: [{ kelas: 'asc' }, { nama: 'asc' }],
    });
  }

  async findOne(id: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { id }, include: INCLUDE_USER });
    if (!siswa) throw new NotFoundException('Siswa tidak ditemukan');
    return siswa;
  }

  async findMine(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId }, include: INCLUDE_USER });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    return siswa;
  }

  async update(id: string, dto: UpdateSiswaDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.tanggalLahir) data.tanggalLahir = new Date(dto.tanggalLahir);
    return this.prisma.siswa.update({ where: { id }, data, include: INCLUDE_USER });
  }

  async updateMine(userId: string, dto: UpdateProfilSiswaDto) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    return this.prisma.siswa.update({
      where: { id: siswa.id },
      data: { noHp: dto.noHp, alamat: dto.alamat },
      include: INCLUDE_USER,
    });
  }
}
