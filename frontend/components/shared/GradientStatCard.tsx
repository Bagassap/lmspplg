"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";

type Tone = "blue" | "navy" | "green" | "lime" | "red" | "ink";

// Desain simpel mengikuti kartu selector "Materi"/"Tugas" di
// components/materi/MateriTugasSiswaPage.tsx — ikon badge di atas, lalu
// blok 2 baris (nilai besar + label kecil) di bawah. Tidak ada eyebrow atau
// footer dua kolom seperti versi lama, sengaja dibuat ringkas.
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
  label, value, valuePrefix = "", valueSuffix = "",
  icon: Icon, tone,
}: {
  label: string;
  value: number | string;
  valuePrefix?: string;
  valueSuffix?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: Tone;
}) {
  const fg = tone === "lime" ? "#1C2B33" : "#FFFFFF";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      className="relative flex h-24 flex-col justify-between overflow-hidden rounded-xl px-3 py-3 sm:h-32 sm:rounded-2xl sm:px-5 sm:py-5"
      style={{ background: TONE_HEX[tone], color: fg, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full sm:-right-6 sm:-top-6 sm:h-28 sm:w-28" style={{ backgroundColor: `${fg}1a` }} />

      <div className="relative flex h-7 w-7 items-center justify-center rounded-xl sm:h-9 sm:w-9 sm:rounded-2xl" style={{ backgroundColor: `${fg}20` }}>
        <Icon size={14} className="sm:hidden" />
        <Icon size={16} className="hidden sm:block" />
      </div>

      <div className="relative min-w-0">
        <p className="truncate text-lg font-black leading-tight sm:text-2xl">{valuePrefix}{value}{valueSuffix}</p>
        <p className="mt-0.5 truncate text-[9px] font-medium sm:text-[11px]" style={{ color: `${fg}BF` }}>{label}</p>
      </div>
    </motion.div>
  );
}
