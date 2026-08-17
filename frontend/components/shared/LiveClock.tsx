"use client";

import { useState, useEffect } from "react";
import { Clock, CalendarDays } from "lucide-react";

const HARI  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const WEEKDAY_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Reads wall-clock WIB (Asia/Jakarta) explicitly via Intl, mirroring
// jakartaParts() on the backend — a bare `new Date()` reads whatever
// timezone the viewing device's OS/browser happens to be set to, which
// this component must never silently relabel as "WIB".
function jakartaNow() {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", weekday: "short",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
    dayOfWeek: WEEKDAY_NUM[get("weekday")] ?? 0,
  };
}

export function LiveClock({ variant = "header" }: { variant?: "header" | "compact" }) {
  const [now, setNow] = useState<ReturnType<typeof jakartaNow> | null>(null);

  useEffect(() => {
    setNow(jakartaNow());
    const id = setInterval(() => setNow(jakartaNow()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const jam = `${now.hour}:${now.minute}:${now.second}`;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-1.5 backdrop-blur-sm">
        <Clock size={11} className="shrink-0 animate-pulse text-[#977DFF]" />
        <span className="text-xs font-bold tabular-nums text-white">{jam}</span>
      </div>
    );
  }

  const hari    = HARI[now.dayOfWeek];
  const tanggal = now.day;
  const bulan   = BULAN[now.month - 1];
  const tahun   = now.year;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 sm:gap-3 sm:px-4 sm:py-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <CalendarDays className="h-3 w-3 shrink-0 text-[#977DFF] sm:h-4 sm:w-4" />
        <span className="text-[11px] font-medium text-white/90 sm:text-sm">{hari}, {tanggal} {bulan} {tahun}</span>
      </div>

      <div className="h-3 w-px bg-white/20 sm:h-4" />

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Clock className="h-3 w-3 shrink-0 animate-pulse text-[#977DFF] sm:h-4 sm:w-4" />
        <span className="text-[11px] font-bold tabular-nums text-white sm:text-sm">{jam} WIB</span>
      </div>
    </div>
  );
}
