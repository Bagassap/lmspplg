"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ChevronDown, Users, School, BookOpen, VenusAndMars, Download } from "lucide-react";
import { JURUSAN_OPTIONS, kelasShort, type KelasRef } from "./shared";
import { DataSiswaExportButtons } from "./DataSiswaExportButtons";

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
    "h-10.5 w-full min-w-32 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-600 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const DIVIDER = "hidden h-7 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block";

  return (
    <div className="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white px-4 py-3.5 shadow-md dark:border-slate-700 dark:from-slate-800/60 dark:to-slate-800/30">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:min-w-40">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="data-siswa-search"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari nama atau NIS…"
            className="h-10.5 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
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

        <div className="relative shrink-0 sm:w-38">
          <BookOpen size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterJurusan} onChange={(e) => onFilterJurusan(e.target.value)} className={SELECT}>
            <option value="">Semua Jurusan</option>
            {JURUSAN_OPTIONS.map((j) => <option key={j}>{j}</option>)}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative shrink-0 sm:w-38">
          <School size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterKelas} onChange={(e) => onFilterKelas(e.target.value)} className={SELECT}>
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative shrink-0 sm:w-34">
          <VenusAndMars size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterGender} onChange={(e) => onFilterGender(e.target.value)} className={SELECT}>
            <option value="">Semua Gender</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <AnimatePresence>
          {isFiltered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={onReset}
              className="flex h-10.5 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3.5 text-sm font-medium text-red-500 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10"
            >
              <X size={13} /> Reset
            </motion.button>
          )}
        </AnimatePresence>

        <div className={DIVIDER} />

        {!loading && (
          <div className="flex flex-wrap items-center gap-2">
            {isFiltered ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Search size={11} /> {displayedCount} siswa ditemukan
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Users size={11} /> {totalCount} Siswa
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  <School size={11} /> {kelasCount} Kelas
                </span>
              </>
            )}
          </div>
        )}

        <div className={DIVIDER} />

        <div className="flex flex-wrap items-center gap-2">
          <span title="Unduh Data Siswa" className="shrink-0">
            <Download size={14} className="text-slate-300 dark:text-slate-600" />
          </span>
          <DataSiswaExportButtons
            kelasId={filterKelas || undefined}
            kelasNama={filterKelas ? kelasList.find((k) => k.id === filterKelas)?.nama : undefined}
          />
        </div>
      </div>
    </div>
  );
}
