export type StatusAbsensi = "HADIR" | "IZIN" | "SAKIT" | "ALPA";
export type FilterAbsensi = StatusAbsensi | "PULANG";
export type AbsenWindow = "HADIR" | "PULANG" | "CLOSED";

export type Kelas = {
  id: string;
  nama: string;
  waliKelasGuru?: { user: { id: string; nama: string } } | null;
  _count?: { siswa: number };
};

export type SiswaAbsensi = {
  siswaId: string;
  userId?: string | null;
  nama: string;
  nis?: string | null;
  status: StatusAbsensi | null;
  waktuAbsen?: string | null;
  lokasi?: string | null;
  catatan?: string | null;
  ttd?: string | null;
  foto?: string | null;
  waktuPulang?: string | null;
  lokasiPulang?: string | null;
  catatanPulang?: string | null;
  ttdPulang?: string | null;
  fotoPulang?: string | null;
};

export type RekapKelas = {
  kelasId: string;
  kelas: Kelas;
  tanggal: string;
  rekap: Record<StatusAbsensi, number>;
  pulangCount: number;
  siswa: SiswaAbsensi[];
};
