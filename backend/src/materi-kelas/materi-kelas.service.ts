import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMateriKelasDto } from './dto/create-materi-kelas.dto';

@Injectable()
export class MateriKelasService {
  constructor(private readonly prisma: PrismaService) {}

  async findByJadwal(jadwalKelasId: string) {
    // Support slug lookup — resolve to real cuid before querying
    const jadwal = await this.prisma.jadwalKelas.findFirst({
      where: { OR: [{ id: jadwalKelasId }, { slug: jadwalKelasId }] },
      select: { id: true },
    });
    const realId = jadwal?.id ?? jadwalKelasId;
    return this.prisma.materiKelas.findMany({
      where: { jadwalKelasId: realId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(dto: CreateMateriKelasDto, fileUrl?: string) {
    return this.prisma.materiKelas.create({
      data: { ...dto, fileUrl },
    });
  }

  async remove(id: string) {
    const item = await this.prisma.materiKelas.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Materi tidak ditemukan');
    return this.prisma.materiKelas.delete({ where: { id } });
  }
}
