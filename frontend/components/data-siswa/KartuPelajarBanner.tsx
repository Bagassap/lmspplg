"use client";

import { CreditCard, Sparkles, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const KARTU_PELAJAR_URL = "https://e-kartu.smklimpung.id";

// Banner khusus (bukan tombol kecil di header) — sengaja dibuat mencolok
// dengan gradient emas/oranye yang belum dipakai fitur lain, supaya langsung
// menarik perhatian admin/guru untuk membuka portal e-Kartu.
export function KartuPelajarBanner() {
  return (
    <motion.a
      href={KARTU_PELAJAR_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl p-6 text-left shadow-lg transition-shadow hover:shadow-xl sm:flex-row sm:items-center sm:justify-between"
      style={{ background: "linear-gradient(115deg,#F59E0B 0%,#EA580C 55%,#DC2626 100%)" }}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-24 top-4 hidden text-white/20 sm:block">
        <Sparkles size={22} />
      </div>

      <div className="relative flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm animate-pulse [animation-duration:2.5s]">
          <CreditCard size={26} className="text-white" />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Portal Eksternal</span>
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold text-white">Baru</span>
          </div>
          <p className="text-lg font-extrabold leading-tight text-white sm:text-xl">Kartu Pelajar Digital</p>
          <p className="mt-0.5 text-xs text-white/85 sm:text-sm">Cek, cetak, dan kelola kartu pelajar siswa lewat portal e-Kartu</p>
        </div>
      </div>

      <span className="relative flex shrink-0 items-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold shadow-md transition-transform group-hover:translate-x-0.5 sm:self-auto"
        style={{ color: "#EA580C" }}>
        Buka e-Kartu
        <ArrowUpRight size={16} />
      </span>
    </motion.a>
  );
}
