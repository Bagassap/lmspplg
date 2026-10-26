"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, X, Lock, ChevronRight } from "lucide-react";
import type { UserPayload } from "@/lib/auth";
import { useDashboardMenu, type MenuItem } from "./useDashboardMenu";
import { useIsAppMode } from "@/lib/pwaInstall";

const SIDE_KEYS = ["absensi-harian", "materi", "pengumuman"];
const PINNED_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "absensi-harian": "Absensi",
  materi: "Materi",
  pengumuman: "Pengumuman",
};

function isItemActive(item: MenuItem, pathname: string): boolean {
  if (item.href) return pathname === item.href || pathname.startsWith(item.href + "/");
  return item.submenu?.some((s) => pathname.startsWith(s.href)) ?? false;
}

export function MobileBottomNav({ user }: { user: UserPayload }) {
  const pathname = usePathname();
  const { items, pendingResetCount } = useDashboardMenu(user);
  const [moreOpen, setMoreOpen] = useState(false);
  const appMode = useIsAppMode();
  const ACT = "#3E03B3";
  const ON = ACT;
  const OFF = "#94a3b8";
  const ORANGE = "#F26A3D";

  const dashboardItem = items.find((i) => i.key === "dashboard");
  const side = SIDE_KEYS
    .map((key) => items.find((i) => i.key === key))
    .filter((i): i is MenuItem => !!i);
  const leftPinned = side.slice(0, 2);
  const rightPinned = side.slice(2);
  const rest = items.filter((i) => i.key !== "dashboard" && !SIDE_KEYS.includes(i.key));
  const menuHref = `/${user.role.toLowerCase()}/menu`;
  const moreActive = rest.some((i) => isItemActive(i, pathname)) || pathname === menuHref;
  const dashboardActive = dashboardItem ? isItemActive(dashboardItem, pathname) : false;

  return (
    <>
      {appMode && (
        // Lapisan blur di belakang bilah mengambang: konten yang lewat di
        // bawahnya jadi buram dengan batas yang halus.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-32 bg-linear-to-t from-surface via-surface/70 to-transparent backdrop-blur-md dark:from-[#0F172A] dark:via-[#0F172A]/70 lg:hidden"
          style={{
            WebkitMaskImage: "linear-gradient(to top, #000 55%, transparent)",
            maskImage: "linear-gradient(to top, #000 55%, transparent)",
          }}
        />
      )}
      <nav
        className={
          appMode
            ? "fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_16px_36px_-10px_rgba(62,3,179,0.45)] dark:border-white/10 dark:bg-[#1E293B] lg:hidden"
            : "fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] dark:border-white/6 dark:bg-[#1E293B] lg:hidden"
        }
      >
        {appMode ? (
          <>
            {[...[dashboardItem, ...side].filter((i): i is MenuItem => !!i).map((item) => ({
              key: item.key, href: item.href ?? "#", Icon: item.icon, label: PINNED_LABELS[item.key], active: isItemActive(item, pathname), dot: false,
            })), { key: "menu", href: menuHref, Icon: LayoutGrid, label: "Menu", active: moreActive, dot: pendingResetCount > 0 }].map((t) => (
              <Link key={t.key} href={t.href} aria-label={t.label}
                className={`relative flex items-center justify-center gap-1.5 rounded-xl transition-all duration-300 ease-out ${
                  t.active ? "h-12 flex-[2.4] bg-[#3E03B3] px-3 text-white shadow-[0_8px_18px_-6px_rgba(62,3,179,0.65)]" : "h-12 flex-1 text-slate-500 dark:text-slate-400"
                }`}>
                <t.Icon size={20} />
                {t.active && <span className="truncate text-[12px] font-bold">{t.label}</span>}
                {t.dot && !t.active && <span className="absolute right-[28%] top-2.5 h-2 w-2 rounded-xl bg-[#F26A3D]" />}
              </Link>
            ))}
          </>
        ) : (
        <>
        {leftPinned.map((item) => {
          const active = isItemActive(item, pathname);
          return (
            <Link
              key={item.key}
              href={item.href ?? "#"}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
            >
              <span className={`flex h-8 w-14 items-center justify-center rounded-xl transition-colors ${appMode && active ? "bg-[#F1EDFA]" : ""}`}><item.icon size={20} style={{ color: active ? ON : OFF }} /></span>
              <span className={`text-[10px] font-semibold ${active ? "text-[#3E03B3]" : "text-slate-400 dark:text-slate-500"}`}>
                {PINNED_LABELS[item.key]}
              </span>
            </Link>
          );
        })}

        {dashboardItem && (
          <Link href={dashboardItem.href ?? "#"} className="relative flex flex-1 flex-col items-center">
            <span
              className={`absolute -top-6 flex h-14 w-14 items-center justify-center rounded-xl text-white ring-4 ring-white dark:ring-[#1E293B]`}
              style={{ background: ACT, boxShadow: "0 10px 24px -6px rgba(62,3,179,0.55)" }}
            >
              <dashboardItem.icon size={22} />
            </span>
            <span
              className="mt-8 text-[10px] font-semibold"
              style={{ color: dashboardActive ? ON : OFF }}
            >
              Dashboard
            </span>
          </Link>
        )}

        {rightPinned.map((item) => {
          const active = isItemActive(item, pathname);
          return (
            <Link
              key={item.key}
              href={item.href ?? "#"}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
            >
              <span className={`flex h-8 w-14 items-center justify-center rounded-xl transition-colors ${appMode && active ? "bg-[#F1EDFA]" : ""}`}><item.icon size={20} style={{ color: active ? ON : OFF }} /></span>
              <span className={`text-[10px] font-semibold ${active ? "text-[#3E03B3]" : "text-slate-400 dark:text-slate-500"}`}>
                {PINNED_LABELS[item.key]}
              </span>
            </Link>
          );
        })}
        {!appMode && <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
        >
          <span className={`flex h-8 w-14 items-center justify-center rounded-xl transition-colors ${appMode && moreActive ? "bg-[#F1EDFA]" : ""}`}><LayoutGrid size={20} style={{ color: moreActive ? ON : OFF }} /></span>
          {pendingResetCount > 0 && (
            <span className={`absolute right-[30%] top-1.5 h-2 w-2 rounded-xl ${appMode ? "bg-[#F26A3D]" : "bg-[#3E03B3]"}`} />
          )}
          <span className={`text-[10px] font-semibold ${moreActive ? "text-[#3E03B3]" : "text-slate-400 dark:text-slate-500"}`}>
            Lainnya
          </span>
        </button>}
        </>
        )}
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 flex max-h-[75vh] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] dark:bg-[#1E293B]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/6">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Menu Lainnya</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
                {rest.map((item) => (
                  <MoreMenuItem
                    key={item.key}
                    item={item}
                    pendingResetCount={pendingResetCount}
                    onNavigate={() => setMoreOpen(false)}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function MoreMenuItem({ item, pendingResetCount, onNavigate }: {
  item: MenuItem; pendingResetCount: number; onNavigate: () => void;
}) {
  if (item.submenu && !item.locked) {
    return (
      <div>
        <p className="flex items-center gap-2 px-2.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <item.icon size={13} /> {item.label}
        </p>
        <div className="space-y-0.5">
          {item.submenu.map((sub) => (
            <Link
              key={sub.href}
              href={sub.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.07]">
                <sub.icon size={14} className="text-slate-500 dark:text-slate-300" />
              </span>
              {sub.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-600"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.07]">
        <item.icon size={16} className="text-slate-500 dark:text-slate-300" />
      </span>
      <span className="flex-1">{item.label}</span>
      {item.key === "manajemen-password" && pendingResetCount > 0 && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-xl bg-[#3E03B3] px-1.5 text-[10px] font-bold text-white">
          {pendingResetCount > 99 ? "99+" : pendingResetCount}
        </span>
      )}
      {item.locked ? (
        <Lock size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />
      ) : (
        <ChevronRight size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />
      )}
    </Link>
  );
}
