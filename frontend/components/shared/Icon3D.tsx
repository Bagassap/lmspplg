import type { CSSProperties, ElementType } from "react";

export type Tone3D = "indigo" | "emerald" | "amber" | "violet" | "sky";

export const TONE_3D: Record<Tone3D, [string, string]> = {
  // Palet ikon hanya 4 warna (hijau, biru, oranye, ungu): "indigo" dipetakan ke ungu.
  indigo: ["#7C3AED", "#6B21A8"],
  emerald: ["#10B981", "#0F766E"],
  amber: ["#F59E0B", "#EA580C"],
  violet: ["#7C3AED", "#6B21A8"],
  sky: ["#38BDF8", "#2563EB"],
};

export const TONE_ORDER: Tone3D[] = ["sky", "emerald", "violet", "amber"];

export const MENU_TONE = {
  dashboard: "indigo",
  materi: "indigo",
  tugas: "indigo",
  dataSiswa: "emerald",
  catatan: "emerald",
  magang: "amber",
  ukk: "violet",
  pengumuman: "sky",
  absensi: "sky",
  akun: "indigo",
} as const satisfies Record<string, Tone3D>;

export function toneAt(i: number): Tone3D {
  return TONE_ORDER[((i % TONE_ORDER.length) + TONE_ORDER.length) % TONE_ORDER.length];
}

const COLOR_TONE: Record<string, Tone3D> = {
  "#00AAFA": "sky",
  "#0082FB": "sky",
  "#0064E0": "sky",
  "#A1F919": "emerald",
  "#C3F84A": "emerald",
  "#5D900F": "emerald",
  "#48700B": "emerald",
  "#00D67F": "emerald",
  "#3E03B3": "indigo",
  "#2D0281": "indigo",
  "#0033FF": "indigo",
  "#000000": "violet",
  "#FF7A00": "amber",
  "#EF4444": "amber",
  "#F26A3D": "amber",
  "#0EA5E9": "sky",
  "#0F172A": "violet",
};

export function toneFromColor(color: string | undefined | null, fallback: Tone3D = "indigo"): Tone3D {
  if (!color) return fallback;
  const hex = color.match(/#[0-9a-fA-F]{6}/)?.[0]?.toUpperCase();
  return (hex && COLOR_TONE[hex]) || fallback;
}

export function icon3dStyle(tone: Tone3D): CSSProperties {
  const [c1, c2] = TONE_3D[tone];
  return {
    background: `linear-gradient(155deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 55%), linear-gradient(135deg, ${c1}, ${c2})`,
    boxShadow: `0 5px 10px -3px ${c1}80, inset 0 2px 2px rgba(255,255,255,0.5), inset 0 -3px 4px rgba(0,0,0,0.18)`,
  };
}

export function Icon3D({
  icon: Icon, tone, size = 40, iconSize, rounded = "rounded-xl", className = "", children,
}: {
  icon?: ElementType; tone: Tone3D; size?: number; iconSize?: number; rounded?: string;
  className?: string; children?: React.ReactNode;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center text-white ${rounded} ${className}`}
      style={{ width: size, height: size, ...icon3dStyle(tone) }}
    >
      {Icon && <Icon size={iconSize ?? Math.round(size * 0.44)} color="#fff" />}
      {children}
    </span>
  );
}

export function OptionCard3D({
  icon, tone, label, caption, active, disabled, title, onClick, stack,
}: {
  icon: ElementType; tone: Tone3D; label: string; caption?: string;
  active: boolean; disabled?: boolean; title?: string; onClick: () => void; stack?: boolean;
}) {
  const [c1] = TONE_3D[tone];
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`flex min-w-0 ${stack ? "flex-col items-center justify-center gap-1.5 text-center" : "items-center gap-2.5 text-left"} rounded-2xl border bg-white p-2.5 transition-all disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 ${
        active ? "shadow-sm" : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      }`}
      style={active ? { borderColor: c1, boxShadow: `0 0 0 1px ${c1}` } : undefined}
    >
      <Icon3D icon={icon} tone={tone} size={34} iconSize={16} />
      <span className={`min-w-0 max-w-full ${stack ? "text-center" : ""}`}>
        <span className="block truncate text-[11px] font-bold text-slate-800 dark:text-white">{label}</span>
        {caption && <span className="block truncate text-[9.5px] leading-tight text-slate-400 dark:text-slate-500">{caption}</span>}
      </span>
    </button>
  );
}
