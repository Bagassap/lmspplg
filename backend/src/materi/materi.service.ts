import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { CreateMateriDto } from './dto/create-materi.dto';
import { UpdateMateriDto } from './dto/update-materi.dto';

type Actor = { id: string; role: string };

const INCLUDE_CREATED_BY = { select: { id: true, nama: true, role: true } } as const;
const INCLUDE_KELAS = { select: { id: true, nama: true } } as const;

@Injectable()
export class MateriService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private async siswaKelasId(userId: string): Promise<string | null> {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId }, select: { kelasId: true } });
    return siswa?.kelasId ?? null;
  }

  private async notifySiswaBaru(kelasId: string | null, title: string, message: string) {
    const siswaUsers = await this.prisma.siswa.findMany({
      where: { userId: { not: null }, ...(kelasId ? { kelasId } : {}) },
      select: { userId: true },
    });
    await this.notificationService.createMany(
      siswaUsers.map((s) => s.userId!),
      { title, message, type: NotificationType.TUGAS, link: '/materi' },
    );
  }

  async findAll(actor: Actor) {
    if (actor.role === 'SISWA') {
      const kelasId = await this.siswaKelasId(actor.id);
      return this.prisma.materi.findMany({
        where: kelasId ? { OR: [{ kelasId: null }, { kelasId }] } : { kelasId: null },
        orderBy: [{ mapel: 'asc' }, { createdAt: 'desc' }],
        include: { createdBy: INCLUDE_CREATED_BY, kelas: INCLUDE_KELAS },
      });
    }
    return this.prisma.materi.findMany({
      orderBy: [{ mapel: 'asc' }, { createdAt: 'desc' }],
      include: { createdBy: INCLUDE_CREATED_BY, kelas: INCLUDE_KELAS },
    });
  }

  async findOne(id: string, actor: Actor) {
    const materi = await this.prisma.materi.findUnique({
      where: { id },
      include: { createdBy: INCLUDE_CREATED_BY, kelas: INCLUDE_KELAS },
    });
    if (!materi) throw new NotFoundException('Materi tidak ditemukan');

    if (actor.role === 'SISWA' && materi.kelasId) {
      const kelasId = await this.siswaKelasId(actor.id);
      if (kelasId !== materi.kelasId) throw new ForbiddenException('Materi ini bukan untuk kelasmu');
    }
    return materi;
  }

  async create(dto: CreateMateriDto, fileUrl: string | undefined, fileName: string | undefined, actorId: string) {
    const materi = await this.prisma.materi.create({
      data: {
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        mapel: dto.mapel,
        kelasId: dto.kelasId || null,
        fileUrl,
        fileName,
        createdById: actorId,
      },
      include: { createdBy: INCLUDE_CREATED_BY, kelas: INCLUDE_KELAS },
    });
    await this.notifySiswaBaru(materi.kelasId, 'Materi baru', `${materi.mapel} — ${materi.judul}`);
    return materi;
  }

  async update(id: string, dto: UpdateMateriDto, fileUrl?: string, fileName?: string) {
    const existing = await this.prisma.materi.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Materi tidak ditemukan');

    return this.prisma.materi.update({
      where: { id },
      data: {
        ...(dto.judul !== undefined ? { judul: dto.judul } : {}),
        ...(dto.deskripsi !== undefined ? { deskripsi: dto.deskripsi } : {}),
        ...(dto.mapel !== undefined ? { mapel: dto.mapel } : {}),
        ...(dto.kelasId !== undefined ? { kelasId: dto.kelasId || null } : {}),
        ...(fileUrl ? { fileUrl, fileName } : {}),
      },
      include: { createdBy: INCLUDE_CREATED_BY, kelas: INCLUDE_KELAS },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.materi.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Materi tidak ditemukan');
    return this.prisma.materi.delete({ where: { id } });
  }
}
