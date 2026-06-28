"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

const THEMES = [
  { icon: "#4F8EF7", iconBg: "#EEF4FF", trend: "+45%", up: true,  label: "This week" },
  { icon: "#10B981", iconBg: "#ECFDF5", trend: "+45%", up: true,  label: "This week" },
  { icon: "#EF4444", iconBg: "#FFF1F2", trend: "-45%", up: false, label: "This week" },
  { icon: "#F59E0B", iconBg: "#FFFBEB", trend: "-45%", up: false, label: "This week" },
] as const;

function useCountUp(target: number, duration = 1200) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ctrl = animate(mv, target, { duration: duration / 1000, ease: [0.16, 1, 0.3, 1] });
    return () => ctrl.stop();
  }, [mv, target, duration]);
  return rounded;
}

export interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  sub?: string;
  delay?: number;
  index?: number;
  from?: string;
  to?: string;
  compact?: boolean;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  delay = 0,
  index = 0,
}: StatsCardProps) {
  const count = useCountUp(value);
  const theme = THEMES[index % THEMES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434] cursor-default"
    >
      {/* Icon circle — large, Boltz-style */}
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: theme.iconBg }}
      >
        <Icon size={26} style={{ color: theme.icon }} strokeWidth={1.8} />
      </div>

      {/* Value + label + trend */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1">
          <motion.span className="text-3xl font-bold text-slate-800 tabular-nums dark:text-white">
            {count}
          </motion.span>
          {suffix && <span className="text-base font-semibold text-slate-400">{suffix}</span>}
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {/* Trend — Boltz style */}
        <div className="mt-1.5 flex items-center gap-1">
          {theme.up
            ? <TrendingUp size={12} strokeWidth={2.5} style={{ color: "#10B981" }} />
            : <TrendingDown size={12} strokeWidth={2.5} style={{ color: "#EF4444" }} />
          }
          <span className="text-[11px] font-semibold" style={{ color: theme.up ? "#10B981" : "#EF4444" }}>
            {theme.trend}
          </span>
          <span className="text-[11px] text-slate-400">{theme.label}</span>
        </div>
      </div>
    </motion.div>
  );
}
