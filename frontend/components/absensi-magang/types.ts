import type { StatusAbsensi, SiswaAbsensi } from "@/components/absensi-harian/types";

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

export type RangeSiswaSummary = {
  HADIR: number; IZIN: number; SAKIT: number; ALPA: number;
  totalHariEfektif: number; persentaseKehadiran: number;
};
export type RangeSiswaRow = {
  siswaId: string;
  nama: string | null;
  nis: string | null;
  summary: RangeSiswaSummary;
};
export type RekapRangeData = {
  tempatMagang: { namaTempat: string } | null;
  tanggalMulai: string;
  tanggalSelesai: string;
  tanggalList: string[];
  siswa: RangeSiswaRow[];
};
