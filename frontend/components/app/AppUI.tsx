"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useIsAppMode } from "@/lib/pwaInstall";
import { MobileDetailModal } from "@/components/shared/MobileDetailModal";
import { icon3dStyle } from "@/components/shared/Icon3D";

export const APP_ACCENT = "#3E03B3";
export const APP_SOFT = "#F1EDFA";
export const APP_PURPLE = "#3E03B3";
/** Warna kedua setelah ungu (aksen kecil: roket, lencana, tombol tengah). */
export const APP_ORANGE = "#F26A3D";
/** Latar banner kartu roket: oranye (warna kedua). */
export const APP_HERO = "linear-gradient(135deg, #F26A3D 0%, #FF8A4C 100%)";
/** Banner ungu (identitas/akun). */
export const APP_HERO_PURPLE = "linear-gradient(135deg, #3E03B3 0%, #5B16D9 100%)";

/**
 * Rangka halaman mobile. Di aplikasi terpasang: judul besar tanpa header ungu
 * (pola dashboard/Materi & Tugas). Di browser biasa: header ungu lama dengan
 * tombol kembali, jadi halaman lama tidak berubah.
 */
export function AppMobileFrame({
  eyebrow, title, legacyTitle, backHref = "/siswa/dashboard", children, legacyBodyClass = "space-y-4",
}: {
  eyebrow: string;
  title: string;
  legacyTitle?: string;
  backHref?: string;
  children: React.ReactNode;
  legacyBodyClass?: string;
}) {
  const router = useRouter();
  const app = useIsAppMode();

  if (app) {
    return (
      <div className="space-y-5 lg:hidden">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{eyebrow}</p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative isolate -m-4 lg:hidden" style={{ background: APP_PURPLE }}>
      <div className="relative flex items-center px-4 pb-3 pt-4">
        <button type="button" onClick={() => router.push(backHref)}
          className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
          <ChevronLeft size={18} />
        </button>
        <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">{legacyTitle ?? title}</h1>
      </div>
      <div className={`${legacyBodyClass} rounded-t-[28px] bg-[#FFFFFF] p-4 dark:bg-[#1E293B]`}>{children}</div>
    </div>
  );
}

export function AppSectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{children}</h2>
      {action}
    </div>
  );
}

export function AppCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B] ${className}`;
  if (onClick) {
    return (
      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClick} className={`${cls} w-full text-left`}>
        {children}
      </motion.button>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function AppBanner({ children, className = "", tone = "purple" }: { children: React.ReactNode; className?: string; tone?: "purple" | "orange" }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl px-5 py-5 text-white ${className}`} style={{ background: tone === "orange" ? APP_HERO : APP_HERO_PURPLE }}>
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
      <div className="relative w-full">{children}</div>
    </div>
  );
}

export function AppInfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="app-info-row flex items-start gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
      <span className="app-info-icon mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${APP_PURPLE}22`, color: APP_PURPLE }}>
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <div className="text-sm font-bold text-slate-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
}

export function AppTabs<T extends string>({
  tabs, value, onChange, layoutId,
}: {
  tabs: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  return (
    <div className="flex gap-7 border-b border-slate-200 dark:border-slate-700/60">
      {tabs.map(([key, label]) => {
        const active = value === key;
        return (
          <button key={key} type="button" onClick={() => onChange(key)}
            className="relative pb-3 text-[15px] font-semibold transition-colors"
            style={{ color: active ? APP_ACCENT : "#94a3b8" }}>
            {label}
            {active && <motion.span layoutId={layoutId} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ background: APP_ORANGE }} />}
          </button>
        );
      })}
    </div>
  );
}

export function AppPillButton({
  children, onClick, disabled, type = "button", href, className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  href?: string;
  className?: string;
}) {
  const style = disabled
    ? { background: "#E2E8F0", color: "#94A3B8" }
    : { background: APP_ACCENT, color: "#fff", boxShadow: "0 10px 24px -8px rgba(62,3,179,0.7)" };
  const cls = `flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-bold transition active:scale-[0.98] ${className}`;
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>{children}</a>;
  }
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>{children}</button>;
}

