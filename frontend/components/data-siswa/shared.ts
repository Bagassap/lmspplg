export type KelasRef = {
  id: string;
  nama: string;
  waliKelasGuru?: { user: { id: string; nama: string } } | null;
};

export type SiswaCardData = {
  id: string;
  nis: string;
  nama: string | null;
  kelas: KelasRef;
  jurusan: string | null;
  angkatan: number;
  jenisKelamin: string | null;
  noHp: string | null;
  alamat: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  namaOrtu?: string | null;
  user: { id: string; nama: string; email: string | null; mustChangePassword?: boolean } | null;
};

export const JURUSAN_OPTIONS = [
  "Pengembangan Perangkat Lunak dan Gim",
  "Pengembangan Gim",
  "Rekayasa Perangkat Lunak",
];

export function getNama(s: SiswaCardData): string {
  return s.nama ?? s.user?.nama ?? "—";
}

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function kelasShort(kelas: string): string {
  return kelas
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Pengembangan Gim", "Gim")
    .replace("Rekayasa Perangkat Lunak", "RPL");
}

export function formatTglShort(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// Ungu, biru, hijau, merah muda, oranye, teal — dipilih berdasarkan hash nama/id agar konsisten per siswa.
export const AVATAR_PALETTE: { from: string; to: string; light: string; text: string }[] = [
  { from: "#8B5CF6", to: "#6D28D9", light: "#F5F0FF", text: "#6D28D9" }, // ungu
  { from: "#4F8EF7", to: "#3B7CE8", light: "#EEF4FF", text: "#2563EB" }, // biru
  { from: "#10B981", to: "#0D9488", light: "#F0FDFA", text: "#0F766E" }, // hijau
  { from: "#EC4899", to: "#DB2777", light: "#FDF2F8", text: "#9D174D" }, // merah muda
  { from: "#F59E0B", to: "#EA580C", light: "#FFF7ED", text: "#C2410C" }, // oranye
  { from: "#14B8A6", to: "#0F766E", light: "#F0FDFA", text: "#0F766E" }, // teal
];

export function avatarPaletteFor(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export const KELAS_BADGE = { light: "#EEF4FF", text: "#2563EB" };
export const JURUSAN_BADGE = { light: "#F0FDFA", text: "#0F766E" };
export const GENDER_BADGE = {
  Perempuan: { light: "#FDF2F8", text: "#DB2777" },
  "Laki-laki": { light: "#EFF6FF", text: "#2563EB" },
};
export const STATUS_BADGE = {
  aktif: { light: "#F0FDF4", text: "#16A34A" },
  belumAktif: { light: "#FEF2F2", text: "#DC2626" },
};
