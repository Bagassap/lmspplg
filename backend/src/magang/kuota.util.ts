import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export async function hitungTerisi(prisma: PrismaService, tempatMagangId: string, kecualiSiswaId?: string | null) {
  const kecuali = kecualiSiswaId ? { siswaId: { not: kecualiSiswaId } } : {};
  const [daftar, tempat] = await Promise.all([
    prisma.pendaftaranMagang.findMany({
      where: { tempatMagangId, status: { in: ['MENUNGGU', 'DITERIMA'] }, ...kecuali },
      select: { siswaId: true },
    }),
    prisma.penempatanMagang.findMany({
      where: { tempatMagangId, status: { in: ['MENUNGGU', 'AKTIF'] }, ...kecuali },
      select: { siswaId: true },
    }),
  ]);
  return new Set([...daftar, ...tempat].map((r) => r.siswaId)).size;
}

export async function pastikanKuotaTersedia(
  prisma: PrismaService,
  tempat: { id: string; namaTempat: string; kuota: number; dibuatSiswa?: boolean | null },
  siswaId?: string | null,
) {
  if (tempat.dibuatSiswa) return;
  const terisi = await hitungTerisi(prisma, tempat.id, siswaId);
  if (terisi >= tempat.kuota) {
    throw new BadRequestException(`Kuota "${tempat.namaTempat}" sudah penuh (${terisi}/${tempat.kuota})`);
  }
}
