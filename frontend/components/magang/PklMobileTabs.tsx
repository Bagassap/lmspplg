"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Building2, ClipboardCheck, ClipboardList } from "lucide-react";

type Role = "admin" | "guru" | "siswa";

const WARNA = ["#3E03B3"];

export function PklMobileTabs({ role }: { role: Role }) {
  const pathname = usePathname();
  const base = `/${role}/magang`;
  if (pathname === base) return null;

  const tabs = [
    ...(role === "admin" ? [{ href: `${base}/pendaftaran`, label: "Daftar", icon: ClipboardList }] : []),
    { href: `${base}/penempatan`, label: "Penempatan", icon: Building2 },
    { href: `${base}/absensi`, label: "Absensi", icon: ClipboardCheck },
    { href: `${base}/rekap`, label: "Rekap", icon: BarChart3 },
  ];

  return (
    <div className="-mx-4 -mt-4 mb-4 px-4 pb-1 pt-3 lg:hidden">
      <div className="isolate flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-slate-800">
        {tabs.map((t, i) => {
          const aktif = pathname.startsWith(t.href);
          const warna = WARNA[i % WARNA.length];
          return (
            <Link key={t.href} href={t.href} replace
              className="relative flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-bold transition-colors"
              style={{ color: aktif ? "#fff" : "#94a3b8" }}>
              {aktif && (
                <motion.span layoutId={`pkl-tab-${role}`} className="absolute inset-0 rounded-xl"
                  style={{ background: warna }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
              <span className="relative z-10 flex min-w-0 items-center gap-1"><t.icon size={14} className="shrink-0" /><span className="truncate">{t.label}</span></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
