import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePengaturanDto } from './dto/update-pengaturan.dto';

// Satu baris singleton (id tetap "singleton") — lihat catatan di model
// PengaturanSistem pada schema.prisma untuk alasan kenapa ini bukan
// berbasis tanggal.
const SINGLETON_ID = 'singleton';

@Injectable()
export class PengaturanService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.pengaturanSistem.findUnique({ where: { id: SINGLETON_ID } });
    if (existing) return existing;
    return this.prisma.pengaturanSistem.create({ data: { id: SINGLETON_ID } });
  }

  async update(dto: UpdatePengaturanDto) {
    return this.prisma.pengaturanSistem.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        magangAktif: dto.magangAktif ?? false,
        ukkAktif: dto.ukkAktif ?? false,
      },
      update: {
        ...(dto.magangAktif !== undefined ? { magangAktif: dto.magangAktif } : {}),
        ...(dto.ukkAktif !== undefined ? { ukkAktif: dto.ukkAktif } : {}),
      },
    });
  }
}
