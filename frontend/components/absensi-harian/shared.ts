import { CheckCircle2, MinusCircle, AlertCircle, Thermometer, LogOut, CalendarDays, CalendarRange, CalendarCheck2 } from "lucide-react";
import type { StatusAbsensi } from "./types";

export const STATUS_CFG: Record<StatusAbsensi, {
  label: string; bg: string; clr: string; darkBg: string; icon: React.ElementType;
}> = {
  HADIR: { label: "Hadir", bg: "#E3FBF0", clr: "#00D67F", darkBg: "#00D67F20", icon: CheckCircle2 },
  IZIN:  { label: "Izin",  bg: "#F0ECFF", clr: "#0082FB", darkBg: "#6334F420", icon: AlertCircle  },
  SAKIT: { label: "Sakit", bg: "#FFF5DC", clr: "#E6A800", darkBg: "#E6A80020", icon: Thermometer  },
  ALPA:  { label: "Alpa",  bg: "#FEE9EA", clr: "#EF4444", darkBg: "#FF364420", icon: MinusCircle  },
};

export const PULANG_CFG = {
  label: "Pulang", bg: "#EAF3FF", clr: "#0082FB", darkBg: "#0033FF20", icon: LogOut,
};

// Gradients derived directly from each status's own `clr` (dark stop) blended
// toward white (light stop) — no new hues introduced, just a lighter tint of
// the color already used for that status everywhere else in the app.
export const STATUS_GRADIENT: Record<StatusAbsensi, string> = {
  HADIR: "linear-gradient(135deg,#00D67F,#7CD9BA)",
  IZIN:  "linear-gradient(135deg,#0082FB,#A98FF9)",
  SAKIT: "linear-gradient(135deg,#E6A800,#F1CF73)",
  ALPA:  "linear-gradient(135deg,#EF4444,#FF9098)",
};
export const PULANG_GRADIENT = "linear-gradient(135deg,#0082FB,#738FFF)";

export const BRAND_GRADIENT = "#0082FB";

// Palet utama aplikasi = Meta color palette (#0082FB/#0064E0 biru +
// #F1F5F8/#1C2B33 netral). Hijau (#00D67F) & merah (#EF4444) HANYA dipakai
// untuk makna sukses/error yang sesungguhnya (lihat STATUS_CFG) — untuk
// dekorasi/rotasi kartu yang tidak merepresentasikan sukses/error/warning
// (mis. kartu kelas, kartu ringkasan), semua varian di bawah ini sengaja
// cuma memakai gradasi biru-ke-tinta (#0082FB/#0064E0/#1C2B33) supaya tidak
// ada warna lain di luar palet.
export const CARD_GRADIENTS = [
  "linear-gradient(135deg,#0082FB,#0064E0)",
  "linear-gradient(135deg,#EF4444,#FF9098)",
  "linear-gradient(135deg,#F59E0B,#FCD34D)",
  "linear-gradient(135deg,#00D67F,#7CD9BA)",
  "linear-gradient(135deg,#4FB0FF,#0082FB)",
  "linear-gradient(135deg,#1C2B33,#0064E0)",
];

// Solid dominant hue for each CARD_GRADIENTS entry — used to color an icon
// sitting on a solid white badge over that gradient, without ever needing
// an alpha/opacity color.
export const CARD_ACCENT = ["#0082FB", "#EF4444", "#F59E0B", "#00D67F", "#0082FB", "#1C2B33"];

// Same 4-tone rotation as the "Akses Cepat" quick-access cards on the
// admin/guru/siswa dashboards — semua varian biru-ke-tinta dari palet
// utama, dibedakan lewat gelap/terangnya saja (lihat catatan di atas).
export const DASHBOARD_GRADIENTS = [
  "linear-gradient(135deg,#0082FB,#0064E0)", // bright
  "linear-gradient(135deg,#0064E0,#1C2B33)", // deep
  "linear-gradient(135deg,#4FB0FF,#0082FB)", // tint
  "linear-gradient(135deg,#1C2B33,#0064E0)", // ink
];
export const DASHBOARD_ACCENT = ["#0082FB", "#0064E0", "#0082FB", "#1C2B33"];
export const DASHBOARD_PASTEL = ["#EAF3FF", "#DCEBFF", "#D6E9FF", "#E7EAEC"];

