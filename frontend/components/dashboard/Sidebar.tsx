"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, LayoutDashboard, Bell, Users, Briefcase,
  FileText, UserCircle, ChevronRight, ChevronDown,
  ChevronsLeft, ChevronsRight, Lock, KeyRound, Inbox,
  Building2, ClipboardCheck, Activity, FileBarChart,
  CalendarDays, Trophy,
} from "lucide-react";
import type { UserPayload } from "@/lib/auth";
import { SUPER_ADMIN_LOGIN_ID } from "@/lib/constants";

type SubItem  = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> };
type MenuItem = {
  key: string;
  href?: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  submenu?: SubItem[];
  locked?: boolean;
};

const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
    { key: "dashboard",    href: "/admin/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
    { key: "absensi-harian", href: "/admin/absensi-harian", label: "Absensi Harian", icon: ClipboardCheck },
    { key: "pengumuman",   href: "/admin/pengumuman",   label: "Pengumuman",  icon: Bell },
    { key: "data-siswa",   href: "/admin/data-siswa",   label: "Data Siswa",  icon: Users },
    { key: "manajemen-password", href: "/admin/manajemen-password", label: "Manajemen Password", icon: KeyRound },
    { key: "permintaan-password", href: "/admin/permintaan-password", label: "Permintaan Password", icon: Inbox },
    {
      key: "magang", label: "Magang", icon: Briefcase,
      submenu: [
        { href: "/admin/magang/penempatan", label: "Penempatan",    icon: Building2 },
        { href: "/admin/magang/absensi",    label: "Absensi",       icon: ClipboardCheck },
        { href: "/admin/magang/monitoring", label: "Monitoring",    icon: Activity },
        { href: "/admin/magang/rekap",      label: "Rekap & Laporan", icon: FileBarChart },
      ],
    },
    {
      key: "ujian-ukk", label: "Ujian UKK", icon: FileText,
      submenu: [
        { href: "/admin/ujian-ukk/jadwal-soal", label: "Jadwal & Soal", icon: CalendarDays },
        { href: "/admin/ujian-ukk/absensi",     label: "Absensi",       icon: ClipboardCheck },
      ],
    },
  ],
  GURU: [
    { key: "dashboard",    href: "/guru/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
    { key: "absensi-harian", href: "/guru/absensi-harian", label: "Absensi Harian", icon: ClipboardCheck },
    { key: "pengumuman",   href: "/guru/pengumuman",   label: "Pengumuman",  icon: Bell },
    { key: "data-siswa",   href: "/guru/data-siswa",   label: "Data Siswa",  icon: Users },
    {
      key: "magang", href: "/guru/magang", label: "Magang", icon: Briefcase, locked: true,
      submenu: [
        { href: "/guru/magang/penempatan", label: "Penempatan",     icon: Building2 },
        { href: "/guru/magang/absensi",    label: "Absensi",        icon: ClipboardCheck },
        { href: "/guru/magang/monitoring", label: "Monitoring",     icon: Activity },
        { href: "/guru/magang/rekap",      label: "Rekap & Laporan",icon: FileBarChart },
      ],
    },
    {
      key: "ujian-ukk", label: "Ujian UKK", icon: FileText,
      submenu: [
        { href: "/guru/ujian-ukk/jadwal-soal", label: "Jadwal & Soal", icon: CalendarDays },
        { href: "/guru/ujian-ukk/absensi",     label: "Absensi",       icon: ClipboardCheck },
      ],
    },
  ],
  SISWA: [
    { key: "dashboard",    href: "/siswa/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
    { key: "absensi-harian", href: "/siswa/absensi-harian", label: "Absensi Harian", icon: ClipboardCheck },
    { key: "pengumuman",   href: "/siswa/pengumuman",   label: "Pengumuman",  icon: Bell },
    { key: "profil",       href: "/siswa/profil",       label: "Profil Saya", icon: UserCircle },
    {
      key: "magang", href: "/siswa/magang", label: "Magang", icon: Briefcase, locked: true,
      submenu: [
        { href: "/siswa/magang/penempatan", label: "Penempatan", icon: Building2 },
        { href: "/siswa/magang/absensi",    label: "Absensi",    icon: ClipboardCheck },
        { href: "/siswa/magang/rekap",      label: "Rekap",      icon: FileBarChart },
      ],
    },
    {
      key: "ujian-ukk", href: "/siswa/ujian-ukk", label: "Ujian UKK", icon: FileText, locked: true,
      submenu: [
        { href: "/siswa/ujian-ukk/jadwal-soal", label: "Jadwal & Soal", icon: CalendarDays },
        { href: "/siswa/ujian-ukk/absensi",     label: "Absensi",       icon: ClipboardCheck },
        { href: "/siswa/ujian-ukk/nilai-saya",  label: "Nilai Saya",    icon: Trophy },
      ],
    },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  GURU:  "Pengajar",
  SISWA: "Pelajar",
};

const SIDEBAR_GRADIENT = "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)";
const SIDEBAR_ACCENT = "#0033FF";

const TOGGLE_BTN_CLASS =
  "flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/15 dark:hover:text-white";

const GREETINGS = [
  "Semoga harimu menyenangkan!",
  "Tetap semangat belajar hari ini!",
  "Sukses selalu untuk aktivitasmu!",
  "Jangan lupa istirahat, ya!",
  "Konsisten itu kunci keberhasilan.",
  "Hari baru, semangat baru!",
  "Terus berkarya dan berkembang!",
];

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
  const isSuperAdmin = user.loginId === SUPER_ADMIN_LOGIN_ID;
  const items = (MENUS[user.role] ?? []).filter(
    (item) => (item.key !== "manajemen-password" && item.key !== "permintaan-password") || isSuperAdmin,
  );
  const initial  = user.nama.charAt(0).toUpperCase();

  const [pendingResetCount, setPendingResetCount] = useState(0);
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    fetch("/api/users/password-reset-requests", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { status: string }[]) => {
        if (!cancelled && Array.isArray(list)) {
          setPendingResetCount(list.filter((r) => r.status === "PENDING").length);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSuperAdmin]);
  const PRIMARY  = SIDEBAR_ACCENT;
  const greeting = GREETINGS[new Date().getDay() % GREETINGS.length];

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const item of items) {
      if (item.submenu?.some((sub) => pathname.startsWith(sub.href))) s.add(item.key);
    }
    return s;
  });

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
        "shadow-[4px_0_24px_rgba(79,142,247,0.08)] dark:bg-[#1c2434] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)]",
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
          <button
            onClick={onToggleCollapse}
            title="Buka sidebar"
            className={`h-9 w-9 ${TOGGLE_BTN_CLASS}`}
          >
            <ChevronsRight size={18} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-md shadow-blue-900/25 ring-1 ring-white/40 dark:shadow-black/40 dark:ring-white/10"
                style={{ background: SIDEBAR_GRADIENT }}
              >
                <Image src="/PPLG.png" alt="PPLG" width={18} height={22} className="h-4.5 w-auto" />
              </div>
              <span className="flex items-baseline gap-1">
                <span className="bg-gradient-to-br from-[#8b6bff] via-[#4f6bff] to-[#0033ff] bg-clip-text text-[17px] font-black tracking-tight text-transparent dark:from-[#b3a1ff] dark:via-[#7aa2fb] dark:to-[#60a5fa]">
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
          <div className="flex justify-center py-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white"
              style={{ background: SIDEBAR_GRADIENT }}
              title={user.nama}
            >
              {initial}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 pb-5 pt-6">
            <div
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold text-white ring-4 ring-offset-2 dark:ring-offset-[#1c2434]"
              style={{
                background: SIDEBAR_GRADIENT,
                "--tw-ring-color": `${PRIMARY}40`,
              } as React.CSSProperties}
            >
              {initial}
            </div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-white">
              Hello, {user.nama.split(" ")[0]}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-300">
              {ROLE_LABEL[user.role]} · SMK Ma&apos;arif
            </p>
            <p className="mt-2 rounded-full bg-[#0033FF]/[0.08] px-3 py-1 text-[10px] font-medium italic text-[#0033FF] dark:bg-white/10 dark:text-indigo-200">
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
                          className="absolute inset-0 rounded-xl bg-primary/10"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]" />
                      )}
                      <span
                        className={[
                          "relative flex h-7 w-7 items-center justify-center rounded-lg",
                          active ? "bg-[#0033FF]" : "",
                        ].join(" ")}
                      >
                        <item.icon size={16} style={{ color: active ? "#fff" : "#94a3b8" }} />
                        {item.key === "permintaan-password" && pendingResetCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1c2434]" />
                        )}
                      </span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => toggleExpand(item.key)}
                      title={item.label}
                      className="relative flex h-11 w-full items-center justify-center rounded-xl transition-all duration-200"
                    >
                      {active && (
                        <motion.div
                          layoutId="c-pill"
                          className="absolute inset-0 rounded-xl bg-primary/10"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]" />
                      )}
                      <span
                        className={[
                          "relative flex h-7 w-7 items-center justify-center rounded-lg",
                          active ? "bg-[#0033FF]" : "",
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
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5" />
                  )}
                  <span
                    className={[
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      active ? "bg-[#0033FF]" : "",
                    ].join(" ")}
                  >
                    {!active && <span className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-white/[0.07]" />}
                    <item.icon size={16} className="relative" style={{ color: active ? "#fff" : "#64748b" }} />
                  </span>
                  <span
                    className={[
                      "relative flex-1 text-left text-[13px] font-semibold",
                      active ? "text-[#0033FF] dark:text-white" : "text-slate-700 dark:text-slate-300",
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
                        active ? "text-[#0033FF] dark:text-white" : "text-slate-400",
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
                                      ? "bg-primary/10 font-semibold text-[#0033FF] dark:text-white"
                                      : "font-normal text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
                                      subActive ? "bg-[#0033FF]/20" : "",
                                    ].join(" ")}
                                  >
                                    <sub.icon
                                      size={12}
                                      className={subActive ? "text-[#0033FF] dark:text-white" : "text-slate-400"}
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
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5" />
                  )}

                  <span
                    className={[
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      active ? "bg-[#0033FF]" : "",
                    ].join(" ")}
                  >
                    {!active && <span className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-white/[0.07]" />}
                    <item.icon size={16} className="relative" style={{ color: active ? "#fff" : "#64748b" }} />
                  </span>

                  <span
                    className={[
                      "relative flex-1 text-[13px] font-semibold",
                      active ? "text-[#0033FF] dark:text-white" : "text-slate-700 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>

                  {item.key === "permintaan-password" && pendingResetCount > 0 && (
                    <span className="relative flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {pendingResetCount > 99 ? "99+" : pendingResetCount}
                    </span>
                  )}

                  <ChevronRight
                    size={13}
                    className={active ? "relative shrink-0 text-[#0033FF] dark:text-white" : "relative shrink-0 text-slate-300"}
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
    </aside>
  );
}
