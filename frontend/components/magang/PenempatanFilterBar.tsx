"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Filter, Building2 } from "lucide-react";
import type { StatusPenempatan } from "./types";

const REF_PRIMARY = "#3E03B3";

export type PenempatanStatusFilter = StatusPenempatan | "";

export function PenempatanFilterBar({
  search, onSearch, displayedCount, onKelolaTempat, mobileNative = false,
}: {
  search: string; onSearch: (v: string) => void;
  displayedCount: number;
  onKelolaTempat: () => void;
  mobileNative?: boolean;
}) {

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(circle, ${REF_PRIMARY} 1px, transparent 1px)`, backgroundSize: "18px 18px" }}
      />

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#F1F5F9", color: REF_PRIMARY }}>
              <Filter size={13} />
            </span>
            Daftar Penempatan <span className="font-medium text-slate-400 dark:text-slate-500">({displayedCount})</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className={`flex shrink-0 items-center gap-2 ${mobileNative ? "hidden lg:flex" : ""}`}>
            <button type="button" onClick={onKelolaTempat}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <Building2 size={14} /> Kelola Tempat
            </button>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Cari nama siswa, NIS, atau tempat…"
                className="h-10.5 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-[#3E03B3] focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
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

            {mobileNative && (
              <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
                <button type="button" onClick={onKelolaTempat} title="Kelola Tempat"
                  className="flex h-10.5 w-10.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Building2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
