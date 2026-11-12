export const ASPEK_NILAI = [
  { key: "struktur_data", label: "Menggunakan Struktur Data" },
  { key: "spesifikasi_program", label: "Menggunakan Spesifikasi Program" },
  { key: "perintah_eksekusi", label: "Menerapkan Perintah Eksekusi Bahasa Pemrograman Berbasis Teks, Grafik, dan Multimedia" },
  { key: "guidelines", label: "Menulis Kode dengan Prinsip sesuai Guidelines dan Best Practices" },
  { key: "terstruktur", label: "Mengimplementasikan Pemrograman Terstruktur" },
  { key: "dokumen_kode", label: "Membuat Dokumen Kode Program" },
  { key: "debugging", label: "Melakukan Debugging" },
  { key: "unit_test", label: "Melaksanakan Pengujian Unit Program" },
] as const;

export type SkorUkk = Record<string, number>;
export type PenilaianUkk = {
  skor?: SkorUkk | null;
  rataRata?: number | null;
  pesanRevisi?: string | null;
  revisiSelesai?: boolean;
  nilaiTertahan?: boolean;
};

export function hitungRata(skor: Record<string, number | string | undefined>): number | null {
  const n = ASPEK_NILAI.map((a) => Number(skor[a.key]));
  if (ASPEK_NILAI.some((a) => skor[a.key] === undefined || skor[a.key] === "") || n.some((x) => !Number.isFinite(x))) return null;
  return Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 100) / 100;
}
