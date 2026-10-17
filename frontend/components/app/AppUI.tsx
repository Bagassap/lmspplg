"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useIsAppMode } from "@/lib/pwaInstall";

export const APP_ACCENT = "#F26A3D";
export const APP_SOFT = "#FFE9E2";
export const APP_PURPLE = "#3E03B3";

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

export function AppBanner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl px-5 py-5 ${className}`} style={{ background: APP_SOFT }}>
      {children}
    </div>
  );
}

export function AppInfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${APP_PURPLE}22`, color: APP_PURPLE }}>
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
            {active && <motion.span layoutId={layoutId} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ background: APP_ACCENT }} />}
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
    : { background: APP_ACCENT, color: "#fff", boxShadow: "0 10px 24px -8px rgba(242,106,61,0.7)" };
  const cls = `flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-bold transition active:scale-[0.98] ${className}`;
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>{children}</a>;
  }
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>{children}</button>;
}

export function AppEmpty({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: APP_SOFT, color: APP_ACCENT }}>
        <Icon size={24} />
      </span>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
      {desc && <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
    </div>
  );
}
