import type { StatusAbsensi, SiswaAbsensi } from "@/components/absensi-harian/types";

// Bentuknya sengaja identik dengan Absensi Harian (lihat
// components/absensi-harian/types.ts) supaya tabel/modal dari sana bisa
// dipakai ulang langsung — bedanya di sini di-scope oleh TempatMagang.
export type { StatusAbsensi, FilterAbsensi, SiswaAbsensi } from "@/components/absensi-harian/types";

export type TempatMagang = {
  id: string;
  namaTempat: string;
  alamat: string;
  kontak: string | null;
  bidangUsaha: string | null;
  kuota: number;
};

export type RekapTempat = {
  tempatMagangId: string;
  tempatMagang: TempatMagang;
  tanggal: string;
  rekap: Record<StatusAbsensi, number>;
  pulangCount: number;
  siswa: SiswaAbsensi[];
};
