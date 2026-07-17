"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ChevronDown, Users, GraduationCap } from "lucide-react";
import { JURUSAN_OPTIONS, kelasShort, type KelasRef } from "./shared";

export function FilterBar({
  search, onSearch,
  filterJurusan, onFilterJurusan,
  filterKelas, onFilterKelas,
  filterGender, onFilterGender,
  kelasList,
  isFiltered, onReset,
  loading, totalCount, displayedCount, kelasCount,
}: {
  search: string; onSearch: (v: string) => void;
  filterJurusan: string; onFilterJurusan: (v: string) => void;
  filterKelas: string; onFilterKelas: (v: string) => void;
  filterGender: string; onFilterGender: (v: string) => void;
  kelasList: KelasRef[];
  isFiltered: boolean; onReset: () => void;
  loading: boolean; totalCount: number; displayedCount: number; kelasCount: number;
}) {
  const SELECT =
    "h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-9 text-sm text-slate-600 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300";

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434] sm:p-5">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Cari nama atau NIS…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="relative">
          <select value={filterJurusan} onChange={(e) => onFilterJurusan(e.target.value)} className={SELECT}>
            <option value="">Semua Jurusan</option>
            {JURUSAN_OPTIONS.map((j) => <option key={j}>{j}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="relative">
          <select value={filterKelas} onChange={(e) => onFilterKelas(e.target.value)} className={SELECT}>
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="relative flex gap-2.5">
          <div className="relative flex-1">
            <select value={filterGender} onChange={(e) => onFilterGender(e.target.value)} className={SELECT}>
              <option value="">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <AnimatePresence>
            {isFiltered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, width: 0 }} animate={{ opacity: 1, scale: 1, width: "auto" }} exit={{ opacity: 0, scale: 0.8, width: 0 }}
                onClick={onReset}
                className="flex h-11 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-3.5 text-sm font-medium text-red-500 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10"
              >
                <X size={13} /> Reset
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!loading && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-700/40">
          {isFiltered ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary dark:bg-primary/20">
              <Search size={11} /> {displayedCount} siswa ditemukan
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary dark:bg-primary/20">
                <Users size={11} /> Total {totalCount} siswa
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                <GraduationCap size={11} /> {kelasCount} kelas
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
