"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { todayJakarta } from "@/components/absensi-harian/shared";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function parseYmd(v: string) {
  const [y, m, d] = v.split("-").map(Number);
  return { y, m, d };
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function MobileDatePicker({ value, onChange, light, flat }: { value: string; onChange: (v: string) => void; light?: boolean; flat?: boolean }) {
  const [open, setOpen] = useState(false);
  const sel = parseYmd(value);
  const [viewY, setViewY] = useState(sel.y);
  const [viewM, setViewM] = useState(sel.m);
  const today = parseYmd(todayJakarta());

  const label = new Date(sel.y, sel.m - 1, sel.d).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });

  function openPicker() {
    const s = parseYmd(value);
    setViewY(s.y);
    setViewM(s.m);
    setOpen(true);
  }

  function prevMonth() {
    if (viewM === 1) { setViewY((y) => y - 1); setViewM(12); } else { setViewM((m) => m - 1); }
  }
  function nextMonth() {
    if (viewM === 12) { setViewY((y) => y + 1); setViewM(1); } else { setViewM((m) => m + 1); }
  }
  function selectDay(day: number) {
    onChange(`${viewY}-${pad(viewM)}-${pad(day)}`);
    setOpen(false);
  }
  function goToday() {
    onChange(todayJakarta());
    setOpen(false);
  }

  const firstWeekday = new Date(viewY, viewM - 1, 1).getDay();
  const daysInMonth = new Date(viewY, viewM, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <>
      <button type="button" onClick={openPicker}
        className={`relative z-10 flex shrink-0 items-center gap-1.5 ${
          flat
            ? "h-11 rounded-xl bg-slate-50 px-3 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
            : `rounded-full px-3 py-1.5 ${light ? "bg-white text-[#0082FB]" : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}`
        }`}>
        <CalendarDays size={13} className={light ? "text-[#0082FB]" : "text-slate-400"} />
        <span className="text-xs font-bold">{label}</span>
        <ChevronDown size={12} className={light ? "text-[#0082FB]" : "text-slate-400"} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setOpen(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full rounded-t-3xl bg-white p-5 dark:bg-[#1C2B33]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Pilih Tanggal</h3>
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <X size={15} />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button type="button" onClick={prevMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{BULAN[viewM - 1]} {viewY}</p>
                  <button type="button" onClick={nextMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                  {HARI.map((h) => (
                    <span key={h} className="py-1 text-[10px] font-bold uppercase text-slate-400">{h}</span>
                  ))}
                  {cells.map((day, i) => {
                    if (day === null) return <span key={`b${i}`} />;
                    const isSelected = day === sel.d && viewM === sel.m && viewY === sel.y;
                    const isToday = day === today.d && viewM === today.m && viewY === today.y;
                    return (
                      <button key={day} type="button" onClick={() => selectDay(day)}
                        className={`flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                          isSelected || isToday ? "" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        }`}
                        style={isSelected ? { background: "#0082FB", color: "#fff" } : isToday ? { background: "#EAF3FF", color: "#0082FB" } : undefined}>
                        {day}
                      </button>
                    );
                  })}
                </div>

                <button type="button" onClick={goToday}
                  className="mt-4 w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Hari Ini
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