// Wallet-card style palette for the "Kelas" row on the admin Absensi Harian
// page — order/colors match DASHBOARD_GRADIENTS di atas (bright/deep/tint/
// ink), cycling by kelas index.
export const WALLET_GRADIENTS = [
  "linear-gradient(135deg,#0082FB,#0064E0)", // bright
  "linear-gradient(135deg,#0064E0,#1C2B33)", // deep
  "linear-gradient(135deg,#4FB0FF,#0082FB)", // tint
  "linear-gradient(135deg,#1C2B33,#0064E0)", // ink
];

// Subtle repeating wave-line texture drawn straight into each wallet card's
// gradient background, matching the reference's faint background pattern.
// Still used by the guru Absensi Harian page's kelas cards.
export const WALLET_WAVE_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'%3E%3Cpath d='M0 30 Q15 10 30 30 T60 30 T90 30 T120 30' stroke='white' stroke-opacity='0.35' stroke-width='2' fill='none'/%3E%3Cpath d='M0 45 Q15 25 30 45 T60 45 T90 45 T120 45' stroke='white' stroke-opacity='0.22' stroke-width='2' fill='none'/%3E%3C/svg%3E\")";

// Dot-grid texture for the admin Absensi Harian page's kelas cards —
// a distinct corak from the guru page's wave pattern.
export const WALLET_DOT_PATTERN = "radial-gradient(circle, rgba(255,255,255,0.55) 1.5px, transparent 1.5px)";
export const WALLET_DOT_SIZE = "18px 18px";

// Mirrors the reference "Unduh Laporan PDF" card's 3 gradient period
// buttons exactly — same shape (icon + label + caption stacked, grid-cols-3)
// but toggles the shared exportRange's mode instead of firing a one-shot
// download, since our export needs a separate format pick below (4 kinds).
// Shared by both admin and guru's Absensi Harian pages.
export const RANGE_MODE_CARDS: { key: "harian" | "mingguan" | "bulanan"; label: string; caption: string; icon: React.ElementType; gradient: string }[] = [
  { key: "harian", label: "Harian", caption: "Rekap hari ini", icon: CalendarDays, gradient: "linear-gradient(135deg,#0082FB,#0064E0)" },
  { key: "mingguan", label: "Mingguan", caption: "Rekap minggu ini", icon: CalendarRange, gradient: "linear-gradient(135deg,#00D67F,#00D67F)" },
  { key: "bulanan", label: "Bulanan", caption: "Rekap bulan ini", icon: CalendarCheck2, gradient: "linear-gradient(135deg,#0082FB,#0064E0)" },
];

// Date.prototype.toISOString() always renders the UTC calendar date, not the
// browser's local one — during the ~7h/day window where WIB has already
// crossed into a new date but UTC hasn't (UTC 17:00-23:59 = WIB 00:00-06:59),
// `new Date().toISOString().slice(0, 10)` silently returns yesterday. Mirrors
// the backend's jakartaParts()/todayStr() in absensi-harian.service.ts.
export function todayJakarta(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function formatTgl(tgl?: string) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

export type ExportRangeMode = "harian" | "mingguan" | "bulanan";
export type ExportRange =
  | { mode: "harian"; tanggal: string }
  | { mode: "mingguan"; tanggalMulai: string; tanggalSelesai: string }
  | { mode: "bulanan"; bulan: number; tahun: number };

// Monday-Friday of the week containing `anchor` (yyyy-mm-dd) — hari efektif
// sekolah, mirrors effectiveWeekdaysInRange()/currentWindow() on the backend
// (Sabtu-Minggu never has an absen window). UTC-anchored arithmetic so the
// browser's local timezone can't shift which calendar day "anchor" lands on.
export function weekRangeFor(anchor: string): { start: string; end: string } {
  const [y, m, d] = anchor.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = date.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + mondayOffset);
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  const fmt = (dt: Date) => `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
  return { start: fmt(monday), end: fmt(friday) };
}

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#0082FB", "#EF4444", "#F59E0B", "#4FB0FF", "#00D67F", "#0064E0"];
export function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function parseLokasi(raw: string | null | undefined) {
  if (!raw) return null;
  const parts = raw.split(",");
  if (parts.length >= 2) return { lat: parts[0].trim(), lng: parts[1].trim() };
  return null;
}

export { API_BASE, resolveMediaSrc } from "@/lib/media";
