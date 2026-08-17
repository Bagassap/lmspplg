import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MapelService {
  constructor(private readonly prisma: PrismaService) {}

  async findMineByUserId(userId: string): Promise<string[]> {
    const guru = await this.prisma.guru.findUnique({ where: { userId } });
    if (!guru) return [];
    const rows = await this.prisma.guruMapel.findMany({
      where: { guruId: guru.id },
      select: { nama: true },
      orderBy: { nama: 'asc' },
    });
    return rows.map((r) => r.nama);
  }
}
