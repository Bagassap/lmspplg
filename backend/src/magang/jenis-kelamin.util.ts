import { BadRequestException } from '@nestjs/common';

export function pastikanJenisKelaminCocok(
  tempat: { namaTempat: string; jenisKelamin: string | null },
  siswa: { jenisKelamin: string | null },
) {
  if (!tempat.jenisKelamin || !siswa.jenisKelamin) return;
  if (tempat.jenisKelamin !== siswa.jenisKelamin) {
    throw new BadRequestException(`"${tempat.namaTempat}" hanya menerima siswa ${tempat.jenisKelamin.toLowerCase()}`);
  }
}