export function AppEmpty({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#FFE9E2", color: APP_ORANGE }}>
        <Icon size={24} />
      </span>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
      {desc && <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
    </div>
  );
}

/** Kelas warna header modal: lavender di aplikasi terpasang, gaya lama di browser. */
export function useSheetHeader(defaultBg: string) {
  const app = useIsAppMode();
  return app
    ? { app, bg: APP_SOFT, title: "text-slate-900", sub: "text-slate-500", iconBox: "bg-white text-[#3E03B3]", close: "bg-white text-slate-600", chip: "bg-white text-slate-600" }
    : { app, bg: defaultBg, title: "text-white", sub: "text-white/60", iconBox: "bg-white/15 text-white", close: "bg-white/15 text-white hover:bg-white/25", chip: "bg-white/20 text-white" };
}

type SheetAction = { label: string; icon?: React.ElementType; onClick?: () => void; href?: string; danger?: boolean };

/**
 * Panel detail dari bawah untuk aplikasi terpasang (pola detail Materi/Tugas):
 * ikon besar, judul, baris info abu-abu, satu tombol utama ungu, dan tombol
 * sekunder (Edit/Hapus/Unduh).
 */
export function AppDetailSheet({
  onClose, icon: Icon, tone = "indigo", title, subtitle, rows, chips, primary, secondary = [],
}: {
  onClose: () => void;
  icon: React.ElementType;
  tone?: "indigo" | "emerald" | "amber" | "violet" | "sky";
  title: string;
  subtitle?: string;
  rows: { label: string; value: React.ReactNode }[];
  chips?: { label: string; values: string[] };
  primary?: SheetAction;
  secondary?: SheetAction[];
}) {
  return (
    <MobileDetailModal onClose={onClose} accent="#FFFFFF">
      <div className="px-6 pb-2 pt-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(tone)}>
          <Icon size={28} color="#fff" />
        </span>
        <h2 className="mt-3 text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="mx-auto max-w-md space-y-2 px-6 pt-3 text-left">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3.5">
            <span className="text-xs font-semibold text-slate-500">{r.label}</span>
            <span className="text-right text-[13px] font-bold text-slate-900">{r.value}</span>
          </div>
        ))}
        {chips && chips.values.length > 0 && (
          <div className="rounded-2xl bg-slate-100 px-4 py-3.5">
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">{chips.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {chips.values.map((v) => (
                <span key={v} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700">{v}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
        {primary && <ActionPill action={primary} primary />}
        {secondary.length > 0 && (
          <div className="flex gap-2">
            {secondary.map((a) => <ActionPill key={a.label} action={a} />)}
          </div>
        )}
      </div>
    </MobileDetailModal>
  );
}

function ActionPill({ action, primary = false }: { action: SheetAction; primary?: boolean }) {
  const Icon = action.icon;
  const cls = `flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition active:scale-[0.98] ${primary ? "w-full text-white" : ""}`;
  const style = primary
    ? { background: APP_ACCENT, boxShadow: "0 10px 24px -8px rgba(62,3,179,0.7)" }
    : { background: "#FFE9E2", color: APP_ORANGE };
  const inner = <>{Icon && <Icon size={15} />}{action.label}</>;
  if (action.href) return <a href={action.href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>{inner}</a>;
  return <button type="button" onClick={action.onClick} className={cls} style={style}>{inner}</button>;
}

type StatusOption = { key: string; label: string; desc: string; icon: React.ElementType; tone: "indigo" | "emerald" | "amber" | "violet" | "sky" };

/** Panel dari bawah untuk mengubah status kehadiran satu siswa (pengganti chip kecil di baris). */
export function AppStatusSheet({
  nama, current, saving, options, onPick, onClose,
}: {
  nama: string;
  current: string | null;
  saving?: boolean;
  options: StatusOption[];
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <MobileDetailModal onClose={onClose} accent="#FFFFFF">
      <div className="px-6 pb-2 pt-9">
        <p className="text-xs font-semibold text-slate-400">Ubah Status Kehadiran</p>
        <h2 className="mt-0.5 text-xl font-extrabold text-slate-900">{nama}</h2>
      </div>
      <div className="space-y-2.5 px-6 pb-7 pt-3">
        {options.map((o) => {
          const active = current === o.key;
          return (
            <button key={o.key} type="button" disabled={saving} onClick={() => onPick(o.key)}
              className="flex w-full items-center gap-4 rounded-3xl p-3 text-left transition active:scale-[0.98] disabled:opacity-60"
              style={active ? { background: APP_SOFT, boxShadow: `inset 0 0 0 2px ${APP_ACCENT}` } : { background: "#F1F5F9" }}>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(o.tone)}>
                <o.icon size={24} color="#fff" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-slate-900">{o.label}</span>
                <span className="block text-[11px] text-slate-500">{o.desc}</span>
              </span>
              {active && <span className="rounded-full px-3 py-1 text-[10px] font-bold text-white" style={{ background: APP_ACCENT }}>Saat ini</span>}
            </button>
          );
        })}
      </div>
    </MobileDetailModal>
  );
}

/** Di mode aplikasi: isi disembunyikan di balik satu baris judul yang bisa dibuka (supaya layar tidak ramai). Di browser: tampil biasa. */
export function AppFold({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  const app = useIsAppMode();
  const [open, setOpen] = useState(false);
  if (!app) return <>{children}</>;
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span>
          {hint && <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</span>}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-slate-100 dark:border-slate-700/50">{children}</div>}
    </div>
  );
}
