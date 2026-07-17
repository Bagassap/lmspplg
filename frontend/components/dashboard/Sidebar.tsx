"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, LayoutDashboard, Bell, Users, Briefcase,
  FileText, UserCircle, ChevronRight, ChevronDown,
  ChevronsLeft, ChevronsRight, Lock, KeyRound,
  Building2, ClipboardCheck, Activity, FileBarChart,
  CalendarDays, Trophy,
} from "lucide-react";
import type { UserPayload } from "@/lib/auth";

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
  const items    = MENUS[user.role] ?? [];
  const initial  = user.nama.charAt(0).toUpperCase();
  const PRIMARY  = SIDEBAR_ACCENT;
  const PRIMARY_ICON_BG = PRIMARY;
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
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-primary/10 hover:text-primary dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ChevronsRight size={18} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: SIDEBAR_GRADIENT }}
              >
                <Image src="/PPLG.png" alt="PPLG" width={18} height={22} className="h-4.5 w-auto" />
              </div>
              <span className="text-[14px] font-extrabold text-slate-800 dark:text-white">
                LMS PPLG
              </span>
            </div>

            <button
              onClick={onClose}
              title="Tutup sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
            >
              <X size={16} />
            </button>

            <button
              onClick={onToggleCollapse}
              title="Sembunyikan sidebar"
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white lg:flex"
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
          <div className="flex flex-col items-center px-5 pb-5 pt-1">
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
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              {ROLE_LABEL[user.role]} · SMK Ma&apos;arif
            </p>
            <p className="mt-2 rounded-full px-3 py-1 text-[10px] font-medium italic"
              style={{ backgroundColor: `${PRIMARY}14`, color: PRIMARY }}>
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
                          className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]" />
                      )}
                      <span
                        className="relative flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ backgroundColor: active ? PRIMARY_ICON_BG : "transparent" }}
                      >
                        <item.icon size={16} style={{ color: active ? "#fff" : "#94a3b8" }} />
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
                          className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06]" />
                      )}
                      <span
                        className="relative flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ backgroundColor: active ? PRIMARY_ICON_BG : "transparent" }}
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
                      className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5" />
                  )}
                  <span
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: active ? PRIMARY_ICON_BG : undefined }}
                  >
                    {!active && <span className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-white/[0.07]" />}
                    <item.icon size={16} className="relative" style={{ color: active ? "#fff" : "#64748b" }} />
                  </span>
                  <span
                    className="relative flex-1 text-left text-[13px] font-semibold"
                    style={{ color: active ? PRIMARY : undefined }}
                  >
                    <span className={active ? "" : "text-slate-700 dark:text-slate-300"}>{item.label}</span>
                  </span>
                  {item.locked ? (
                    <Lock size={12} className="relative shrink-0 text-slate-300 dark:text-slate-600" />
                  ) : (
                    <ChevronDown
                      size={14}
                      className={["relative shrink-0 transition-transform duration-200", isExp ? "rotate-180" : ""].join(" ")}
                      style={{ color: active ? PRIMARY : "#94a3b8" }}
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
                                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-all duration-150"
                                  style={{
                                    color:           subActive ? PRIMARY : undefined,
                                    fontWeight:      subActive ? 600 : 400,
                                    backgroundColor: subActive ? `${PRIMARY}12` : undefined,
                                  }}
                                >
                                  <span
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                                    style={{ backgroundColor: subActive ? `${PRIMARY}20` : "transparent" }}
                                  >
                                    <sub.icon
                                      size={12}
                                      style={{ color: subActive ? PRIMARY : "#94a3b8" }}
                                    />
                                  </span>
                                  <span className={subActive ? "" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}>
                                    {sub.label}
                                  </span>
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
                      className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5" />
                  )}

                  <span
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: active ? PRIMARY_ICON_BG : undefined }}
                  >
                    {!active && <span className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-white/[0.07]" />}
                    <item.icon size={16} className="relative" style={{ color: active ? "#fff" : "#64748b" }} />
                  </span>

                  <span
                    className="relative flex-1 text-[13px] font-semibold"
                    style={{ color: active ? PRIMARY : undefined }}
                  >
                    <span className={active ? "" : "text-slate-700 dark:text-slate-300"}>{item.label}</span>
                  </span>

                  <ChevronRight
                    size={13}
                    className="relative shrink-0"
                    style={{ color: active ? PRIMARY : "#cbd5e1" }}
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
