"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Filter, Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { StatusPenempatan } from "./types";

const REF_PRIMARY = "#1120F0";

export type PenempatanStatusFilter = StatusPenempatan | "";

export function PenempatanFilterBar({
  search, onSearch, statusFilter, onStatusFilter,
  total, aktifCount, selesaiCount, batalCount, displayedCount,
}: {
  search: string; onSearch: (v: string) => void;
  statusFilter: PenempatanStatusFilter; onStatusFilter: (v: PenempatanStatusFilter) => void;
  total: number; aktifCount: number; selesaiCount: number; batalCount: number; displayedCount: number;
}) {
  const STATUS_PILLS: { value: PenempatanStatusFilter; label: string; icon: typeof Users; count: number }[] = [
    { value: "", label: "Semua", icon: Users, count: total },
    { value: "AKTIF", label: "Aktif", icon: Clock, count: aktifCount },
    { value: "SELESAI", label: "Selesai", icon: CheckCircle2, count: selesaiCount },
    { value: "BATAL", label: "Batal", icon: XCircle, count: batalCount },
  ];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(circle, ${REF_PRIMARY} 1px, transparent 1px)`, backgroundSize: "18px 18px" }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${REF_PRIMARY}1a`, color: REF_PRIMARY }}>
              <Filter size={13} />
            </span>
            Daftar Penempatan <span className="font-medium text-slate-400 dark:text-slate-500">({displayedCount})</span>
          </p>
          <p className="mt-1 ml-9 text-xs text-slate-500 dark:text-slate-400">Cari dan saring status penempatan siswa</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari nama siswa, NIS, atau tempat…"
            className="h-10.5 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-[#1120F0] focus:outline-none focus:ring-2 focus:ring-[#1120F0]/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-4 dark:border-slate-700/50">
        {STATUS_PILLS.map((opt) => {
          const active = statusFilter === opt.value;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.value || "semua"}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onStatusFilter(opt.value)}
              className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="penempatan-status-pill-active"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full shadow-sm"
                  style={{ backgroundColor: REF_PRIMARY }}
                />
              )}
              <span className={`relative flex items-center gap-1.5 transition-colors ${active ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                <Icon size={12} />
                {opt.label}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                  {opt.count}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
