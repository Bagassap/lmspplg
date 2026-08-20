"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";

type Tone = "bright" | "deep" | "tint" | "ink" | "success" | "error";

// Palet utama = Meta color palette (#0082FB/#0064E0 biru, #1C2B33 tinta).
// bright/deep/tint/ink cuma gradasi biru-ke-tinta (sama dengan
// WALLET_GRADIENTS & DASHBOARD_GRADIENTS di components/absensi-harian/
// shared.ts) untuk kartu dekoratif/rotasi. success/error hanya dipakai
// kalau kartu ini benar-benar merepresentasikan status sukses/gagal.
const TONE_GRADIENT: Record<Tone, string> = {
  bright: "from-[#0082FB] to-[#0064E0]",
  deep: "from-[#0064E0] to-[#1C2B33]",
  tint: "from-[#4FB0FF] to-[#0082FB]",
  ink: "from-[#1C2B33] to-[#0064E0]",
  success: "from-[#00D67F] to-[#00A868]",
  error: "from-[#EF4444] to-[#C62828]",
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
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${TONE_GRADIENT[tone]} p-5 text-white shadow-sm transition-shadow hover:shadow-lg`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
      />
      <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <motion.span
        initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.1, rotate: 8 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
      >
        <Icon size={18} />
      </motion.span>
      <p className="relative mt-4 text-xs font-semibold text-white/85">{label}</p>
      <p className="relative mt-1 text-2xl font-extrabold">{value}</p>
      {caption && <p className="relative mt-1 text-[11px] text-white/70">{caption}</p>}
      {secondaryLabel && (
        <div className="relative mt-3 flex items-center gap-1.5 border-t border-white/15 pt-3 text-[11px] font-medium text-white/80">
          {SecondaryIcon && <SecondaryIcon size={12} className="shrink-0" />}
          {secondaryLabel}
        </div>
      )}
    </motion.div>
  );
}
