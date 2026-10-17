"use client";

import { CreditCard, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export const KARTU_PELAJAR_URL = "https://e-kartu.smklimpung.id";

export function KartuPelajarBanner({
  description = "Cek & cetak kartu pelajar siswa lewat portal e-Kartu",
  compact = false,
}: {
  description?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <motion.a
        href={KARTU_PELAJAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.995 }}
        className="group flex items-center justify-between gap-3 rounded-2xl bg-[#3E03B3] p-3.5 transition-colors hover:bg-[#2D0281]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#3E03B3]">
            <CreditCard size={16} />
          </div>
          <p className="truncate text-sm font-extrabold text-white">Kartu Pelajar</p>
        </div>
        <span
          title="Buka e-Kartu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#3E03B3] transition-transform group-hover:translate-x-0.5"
        >
          <ArrowUpRight size={14} />
        </span>
      </motion.a>
    );
  }

  return (
    <motion.a
      href={KARTU_PELAJAR_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      className="group flex flex-col items-start gap-3 rounded-2xl bg-[#3E03B3] p-4 transition-colors hover:bg-[#2D0281] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#3E03B3] animate-pulse [animation-duration:2.5s]">
          <CreditCard size={20} />
        </div>
        <div>
          <div className="mb-0.5 flex items-center gap-2">
            <p className="text-sm font-extrabold text-white">Kartu Pelajar Digital</p>
            <span className="rounded-lg bg-white px-2 py-0.5 text-[9px] font-bold text-[#3E03B3]">Baru</span>
          </div>
          <p className="text-xs text-[#F1EDFA]">{description}</p>
        </div>
      </div>

      <span className="flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#3E03B3] transition-transform group-hover:translate-x-0.5 sm:self-auto">
        Buka e-Kartu
        <ArrowUpRight size={14} />
      </span>
    </motion.a>
  );
}
