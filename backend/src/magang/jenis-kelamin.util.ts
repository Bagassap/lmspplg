import { BadRequestException } from '@nestjs/common';

const LAKI = new Set(['l', 'lk', 'laki', 'laki-laki', 'laki laki', 'pria', 'putra', 'cowo', 'cowok']);
const PEREMPUAN = new Set(['p', 'pr', 'perempuan', 'wanita', 'putri', 'cewe', 'cewek']);

export function normalJenisKelamin(v?: string | null): 'Laki-laki' | 'Perempuan' | null {
  const k = (v ?? '').trim().toLowerCase();
  if (LAKI.has(k)) return 'Laki-laki';
  if (PEREMPUAN.has(k)) return 'Perempuan';
  return null;
}

export function pastikanJenisKelaminCocok(
  tempat: { namaTempat: string; jenisKelamin: string | null },
  siswa: { jenisKelamin: string | null },
) {
  const khusus = normalJenisKelamin(tempat.jenisKelamin);
  if (!khusus) return;
  const jk = normalJenisKelamin(siswa.jenisKelamin);
  if (!jk) {
    throw new BadRequestException(
      `"${tempat.namaTempat}" khusus siswa ${khusus.toLowerCase()}. Jenis kelamin siswa belum terisi di profil.`,
    );
  }
  if (khusus !== jk) {
    throw new BadRequestException(
      `"${tempat.namaTempat}" hanya menerima siswa ${khusus.toLowerCase()}`,
    );
  }
}
