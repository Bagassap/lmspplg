"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, Lock, Sparkles } from "lucide-react";

type FeatureType = "magang" | "ujian-ukk";

const BRAND_GRADIENT = "#0082FB";

const CONFIG: Record<FeatureType, {
  title: string;
  footerHint: (isGuru: boolean) => string;
}> = {
  magang: {
    title: "PKL",
    footerHint: (isGuru) => `Pantau pengumuman dari ${isGuru ? "koordinator PKL" : "pembimbing PKL"} Anda`,
  },
  "ujian-ukk": {
    title: "UKK",
    footerHint: () => "Pantau pengumuman dari panitia UKK",
  },
};

interface Props { role?: "guru" | "siswa"; type?: FeatureType; }

export default function LockedFeature({ role = "siswa", type = "magang" }: Props) {
  const router = useRouter();
  const isGuru = role === "guru";
  const cfg = CONFIG[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden" style={{ background: BRAND_GRADIENT }}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/6" />
      <div className="pointer-events-none absolute top-10 left-[55%] h-20 w-20 rounded-full bg-white/5" />

      <button
        type="button"
        onClick={() => router.push(`/${role}/dashboard`)}
        className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm active:bg-white/25 sm:left-6 sm:top-6"
      >
        <ChevronLeft size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-5 px-7 text-center"
      >
        <div className="relative flex h-20 w-20 items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-white/20"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm"
          >
            <Clock size={24} className="text-white" strokeWidth={1.8} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1 backdrop-blur-sm"
        >
          <Lock size={10} className="text-white/90" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">Belum Aktif</span>
        </motion.div>

        <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          Program {cfg.title}
        </h1>

        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <Sparkles size={12} className="text-white/70" />
          <span className="text-xs text-white/70">{cfg.footerHint(isGuru)}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
