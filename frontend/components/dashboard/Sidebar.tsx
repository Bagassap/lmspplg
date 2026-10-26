"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronDown,
  ChevronsLeft, ChevronsRight, Lock,
} from "lucide-react";
import type { UserPayload } from "@/lib/auth";
import { Avatar } from "@/components/shared/Avatar";
import { useDashboardMenu, type MenuItem } from "./useDashboardMenu";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  GURU:  "Pengajar",
  SISWA: "Pelajar",
};

const SIDEBAR_ACCENT = "#3E03B3";

const TOGGLE_BTN_CLASS =
  "flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-primary dark:border-white/10 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-slate-600 dark:hover:text-white";

const GREETINGS = [
  "Semoga harimu menyenangkan!",
  "Tetap semangat belajar hari ini!",
  "Sukses selalu untuk aktivitasmu!",
  "Jangan lupa istirahat, ya!",
  "Konsisten itu kunci keberhasilan.",
  "Hari baru, semangat baru!",
  "Terus berkarya dan berkembang!",
];

const WEEKDAY_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function jakartaWeekday(): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "short" }).format(new Date());
  return WEEKDAY_NUM[short] ?? 0;
}

export function Sidebar({
  user, open, collapsed, onClose, onToggleCollapse,
}: {
  user: UserPayload;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { items, pendingResetCount } = useDashboardMenu(user);
  const PRIMARY  = SIDEBAR_ACCENT;
  const greeting = GREETINGS[jakartaWeekday() % GREETINGS.length];

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const item of items) {
      if (item.submenu?.some((sub) => pathname.startsWith(sub.href))) s.add(item.key);
    }
    return s;
  });

  const [flyout, setFlyout] = useState<{ key: string; top: number } | null>(null);
  useEffect(() => { setFlyout(null); }, [pathname]);

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function isItemActive(item: MenuItem): boolean {
    if (item.href) return pathname === item.href || pathname.startsWith(item.href + "/");
    return item.submenu?.some((s) => pathname.startsWith(s.href)) ?? false;
  }

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-white transition-all duration-300 ease-in-out",
        "shadow-[4px_0_24px_rgba(62,3,179,0.08)] dark:bg-[#1E293B] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)]",
        collapsed ? "w-18" : "w-64",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
      style={{ "--color-primary": PRIMARY } as React.CSSProperties}
    >

      <div
        className={[
          "flex h-16 shrink-0 items-center border-b border-slate-100 dark:border-white/6",
          collapsed ? "justify-center" : "justify-between px-5",
        ].join(" ")}
      >
        {collapsed ? (
          <Image src="/favicon.png" alt="LMS PPLG" title="LMS PPLG" width={36} height={36} className="h-9 w-9 shrink-0 rounded-2xl" />
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <Image src="/favicon.png" alt="LMS PPLG" width={36} height={36} className="h-9 w-9 shrink-0 rounded-2xl" />
              <span className="flex items-baseline gap-1">
                <span className="text-[17px] font-black tracking-tight text-[#3E03B3]">
                  LMS
                </span>
                <span className="text-[11px] font-bold tracking-[0.15em] text-slate-400 dark:text-slate-500">
                  PPLG
                </span>
              </span>
            </div>

            <button
              onClick={onClose}
              title="Tutup sidebar"
              className={`h-8 w-8 ${TOGGLE_BTN_CLASS} lg:hidden`}
            >
              <X size={16} />
            </button>

            <button
              onClick={onToggleCollapse}
              title="Sembunyikan sidebar"
              className={`hidden h-8 w-8 ${TOGGLE_BTN_CLASS} lg:flex`}
            >
              <ChevronsLeft size={18} />
            </button>
          </>
        )}
      </div>

      <div className="border-b border-slate-100 dark:border-white/6">
        {collapsed ? (
          <div className="flex justify-center py-3" title={user.nama}>
            <Avatar
              src={user.fotoProfil}
              nama={user.nama}
              sizePx={40}
              fallbackBg={SIDEBAR_ACCENT}
              textClassName="text-sm font-extrabold"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 pb-5 pt-6">
            <div
              className="mb-3 rounded-xl ring-4 ring-offset-2 dark:ring-offset-[#000000]"
              style={{ "--tw-ring-color": `${PRIMARY}40` } as React.CSSProperties}
            >
              <Avatar
                src={user.fotoProfil}
                nama={user.nama}
                sizePx={64}
                fallbackBg={SIDEBAR_ACCENT}
                textClassName="text-2xl font-extrabold"
              />
            </div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-white">
              Hello, {user.nama.split(" ")[0]}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-300">
              {ROLE_LABEL[user.role]} · SMK Ma&apos;arif
            </p>
            <p className="mt-2 rounded-lg bg-[#3E03B3]/[0.08] px-3 py-1 text-[10px] font-medium italic text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]">
              &ldquo;{greeting}&rdquo;
            </p>
          </div>
        )}
      </div>

      <nav className={["flex-1 overflow-y-auto", collapsed ? "px-2 py-1" : "px-3 py-1"].join(" ")}>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = isItemActive(item);
            const isExp  = expanded.has(item.key);

            if (collapsed) {
              return (
                <li key={item.key}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      title={item.label}
                      className="relative flex h-11 w-full items-center justify-center rounded-xl transition-all duration-200"
                    >
                      {active && (
                        <motion.div
                          layoutId="c-pill"
                          className="absolute inset-0 rounded-xl bg-slate-100"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]" />
                      )}
                      <span
                        className={[
                          "relative flex h-7 w-7 items-center justify-center rounded-lg",
                          active ? "bg-[#3E03B3]" : "",
                        ].join(" ")}
                      >
                        <item.icon size={16} style={{ color: active ? "#fff" : "#94a3b8" }} />
                        {item.key === "manajemen-password" && pendingResetCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-xl bg-[#3E03B3] ring-2 ring-white dark:ring-[#1E293B]" />
                        )}
                      </span>
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setFlyout((f) => (f?.key === item.key ? null : { key: item.key, top: r.top }));
                      }}
                      title={item.label}
                      className="relative flex h-11 w-full items-center justify-center rounded-xl transition-all duration-200"
                    >
                      {active && (
                        <motion.div
                          layoutId="c-pill"
                          className="absolute inset-0 rounded-xl bg-slate-100"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]" />
                      )}
                      <span
                        className={[
                          "relative flex h-7 w-7 items-center justify-center rounded-lg",
                          active ? "bg-[#3E03B3]" : "",
                        ].join(" ")}
                      >
                        <item.icon size={16} style={{ color: active ? "#fff" : "#94a3b8" }} />
                      </span>
                    </button>
                  )}
                </li>
              );
            }

            if (item.submenu) {
              const innerContent = (
                <>
                  {active && (
                    <motion.div
                      layoutId="e-pill"
                      className="absolute inset-0 rounded-xl bg-slate-100"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-600" />
                  )}
                  <span
                    className={[
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      active ? "bg-[#3E03B3]" : "",
                    ].join(" ")}
                  >
                    {!active && <span className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-white/[0.07]" />}
                    <item.icon size={16} className="relative" style={{ color: active ? "#fff" : "#64748b" }} />
                  </span>
                  <span
                    className={[
                      "relative flex-1 text-left text-[13px] font-semibold",
                      active ? "text-[#3E03B3] dark:text-white" : "text-slate-700 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                  {item.locked ? (
                    <Lock size={12} className="relative shrink-0 text-slate-300 dark:text-slate-600" />
                  ) : (
                    <ChevronDown
                      size={14}
                      className={[
                        "relative shrink-0 transition-transform duration-200",
                        isExp ? "rotate-180" : "",
                        active ? "text-[#3E03B3] dark:text-white" : "text-slate-400",
                      ].join(" ")}
                    />
                  )}
                </>
              );

              return (
                <li key={item.key}>
                  {item.locked && item.href ? (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200"
                    >
                      {innerContent}
                    </Link>
                  ) : (
                    <button
                      onClick={() => toggleExpand(item.key)}
                      className="relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200"
                    >
                      {innerContent}
                    </button>
                  )}

                  <AnimatePresence initial={false}>
                    {isExp && !item.locked && (
                      <motion.ul
                        key="sub"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[52px] mt-1 mb-1 space-y-0.5">
                          {item.submenu.map((sub) => {
                            const subActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                            return (
                              <li key={sub.href}>
                                <Link
                                  href={sub.href}
                                  onClick={onClose}
                                  className={[
                                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-all duration-150",
                                    subActive
                                      ? "bg-slate-100 font-semibold text-[#3E03B3] dark:text-white"
                                      : "font-normal text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                                      subActive ? "bg-slate-100" : "",
                                    ].join(" ")}
                                  >
                                    <sub.icon
                                      size={12}
                                      className={subActive ? "text-[#3E03B3] dark:text-white" : "text-slate-400"}
                                    />
                                  </span>
                                  <span>{sub.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </div>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            }

            return (
              <li key={item.key}>
                <Link
                  href={item.href!}
                  onClick={onClose}
                  className="relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200"
                >
                  {active && (
                    <motion.div
                      layoutId="e-pill"
                      className="absolute inset-0 rounded-xl bg-slate-100"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-600" />
                  )}

                  <span
                    className={[
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      active ? "bg-[#3E03B3]" : "",
                    ].join(" ")}
                  >
                    {!active && <span className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-white/[0.07]" />}
                    <item.icon size={16} className="relative" style={{ color: active ? "#fff" : "#64748b" }} />
                  </span>

                  <span
                    className={[
                      "relative flex-1 text-[13px] font-semibold",
                      active ? "text-[#3E03B3] dark:text-white" : "text-slate-700 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>

                  {item.key === "manajemen-password" && pendingResetCount > 0 && (
                    <span className="relative flex h-5 min-w-5 shrink-0 items-center justify-center rounded-xl bg-[#3E03B3] px-1.5 text-[10px] font-bold text-white">
                      {pendingResetCount > 99 ? "99+" : pendingResetCount}
                    </span>
                  )}

                  <ChevronRight
                    size={13}
                    className={active ? "relative shrink-0 text-[#3E03B3] dark:text-white" : "relative shrink-0 text-slate-300"}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="shrink-0 border-t border-slate-100 px-5 py-4 dark:border-white/6">
          <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-600">
            LMS PPLG — SMK Ma&apos;arif NU 01 Limpung
          </p>
          <p className="mt-0.5 text-[10px] text-slate-300 dark:text-slate-700">
            © 2024 All Rights Reserved
          </p>
        </div>
      )}
      {flyout && typeof document !== "undefined" && createPortal((() => {
        const it = items.find((x) => x.key === flyout.key);
        if (!it?.submenu) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setFlyout(null)} />
            <div className="fixed left-19.5 z-50 w-56 rounded-2xl bg-white p-2 shadow-2xl dark:bg-[#1E293B]" style={{ top: Math.max(8, flyout.top - 4) }}>
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{it.label}</p>
              {it.submenu.map((sub) => {
                const on = pathname.startsWith(sub.href);
                return (
                  <Link key={sub.href} href={sub.href} onClick={() => setFlyout(null)}
                    className={`block rounded-xl px-3 py-2 text-[13px] font-semibold ${on ? "bg-[#3E03B3] text-white" : "text-slate-700 hover:bg-[#F1EDFA] dark:text-slate-200 dark:hover:bg-slate-600"}`}>
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </>
        );
      })(), document.body)}
    </aside>
  );
}
