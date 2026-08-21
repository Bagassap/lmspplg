"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileBarChart, FileUp, BarChart3, ChevronRight } from "lucide-react";

const CARDS = [
  {
    href: "/siswa/magang/rekap/lapor-diri",
    label: "Lapor Diri",
    desc: "Unggah laporan presentasi PKL-mu (PDF/PPT) setiap bulan",
    color: "#0082FB",
    icon: FileUp,
  },
  {
    href: "/siswa/magang/rekap/laporan",
    label: "Laporan",
    desc: "Rekap kehadiran PKL-mu dan unduh laporannya sendiri",
    color: "#8A9E1F",
    icon: BarChart3,
  },
] as const;

export default function SiswaMagangRekapHubPage() {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <FileBarChart size={26} className="text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">PKL</span>
            <h1 className="text-2xl font-extrabold leading-tight text-white">Rekap PKL</h1>
            <p className="mt-0.5 text-sm text-white/70">Pilih menu di bawah untuk melanjutkan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((c, i) => (
          <motion.div key={c.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={c.href}
              className="group flex h-full items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${c.color}18` }}>
                <c.icon size={24} style={{ color: c.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-slate-800 dark:text-white">{c.label}</h2>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{c.desc}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-[#0082FB] dark:text-slate-600" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
