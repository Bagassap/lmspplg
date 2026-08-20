import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePenempatanDto, UpdatePenempatanDto } from './dto/create-penempatan.dto';

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

@Injectable()
export class PenempatanService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: { status?: string; tempatMagangId?: string; kelasId?: string }) {
    return this.prisma.penempatanMagang.findMany({
      where: {
        ...(query.status ? { status: query.status as 'AKTIF' | 'SELESAI' | 'BATAL' } : {}),
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

  async create(dto: CreatePenempatanDto) {
    const [siswa, tempat, guru] = await Promise.all([
      this.prisma.siswa.findUnique({ where: { id: dto.siswaId } }),
      this.prisma.tempatMagang.findUnique({
        where: { id: dto.tempatMagangId },
        include: { _count: { select: { penempatan: { where: { status: 'AKTIF' } } } } },
      }),
      this.prisma.guru.findUnique({ where: { id: dto.guruPembimbingId } }),
    ]);
    if (!siswa) throw new NotFoundException('Siswa tidak ditemukan');
    if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');
    if (!guru) throw new NotFoundException('Guru pembimbing tidak ditemukan');

    const sedangAktif = await this.prisma.penempatanMagang.findFirst({
      where: { siswaId: dto.siswaId, status: 'AKTIF' },
    });
    if (sedangAktif) {
      throw new BadRequestException('Siswa ini masih memiliki penempatan PKL yang aktif. Selesaikan/batalkan dulu sebelum menempatkan ke tempat baru.');
    }
    if (tempat._count.penempatan >= tempat.kuota) {
      throw new BadRequestException(`Kuota tempat "${tempat.namaTempat}" sudah penuh (${tempat._count.penempatan}/${tempat.kuota})`);
    }

    return this.prisma.penempatanMagang.create({
      data: {
        siswaId: dto.siswaId,
        tempatMagangId: dto.tempatMagangId,
        guruPembimbingId: dto.guruPembimbingId,
        tanggalMulai: new Date(dto.tanggalMulai),
        tanggalSelesai: dto.tanggalSelesai ? new Date(dto.tanggalSelesai) : undefined,
      },
      include: INCLUDE_DETAIL,
    });
  }

  async update(id: string, dto: UpdatePenempatanDto) {
    const existing = await this.prisma.penempatanMagang.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Penempatan tidak ditemukan');

    if (dto.tempatMagangId && dto.tempatMagangId !== existing.tempatMagangId) {
      const tempat = await this.prisma.tempatMagang.findUnique({
        where: { id: dto.tempatMagangId },
        include: { _count: { select: { penempatan: { where: { status: 'AKTIF' } } } } },
      });
      if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');
      if (tempat._count.penempatan >= tempat.kuota) {
        throw new BadRequestException(`Kuota tempat "${tempat.namaTempat}" sudah penuh (${tempat._count.penempatan}/${tempat.kuota})`);
      }
    }

    return this.prisma.penempatanMagang.update({
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
