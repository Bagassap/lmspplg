"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { LucideIcon } from "lucide-react";

function useCountUp(target: number, duration = 1200) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
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
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  sub,
  delay = 0,
}: StatsCardProps) {
  const count = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1E293B] cursor-default sm:gap-4 sm:rounded-2xl sm:p-5"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
        style={{ background: "linear-gradient(145deg, #0EA5E9 0%, #3E03B3 55%, #2D0281 100%)" }}
      >
        <Icon size={16} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden" strokeWidth={1.8} />
        <Icon size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1">
          <motion.span className="text-lg font-bold text-slate-800 tabular-nums dark:text-white sm:text-3xl">
            {count}
          </motion.span>
          {suffix && <span className="text-[11px] font-semibold text-slate-400 sm:text-base">{suffix}</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{label}</p>
        {sub && <p className="mt-0.5 truncate text-[9px] text-slate-400 dark:text-slate-500 sm:mt-1.5 sm:text-[11px]">{sub}</p>}
      </div>
    </motion.div>
  );
}
