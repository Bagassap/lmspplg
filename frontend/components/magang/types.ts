export type StatusPenempatan = "MENUNGGU" | "AKTIF" | "SELESAI" | "BATAL";

export type TempatMagang = {
  id: string;
  namaTempat: string;
  alamat: string | null;
  kontak: string | null;
  bidangUsaha: string | null;
  kuota: number;
  dukuh?: string | null;
  desa?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  namaPimpinan?: string | null;
  noWaUsaha?: string | null;
  dibuatSiswa?: boolean;
  _count?: { penempatan: number };
};

export type PenempatanMagang = {
  id: string;
  siswa: {
    id: string;
    nis: string;
    nama: string | null;
    kelas: { id: string; nama: string };
    user: { id: string; nama: string; fotoProfil: string | null } | null;
  };
  tempatMagang: TempatMagang;
  guruPembimbing: { id: string; user: { id: string; nama: string } } | null;
  kelompokId?: string | null;
  suratKeteranganUrl?: string | null;
  suratKeteranganNama?: string | null;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  status: StatusPenempatan;
  createdAt: string;
};

export const STATUS_PENEMPATAN_CFG: Record<StatusPenempatan, { label: string; bg: string; clr: string }> = {
  MENUNGGU: { label: "Menunggu guru", bg: "#FFE9E2", clr: "#E8562B" },
  AKTIF: { label: "Aktif", bg: "#F1EDFA", clr: "#3E03B3" },
  SELESAI: { label: "Selesai", bg: "#F1EDFA", clr: "#3E03B3" },
  BATAL: { label: "Batal", bg: "#F2F2F2", clr: "#0F172A" },
};
