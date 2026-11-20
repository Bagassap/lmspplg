export type StatusPenempatan = "MENUNGGU" | "AKTIF" | "SELESAI" | "BATAL";

export type TempatMagang = {
  id: string;
  namaTempat: string;
  alamat: string | null;
  kontak: string | null;
  bidangUsaha: string | null;
  kuota: number;
  dukuh?: string | null;
  rt?: string | null;
  rw?: string | null;
  desa?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  namaPimpinan?: string | null;
  noWaUsaha?: string | null;
  jenisKelamin?: string | null;
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

export type StatusPendaftaran = "MENUNGGU" | "DITERIMA" | "DITOLAK";

export type Alamat = { dukuh: string; rt: string; rw: string; desa: string; kecamatan: string; kabupaten: string };

export type PendaftaranMagang = Alamat & {
  id: string;
  noWa: string;
  tempatMagangId: string | null;
  tempatMagang?: ({ id: string; namaTempat: string; alamat?: string | null; kuota?: number; jenisKelamin?: string | null } & Partial<Record<keyof Alamat, string | null>>) | null;
  status: StatusPendaftaran;
  alasanTolak: string | null;
  diverifikasiAt: string | null;
  createdAt: string;
  updatedAt: string;
  siswa?: PenempatanMagang["siswa"];
};

export type PendaftaranSaya = {
  profil: Alamat & { nama: string; nis: string; kelas: string; noHp: string; jenisKelamin: string | null };
  pendaftaran: PendaftaranMagang | null;
  sudahPenempatan: boolean;
};

export type Instansi = {
  id: string;
  namaTempat: string;
  namaPimpinan: string | null;
  dukuh: string | null;
  rt: string | null;
  rw: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  alamat: string | null;
  noWaUsaha: string | null;
  jenisKelamin: string | null;
  dibuatSiswa: boolean;
  kuota: number;
  terisi: number;
  sisa: number | null;
  siswa: { id: string; nama: string; kelas: string }[];
};

export const STATUS_PENDAFTARAN_CFG: Record<StatusPendaftaran, { label: string; bg: string; clr: string }> = {
  MENUNGGU: { label: "Menunggu verifikasi", bg: "#F1EDFA", clr: "#3E03B3" },
  DITERIMA: { label: "Terverifikasi", bg: "#E4F5EC", clr: "#22A06B" },
  DITOLAK: { label: "Ditolak", bg: "#FEE2E2", clr: "#DC2626" },
};

export function formatAlamat(a: Partial<Record<keyof Alamat, string | null>> & { alamat?: string | null }): string {
  const isi = (v?: string | null) => (v ?? "").trim();
  if (!isi(a.desa) && !isi(a.kecamatan) && !isi(a.kabupaten)) return isi(a.alamat) || "-";
  const rtRw = [isi(a.rt) && `RT ${isi(a.rt)}`, isi(a.rw) && `RW ${isi(a.rw)}`].filter(Boolean).join("/");
  return [
    [isi(a.dukuh) && `Dukuh ${isi(a.dukuh)}`, rtRw].filter(Boolean).join(" "),
    isi(a.desa) && `Desa ${isi(a.desa)}`,
    isi(a.kecamatan) && `Kec. ${isi(a.kecamatan)}`,
    isi(a.kabupaten) && `Kab. ${isi(a.kabupaten)}`,
  ].filter(Boolean).join(", ");
}

export const JENIS_KELAMIN_TEMPAT: { value: string; label: string }[] = [
  { value: "Semua", label: "Laki-laki & Perempuan" },
  { value: "Laki-laki", label: "Laki-laki saja" },
  { value: "Perempuan", label: "Perempuan saja" },
];

export function labelJenisKelaminTempat(v?: string | null) {
  return v === "Laki-laki" ? "Laki-laki saja" : v === "Perempuan" ? "Perempuan saja" : "Laki-laki & Perempuan";
}

export function tempatCocokJenisKelamin(t: { jenisKelamin?: string | null }, jk?: string | null) {
  return !t.jenisKelamin || !jk || t.jenisKelamin === jk;
}
