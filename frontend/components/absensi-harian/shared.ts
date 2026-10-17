import { CheckCircle2, MinusCircle, AlertCircle, Thermometer, LogOut, CalendarDays, CalendarRange, CalendarCheck2 } from "lucide-react";
import type { StatusAbsensi } from "./types";
import type { Tone3D } from "@/components/shared/Icon3D";

export const STATUS_CFG: Record<StatusAbsensi, {
  label: string; bg: string; clr: string; darkBg: string; icon: React.ElementType;
}> = {
  HADIR: { label: "Hadir", bg: "#F6FEE8", clr: "#5D900F", darkBg: "#A1F91920", icon: CheckCircle2 },
  IZIN:  { label: "Izin",  bg: "#E6F7FF", clr: "#00AAFA", darkBg: "#00AAFA20", icon: AlertCircle  },
  SAKIT: { label: "Sakit", bg: "#E6F7FF", clr: "#00AAFA", darkBg: "#00AAFA20", icon: Thermometer  },
  ALPA:  { label: "Alpa",  bg: "#F2F2F2", clr: "#000000", darkBg: "#00000020", icon: MinusCircle  },
};

export const PULANG_CFG = {
  label: "Pulang", bg: "#F6FEE8", clr: "#5D900F", darkBg: "#A1F91920", icon: LogOut,
};

export const STATUS_GRADIENT: Record<StatusAbsensi, string> = {
  HADIR: "#A1F919",
  IZIN:  "#00AAFA",
  SAKIT: "#00AAFA",
  ALPA:  "#000000",
};
export const PULANG_GRADIENT = "#3E03B3";

export const BRAND_GRADIENT = "#3E03B3";

export const CARD_GRADIENTS = [
  "#3E03B3",
  "#A1F919",
  "#A1F919",
  "#A1F919",
  "#00AAFA",
  "#000000",
];

export const CARD_ACCENT = ["#3E03B3", "#A1F919", "#A1F919", "#A1F919", "#00AAFA", "#000000"];

export const DASHBOARD_GRADIENTS = [
  "#00AAFA",
  "#A1F919",
  "#A1F919",
  "#3E03B3",
];
export const DASHBOARD_ACCENT = ["#00AAFA", "#A1F919", "#A1F919", "#3E03B3"];
export const DASHBOARD_PASTEL = ["#F1EDFA", "#F6FEE8", "#F6FEE8", "#F1EDFA"];

export const WALLET_ON_TEXT = ["#FFFFFF", "#000000", "#000000", "#FFFFFF"];

export const WALLET_GRADIENTS = [
  "#00AAFA",
  "#A1F919",
  "#A1F919",
  "#3E03B3",
];

export const WALLET_WAVE_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'%3E%3Cpath d='M0 30 Q15 10 30 30 T60 30 T90 30 T120 30' stroke='white' stroke-opacity='0.35' stroke-width='2' fill='none'/%3E%3Cpath d='M0 45 Q15 25 30 45 T60 45 T90 45 T120 45' stroke='white' stroke-opacity='0.22' stroke-width='2' fill='none'/%3E%3C/svg%3E\")";

export const WALLET_DOT_PATTERN = "radial-gradient(circle, rgba(255,255,255,0.55) 1.5px, transparent 1.5px)";
export const WALLET_DOT_SIZE = "18px 18px";

export const RANGE_MODE_CARDS: { key: "harian" | "mingguan" | "bulanan"; label: string; caption: string; icon: React.ElementType; tone: Tone3D }[] = [
  { key: "harian", label: "Harian", caption: "Rekap hari ini", icon: CalendarDays, tone: "sky" },
  { key: "mingguan", label: "Mingguan", caption: "Rekap minggu ini", icon: CalendarRange, tone: "emerald" },
  { key: "bulanan", label: "Bulanan", caption: "Rekap bulan ini", icon: CalendarCheck2, tone: "violet" },
];

export function reportCardFg(gradient: string): string {
  return gradient === "#A1F919" ? "#000000" : "#FFFFFF";
}

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

export function formatTglSlash(tgl: string): string {
  const [y, m, d] = tgl.split("-");
  if (!y || !m || !d) return tgl;
  return `${d}/${m}/${y}`;
}

export type ExportRangeMode = "harian" | "mingguan" | "bulanan";
export type ExportRange =
  | { mode: "harian"; tanggal: string }
  | { mode: "mingguan"; tanggalMulai: string; tanggalSelesai: string }
  | { mode: "bulanan"; bulan: number; tahun: number };

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

export function avatarColor(_name: string) {
  return "#3E03B3";
}

export function parseLokasi(raw: string | null | undefined) {
  if (!raw) return null;
  const parts = raw.split(",");
  if (parts.length >= 2) return { lat: parts[0].trim(), lng: parts[1].trim() };
  return null;
}

export { API_BASE, resolveMediaSrc } from "@/lib/media";
