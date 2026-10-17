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
  dukuh: string | null;
  rt: string | null;
  rw: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  namaOrtu?: string | null;
  user: { id: string; nama: string; email: string | null; mustChangePassword?: boolean; fotoProfil?: string | null } | null;
};

export const JURUSAN_OPTIONS = [
  "Pengembangan Perangkat Lunak dan Gim",
  "Pengembangan Gim",
  "Rekayasa Perangkat Lunak",
];

export function getNama(s: SiswaCardData): string {
  return s.nama ?? s.user?.nama ?? "—";
}

export function waLink(noHp: string | null | undefined): string | null {
  const digits = (noHp ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits.startsWith("62") ? digits : `62${digits}`;
  return `https://wa.me/${normalized}`;
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
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

function formatTglPadded(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const mon = new Date(y, m - 1, d).toLocaleDateString("id-ID", { month: "short", timeZone: "Asia/Jakarta" });
  return `${String(d).padStart(2, "0")} ${mon} ${y}`;
}

export function formatTempatTanggalLahir(tempatLahir: string | null, tanggalLahir: string | null): string {
  const tgl = formatTglPadded(tanggalLahir);
  if (tempatLahir && tgl) return `${tempatLahir}, ${tgl}`;
  if (tempatLahir) return tempatLahir;
  if (tgl) return tgl;
  return "—";
}

type AlamatFields = {
  dukuh: string | null;
  rt: string | null;
  rw: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
};

export function formatAlamatLengkap(s: AlamatFields): string {
  const parts: string[] = [];
  if (s.dukuh) parts.push(`Dukuh ${s.dukuh}`);
  if (s.rt || s.rw) parts.push(`RT ${s.rt || "-"}/RW ${s.rw || "-"}`);
  if (s.desa) parts.push(`Desa ${s.desa}`);
  if (s.kecamatan) parts.push(`Kecamatan ${s.kecamatan}`);
  if (s.kabupaten) parts.push(`Kabupaten ${s.kabupaten}`);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function avatarColorFor(_seed: string): string {
  return "#3E03B3";
}

export function hasGenderData(list: { jenisKelamin: string | null }[]): boolean {
  return list.some((s) => !!s.jenisKelamin);
}

export type MissingField = { key: string; label: string };

const COMPLETENESS_FIELDS: { key: string; label: string; filled: (s: SiswaCardData) => boolean }[] = [
  { key: "jenisKelamin", label: "Jenis Kelamin", filled: (s) => !!s.jenisKelamin },
  { key: "tempatLahir", label: "Tempat Lahir", filled: (s) => !!s.tempatLahir },
  { key: "tanggalLahir", label: "Tanggal Lahir", filled: (s) => !!s.tanggalLahir },
  { key: "noHp", label: "No. HP", filled: (s) => !!s.noHp },
  { key: "namaOrtu", label: "Nama Orang Tua", filled: (s) => !!s.namaOrtu },
  {
    key: "alamat",
    label: "Alamat Lengkap",
    filled: (s) => !!(s.dukuh && s.desa && s.kecamatan && s.kabupaten),
  },
];

export function completeness(s: SiswaCardData): number {
  const filled = COMPLETENESS_FIELDS.filter((f) => f.filled(s)).length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

export function missingFields(s: SiswaCardData): MissingField[] {
  return COMPLETENESS_FIELDS.filter((f) => !f.filled(s)).map((f) => ({ key: f.key, label: f.label }));
}
