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

function formatTglPadded(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const mon = new Date(y, m - 1, d).toLocaleDateString("id-ID", { month: "short" });
  return `${String(d).padStart(2, "0")} ${mon} ${y}`;
}

export function formatTempatTanggalLahir(tempatLahir: string | null, tanggalLahir: string | null): string {
  const tgl = formatTglPadded(tanggalLahir);
  if (tempatLahir && tgl) return `${tempatLahir}, ${tgl}`;
  if (tempatLahir) return tempatLahir;
  if (tgl) return tgl;
  return "—";
}

// Palet vivid/solid — dipilih berdasarkan hash nama/id (sum charCode % 8) agar konsisten per siswa.
export const AVATAR_PALETTE = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f97316", // orange
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#14b8a6", // teal
] as const;

export function avatarColorFor(seed: string): string {
  let sum = 0;
  for (const c of seed) sum += c.charCodeAt(0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

export function hasGenderData(list: { jenisKelamin: string | null }[]): boolean {
  return list.some((s) => !!s.jenisKelamin);
}
