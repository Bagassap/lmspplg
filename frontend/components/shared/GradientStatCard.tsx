"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";

type Tone = "blue" | "navy" | "green" | "lime" | "red" | "ink";

// Sama persis dengan desain kartu "Akses Cepat" di dashboard (lihat CARDS di
// app/admin/dashboard/page.tsx) — kartu wallet h-44 dengan dekorasi lingkaran
// blur, badge ikon di kanan atas, angka besar di tengah, dan baris footer
// dua kolom. Hanya 5 warna utama palet (+ tinta netral #1C2B33) — solid,
// tidak ada gradient. Responsive mobile-first mengikuti pola QuickAccessCard.
const TONE_HEX: Record<Tone, string> = {
  blue: "#0082FB",   // biru terang
  navy: "#0064E0",   // blue
  green: "#00D67F",
  lime: "#C3F84A",   // utama
  red: "#EF4444",
  ink: "#1C2B33",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function GradientStatCard({
  eyebrow = "Statistik", label, value, valuePrefix = "", valueSuffix = "",
  icon: Icon, tone,
  footerLeftLabel, footerLeftValue, footerRightLabel, footerRightValue,
}: {
  eyebrow?: string;
  label: string;
  value: number | string;
  valuePrefix?: string;
  valueSuffix?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: Tone;
  footerLeftLabel?: string; footerLeftValue?: string;
  footerRightLabel?: string; footerRightValue?: string;
}) {
  const fg = tone === "lime" ? "#1C2B33" : "#FFFFFF";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="relative flex h-32 flex-col justify-between overflow-hidden rounded-xl p-3.5 sm:h-44 sm:rounded-2xl sm:p-5"
      style={{ background: TONE_HEX[tone], color: fg, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full sm:-right-6 sm:-top-6 sm:h-28 sm:w-28" style={{ backgroundColor: `${fg}1a` }} />
      <div className="pointer-events-none absolute -bottom-3 right-8 h-12 w-12 rounded-full sm:-bottom-4 sm:right-12 sm:h-20 sm:w-20" style={{ backgroundColor: `${fg}14` }} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-medium uppercase tracking-widest sm:text-[10px]" style={{ color: `${fg}B3` }}>{eyebrow}</p>
          <p className="mt-0.5 truncate text-xs font-bold sm:text-sm">{label}</p>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9" style={{ backgroundColor: `${fg}33` }}>
          <Icon size={14} className="sm:hidden" />
          <Icon size={17} className="hidden sm:block" />
        </div>
      </div>

      <div className="relative">
        <p className="truncate text-lg font-bold tabular-nums sm:text-3xl">{valuePrefix}{value}{valueSuffix}</p>
      </div>

      {(footerLeftLabel || footerRightLabel) && (
        <div className="relative flex items-end justify-between gap-2">
          <div className="min-w-0">
            {footerLeftLabel && (
              <>
                <p className="text-[7px] font-medium uppercase tracking-wider sm:text-[9px]" style={{ color: `${fg}99` }}>{footerLeftLabel}</p>
                <p className="truncate text-[9px] font-semibold sm:text-[11px]">{footerLeftValue}</p>
              </>
            )}
          </div>
          <div className="min-w-0 text-right">
            {footerRightLabel && (
              <>
                <p className="text-[7px] font-medium uppercase tracking-wider sm:text-[9px]" style={{ color: `${fg}99` }}>{footerRightLabel}</p>
                <p className="truncate text-[9px] font-semibold sm:text-[11px]">{footerRightValue}</p>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
