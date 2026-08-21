"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileBarChart, FileUp, BarChart3, ArrowRight } from "lucide-react";

const CARDS = [
  {
    href: "/admin/magang/rekap/lapor-diri",
    label: "Lapor Diri",
    desc: "Pantau laporan bulanan (PDF/PPT) yang wajib dikirim siswa PKL setiap bulan",
    gradient: "#0064E0",
    icon: FileUp,
  },
  {
    href: "/admin/magang/rekap/laporan",
    label: "Laporan",
    desc: "Rekap kehadiran per tempat PKL dan unduh laporannya ke PDF/Excel",
    gradient: "#C3F84A",
    icon: BarChart3,
  },
] as const;

export default function AdminMagangRekapHubPage() {
  return (
    <div className="space-y-5 p-1">
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <FileBarChart size={22} className="text-white sm:hidden" />
            <FileBarChart size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">PKL</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Admin</span>
            </div>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Rekap &amp; Laporan PKL</h1>
            <p className="mt-0.5 text-sm text-white/70">Pilih menu di bawah untuk melanjutkan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((c, i) => {
          const onDark = c.gradient !== "#C3F84A";
          const fg = onDark ? "#FFFFFF" : "#1C2B33";
          return (
            <motion.div key={c.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={c.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl p-6 shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ background: c.gradient, color: fg }}>
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full" style={{ background: `${fg}1a` }} />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${fg}26` }}>
                  <c.icon size={22} />
                </div>
                <h2 className="relative mt-5 text-lg font-extrabold">{c.label}</h2>
                <p className="relative mt-1.5 text-sm" style={{ color: `${fg}CC` }}>{c.desc}</p>
                <span className="relative mt-5 flex items-center gap-1.5 text-sm font-bold">
                  Buka <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
