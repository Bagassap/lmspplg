"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type QuickAccessCardData = {
  href: string;
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  validThru: string;
  holder: string;
  footerLeftLabel?: string;
  footerRightLabel?: string;
  gradient: string;
  icon: LucideIcon;
  small?: boolean;
};

// Grid 2×2 sejak mobile (bukan 1 kolom dulu baru 2 di sm:) — kartu kecil
// persegi panjang yang membesar di layar lebih lega, bukan tinggi tetap
// (h-44) yang bikin timpang di HP sempit. Dipakai bareng oleh dashboard
// admin/guru/siswa supaya perbaikan responsive cukup di satu tempat.
export function QuickAccessGrid({ cards }: { cards: QuickAccessCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((card, i) => (
        <QuickAccessCard key={`${card.href}-${card.label}`} card={card} index={i} />
      ))}
    </div>
  );
}

function QuickAccessCard({ card, index }: { card: QuickAccessCardData; index: number }) {
  const onDark = card.gradient !== "#C3F84A"; // lime butuh teks gelap, sisanya teks putih
  const fg = onDark ? "#FFFFFF" : "#1C2B33";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.35, delay: 0.4 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={card.href}
        className="relative flex h-32 flex-col justify-between overflow-hidden rounded-xl p-3.5 sm:h-44 sm:rounded-2xl sm:p-5"
        style={{ background: card.gradient, color: fg, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
      >
        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full sm:-right-6 sm:-top-6 sm:h-28 sm:w-28" style={{ backgroundColor: `${fg}1a` }} />
        <div className="pointer-events-none absolute -bottom-3 right-8 h-12 w-12 rounded-full sm:-bottom-4 sm:right-12 sm:h-20 sm:w-20" style={{ backgroundColor: `${fg}14` }} />

        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-medium uppercase tracking-widest sm:text-[10px]" style={{ color: `${fg}B3` }}>Akses Cepat</p>
            <p className="mt-0.5 truncate text-xs font-bold sm:text-sm">{card.label}</p>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9" style={{ backgroundColor: `${fg}33` }}>
            <card.icon size={14} className="sm:hidden" />
            <card.icon size={17} className="hidden sm:block" />
          </div>
        </div>

        <div className="relative">
          <p className={`truncate font-bold tabular-nums ${card.small ? "text-sm sm:text-xl" : "text-lg sm:text-3xl"}`}>
            {card.prefix}{card.value}{card.suffix}
          </p>
        </div>

        <div className="relative flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[7px] font-medium uppercase tracking-wider sm:text-[9px]" style={{ color: `${fg}99` }}>{card.footerLeftLabel ?? "TA"}</p>
            <p className="truncate text-[9px] font-semibold sm:text-[11px]">{card.validThru}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[7px] font-medium uppercase tracking-wider sm:text-[9px]" style={{ color: `${fg}99` }}>{card.footerRightLabel ?? "Pengelola"}</p>
            <p className="truncate text-[9px] font-semibold sm:text-[11px]">{card.holder}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
