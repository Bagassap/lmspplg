import { CheckCircle2, MinusCircle, AlertCircle, Thermometer, LogOut, CalendarDays, CalendarRange, CalendarCheck2 } from "lucide-react";
import type { StatusAbsensi } from "./types";
import type { Tone3D } from "@/components/shared/Icon3D";
import { isAppModeNow } from "@/lib/pwaInstall";

export const STATUS_CFG: Record<StatusAbsensi, {
  label: string; bg: string; clr: string; darkBg: string; icon: React.ElementType;
}> = {
  HADIR: { label: "Hadir", bg: "#F1EDFA", clr: "#3E03B3", darkBg: "#F26A3D20", icon: CheckCircle2 },
  IZIN:  { label: "Izin",  bg: "#E6F7FF", clr: "#0EA5E9", darkBg: "#0EA5E920", icon: AlertCircle  },
  SAKIT: { label: "Sakit", bg: "#E6F7FF", clr: "#0EA5E9", darkBg: "#0EA5E920", icon: Thermometer  },
  ALPA:  { label: "Alpa",  bg: "#F2F2F2", clr: "#0F172A", darkBg: "#0F172A20", icon: MinusCircle  },
};

export const PULANG_CFG = {
  label: "Pulang", bg: "#F1EDFA", clr: "#3E03B3", darkBg: "#F26A3D20", icon: LogOut,
};

export const STATUS_GRADIENT: Record<StatusAbsensi, string> = {
  HADIR: "#F26A3D",
  IZIN:  "#0EA5E9",
  SAKIT: "#0EA5E9",
  ALPA:  "#0F172A",
};
export const PULANG_GRADIENT = "#3E03B3";

export const BRAND_GRADIENT = "#3E03B3";

export const CARD_GRADIENTS = [
  "#3E03B3",
  "#F26A3D",
  "#F26A3D",
  "#F26A3D",
  "#0EA5E9",
  "#0F172A",
];

export const CARD_ACCENT = ["#3E03B3", "#F26A3D", "#F26A3D", "#F26A3D", "#0EA5E9", "#0F172A"];

export const DASHBOARD_GRADIENTS = [
  "#0EA5E9",
  "#F26A3D",
  "#F26A3D",
  "#3E03B3",
];
export const DASHBOARD_ACCENT = ["#0EA5E9", "#F26A3D", "#F26A3D", "#3E03B3"];
export const DASHBOARD_PASTEL = ["#F1EDFA", "#F1EDFA", "#F1EDFA", "#F1EDFA"];

export const WALLET_ON_TEXT = ["#FFFFFF", "#0F172A", "#0F172A", "#FFFFFF"];

export const WALLET_GRADIENTS = [
  "#0EA5E9",
  "#F26A3D",
  "#F26A3D",
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
  return gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF";
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

/* Mode aplikasi: warna status memakai palet 5 warna (ungu + hijau, biru, oranye, ungu).
   Dijalankan sekali di klien sebelum komponen merender; browser biasa tidak berubah. */
if (typeof window !== "undefined") {
  Object.assign(STATUS_CFG.HADIR, { bg: "#E3F8EF", clr: "#059669", darkBg: "#05966933" });
  Object.assign(STATUS_CFG.IZIN, { bg: "#E0F2FE", clr: "#0284C7", darkBg: "#0284C733" });
  Object.assign(STATUS_CFG.SAKIT, { bg: "#FFF4E0", clr: "#D97706", darkBg: "#D9770633" });
  Object.assign(STATUS_CFG.ALPA, { bg: "#FFE9E2", clr: "#F26A3D", darkBg: "#F26A3D33" });
  Object.assign(PULANG_CFG, { bg: "#F1EDFA", clr: "#3E03B3", darkBg: "#3E03B333" });
  Object.assign(STATUS_GRADIENT, { HADIR: "#10B981", IZIN: "#0EA5E9", SAKIT: "#F59E0B", ALPA: "#F26A3D" });
  CARD_GRADIENTS.splice(0, CARD_GRADIENTS.length, "#3E03B3", "#10B981", "#F59E0B", "#10B981", "#0EA5E9", "#F26A3D");
  CARD_ACCENT.splice(0, CARD_ACCENT.length, "#3E03B3", "#059669", "#D97706", "#059669", "#0284C7", "#F26A3D");
  DASHBOARD_GRADIENTS.splice(0, DASHBOARD_GRADIENTS.length, "#0EA5E9", "#10B981", "#F59E0B", "#3E03B3");
  DASHBOARD_ACCENT.splice(0, DASHBOARD_ACCENT.length, "#0284C7", "#059669", "#D97706", "#3E03B3");
  DASHBOARD_PASTEL.splice(0, DASHBOARD_PASTEL.length, "#E0F2FE", "#E3F8EF", "#FFF4E0", "#F1EDFA");
  WALLET_ON_TEXT.splice(0, WALLET_ON_TEXT.length, "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF");
  WALLET_GRADIENTS.splice(0, WALLET_GRADIENTS.length, "#0EA5E9", "#10B981", "#F59E0B", "#3E03B3");
}
