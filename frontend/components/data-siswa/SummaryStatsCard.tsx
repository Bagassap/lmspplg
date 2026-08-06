"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Users, Sparkles, School, ShieldCheck } from "lucide-react";
import type { SiswaCardData } from "./shared";
import { completeness } from "./shared";

const HEALTH_TIER_META: Record<"success" | "warning" | "danger", {
  color: string; bg: string; text: string; label: string; icon: typeof CheckCircle2;
}> = {
  success: { color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", label: "Keamanan Akun Baik", icon: CheckCircle2 },
  warning: { color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", label: "Perlu Diingatkan", icon: AlertTriangle },
  danger: { color: "#f87171", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", label: "Banyak Belum Ganti Password", icon: XCircle },
};

const TILE_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function SummaryStatsCard({ siswas, kelasCount }: { siswas: SiswaCardData[]; kelasCount: number }) {
  const withAccount = siswas.filter((s) => s.user);
  const amanCount = withAccount.filter((s) => s.user!.mustChangePassword === false).length;
  const amanTotal = withAccount.length;
  const amanPercent = amanTotal > 0 ? Math.round((amanCount / amanTotal) * 100) : 0;
  const tier: "success" | "warning" | "danger" = amanPercent >= 70 ? "success" : amanPercent >= 40 ? "warning" : "danger";
  const meta = HEALTH_TIER_META[tier];

  const avgCompleteness =
    siswas.length > 0 ? Math.round(siswas.reduce((sum, s) => sum + completeness(s), 0) / siswas.length) : 0;

  const tiles = [
    { label: "Siswa Ditampilkan", caption: "Sesuai filter aktif", icon: Users, gradient: "linear-gradient(135deg,#0033FF,#335CFF)", value: siswas.length },
    { label: "Rata-rata Kelengkapan", caption: "Data profil siswa", icon: Sparkles, gradient: "linear-gradient(135deg,#10B981,#34D399)", value: `${avgCompleteness}%` },
    { label: "Jumlah Kelas", caption: "Kelas pada tampilan ini", icon: School, gradient: "linear-gradient(135deg,#F59E0B,#FCD34D)", value: kelasCount },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(circle, #0033FF 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />
      <motion.div
        aria-hidden
        animate={{ backgroundColor: `${meta.color}22` }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl"
      />

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <motion.div
              aria-hidden
              animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.15, 1], backgroundColor: `${meta.color}33` }}
              transition={{ opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }, backgroundColor: { duration: 0.6 } }}
              className="absolute inset-0 rounded-full blur-md"
            />
            <svg width={64} height={64} className="relative -rotate-90">
              <circle cx={32} cy={32} r={27} stroke="#e2e8f0" strokeWidth={6} fill="none" />
              <motion.circle
                cx={32} cy={32} r={27} strokeWidth={6} fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 27}
                initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 27 * (1 - amanPercent / 100), stroke: meta.color }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-white">
              {amanPercent}%
            </span>
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck size={12} />
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Keamanan Password
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-white">{amanCount}</span> dari {amanTotal} siswa sudah ganti password dari NIS default
            </p>
            <motion.span
              key={tier}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.text}`}
            >
              <meta.icon size={11} />
              {meta.label}
            </motion.span>
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
          className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/50 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
        >
          {tiles.map((tile) => (
            <motion.div
              key={tile.label}
              variants={TILE_VARIANTS}
              whileHover={{ y: -3 }}
              className="relative min-w-0 overflow-hidden rounded-2xl p-3.5 text-white shadow-sm transition-shadow hover:shadow-md"
              style={{ backgroundImage: tile.gradient }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)", backgroundSize: "12px 12px" }}
              />
              <div className="relative min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <tile.icon size={15} />
                </span>
                <div className="mt-2 min-w-0">
                  <p className="text-lg font-bold">{tile.value}</p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-white/80">{tile.label}</p>
                  <p className="truncate text-[9px] text-white/60">{tile.caption}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
