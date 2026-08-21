"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";

type Tone = "blue" | "navy" | "green" | "lime" | "red" | "ink";

// Hanya 5 warna utama palet (+ tinta netral #1C2B33) — tidak ada gradient,
// tiap tone adalah warna solid tunggal. Saat dipakai berjejer (>1 kartu),
// rotasi standar dipakai: navy ("blue"), lime (utama), red, blue ("biru
// terang") — lihat pemakaian di admin/magang/penempatan/page.tsx.
const TONE_BG: Record<Tone, string> = {
  blue: "bg-[#0082FB]",  // biru terang
  navy: "bg-[#0064E0]",  // blue
  green: "bg-[#00D67F]",
  lime: "bg-[#C3F84A]",  // utama
  red: "bg-[#EF4444]",
  ink: "bg-[#1C2B33]",
};
// Teks lime terlalu terang untuk putih — kartu lime pakai teks tinta.
const TONE_TEXT: Record<Tone, string> = {
  blue: "text-white", navy: "text-white", green: "text-white",
  lime: "text-[#1C2B33]", red: "text-white", ink: "text-white",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function GradientStatCard({
  label, value, caption, icon: Icon, tone, secondaryLabel, secondaryIcon: SecondaryIcon,
}: {
  label: string;
  value: number | string;
  caption?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: Tone;
  secondaryLabel?: string;
  secondaryIcon?: ComponentType<{ size?: number; className?: string }>;
}) {
  const badgeBg = tone === "lime" ? "bg-[#1C2B33]/15" : "bg-white/20";
  const borderTone = tone === "lime" ? "border-[#1C2B33]/15" : "border-white/15";
  const captionTone = tone === "lime" ? "text-[#1C2B33]/70" : "text-white/70";
  const secondaryTone = tone === "lime" ? "text-[#1C2B33]/80" : "text-white/80";
  const labelTone = tone === "lime" ? "text-[#1C2B33]/85" : "text-white/85";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-3xl ${TONE_BG[tone]} p-5 ${TONE_TEXT[tone]} shadow-sm transition-shadow hover:shadow-lg`}
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.1, rotate: 8 }}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full ${badgeBg} backdrop-blur-sm`}
      >
        <Icon size={18} />
      </motion.span>
      <p className={`relative mt-4 text-xs font-semibold ${labelTone}`}>{label}</p>
      <p className="relative mt-1 text-2xl font-extrabold">{value}</p>
      {caption && <p className={`relative mt-1 text-[11px] ${captionTone}`}>{caption}</p>}
      {secondaryLabel && (
        <div className={`relative mt-3 flex items-center gap-1.5 border-t ${borderTone} pt-3 text-[11px] font-medium ${secondaryTone}`}>
          {SecondaryIcon && <SecondaryIcon size={12} className="shrink-0" />}
          {secondaryLabel}
        </div>
      )}
    </motion.div>
  );
}
