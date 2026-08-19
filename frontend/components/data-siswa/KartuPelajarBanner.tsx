"use client";

import { CreditCard, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const KARTU_PELAJAR_URL = "https://e-kartu.smklimpung.id";

// Sengaja dibuat sebagai strip promo yang ramping dan ringan (bukan blok
// hero besar seperti DataSiswaHeader) — bila keduanya memakai bentuk yang
// sama (rounded besar, background solid penuh, dekorasi lingkaran blur),
// banner ini akan terkesan menyaingi header alih-alih jadi elemen sekunder.
export function KartuPelajarBanner() {
  return (
    <motion.a
      href={KARTU_PELAJAR_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm transition-colors hover:bg-amber-100/70 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm animate-pulse [animation-duration:2.5s]"
          style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)" }}>
          <CreditCard size={20} />
        </div>
        <div>
          <div className="mb-0.5 flex items-center gap-2">
            <p className="text-sm font-extrabold text-amber-900 dark:text-amber-300">Kartu Pelajar Digital</p>
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">Baru</span>
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/70">Cek &amp; cetak kartu pelajar siswa lewat portal e-Kartu</p>
        </div>
      </div>

      <span className="flex shrink-0 items-center gap-1.5 self-start rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform group-hover:translate-x-0.5 sm:self-auto"
        style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)" }}>
        Buka e-Kartu
        <ArrowUpRight size={14} />
      </span>
    </motion.a>
  );
}
