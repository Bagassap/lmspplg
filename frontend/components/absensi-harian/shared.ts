import { CheckCircle2, MinusCircle, AlertCircle, Thermometer, LogOut } from "lucide-react";
import type { StatusAbsensi } from "./types";

export const STATUS_CFG: Record<StatusAbsensi, {
  label: string; bg: string; clr: string; darkBg: string; icon: React.ElementType;
}> = {
  HADIR: { label: "Hadir", bg: "#E8F8F1", clr: "#10B981", darkBg: "#10B98120", icon: CheckCircle2 },
  IZIN:  { label: "Izin",  bg: "#F0ECFF", clr: "#6334F4", darkBg: "#6334F420", icon: AlertCircle  },
  SAKIT: { label: "Sakit", bg: "#FFF5DC", clr: "#E6A800", darkBg: "#E6A80020", icon: Thermometer  },
  ALPA:  { label: "Alpa",  bg: "#FFE9EA", clr: "#FF3644", darkBg: "#FF364420", icon: MinusCircle  },
};

export const PULANG_CFG = {
  label: "Pulang", bg: "#EAF1FF", clr: "#3B7CE8", darkBg: "#3B7CE820", icon: LogOut,
};

export const BRAND_GRADIENT = "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)";

export const CARD_GRADIENTS = [
  "linear-gradient(135deg,#3B7CE8,#4F8EF7)",
  "linear-gradient(135deg,#EF4444,#F87171)",
  "linear-gradient(135deg,#F59E0B,#FCD34D)",
  "linear-gradient(135deg,#10B981,#34D399)",
  "linear-gradient(135deg,#6334F4,#A855F7)",
  "linear-gradient(135deg,#0EA5E9,#38BDF8)",
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
  return new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#6334F4", "#EF4444", "#F59E0B", "#FF7867", "#10B981", "#3B82F6"];
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

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function resolveMediaSrc(src: string | null | undefined) {
  if (!src) return null;
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  // /uploads/* requires auth now — go through our own proxy (app/api/uploads/[...path])
  // which attaches the session cookie server-side, instead of hitting the backend
  // directly where a plain <img> tag has no way to authenticate.
  if (src.startsWith("/uploads/")) return `/api${src}`;
  return `${API_BASE}${src}`;
}
