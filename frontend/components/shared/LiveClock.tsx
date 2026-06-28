"use client";

import { useState, useEffect } from "react";
import { Clock, CalendarDays } from "lucide-react";

const HARI  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

/**
 * LiveClock — real-time clock widget for dark hero headers.
 * Hydration-safe: renders null on the server, then starts ticking on mount.
 *
 * variant="header"  — full pill (day, date, HH:MM:SS WIB) matching hero header style
 * variant="compact" — just HH:MM:SS in a small pill
 */
export function LiveClock({ variant = "header" }: { variant?: "header" | "compact" }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const jam = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-1.5 backdrop-blur-sm">
        <Clock size={11} className="shrink-0 animate-pulse text-[#977DFF]" />
        <span className="text-xs font-bold tabular-nums text-white">{jam}</span>
      </div>
    );
  }

  const hari    = HARI[now.getDay()];
  const tanggal = now.getDate();
  const bulan   = BULAN[now.getMonth()];
  const tahun   = now.getFullYear();

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 sm:gap-3 sm:px-4 sm:py-2">
      {/* Segmen Tanggal */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <CalendarDays className="h-3 w-3 shrink-0 text-[#977DFF] sm:h-4 sm:w-4" />
        <span className="text-[11px] font-medium text-white/90 sm:text-sm">{hari}, {tanggal} {bulan} {tahun}</span>
      </div>

      {/* Divider */}
      <div className="h-3 w-px bg-white/20 sm:h-4" />

      {/* Segmen Jam */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Clock className="h-3 w-3 shrink-0 animate-pulse text-[#977DFF] sm:h-4 sm:w-4" />
        <span className="text-[11px] font-bold tabular-nums text-white sm:text-sm">{jam} WIB</span>
      </div>
    </div>
  );
}
