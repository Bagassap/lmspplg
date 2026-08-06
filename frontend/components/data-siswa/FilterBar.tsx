"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ChevronDown, Users, School, BookOpen, Mars, Venus, Download, Filter, Sparkles } from "lucide-react";
import { JURUSAN_OPTIONS, kelasShort, type KelasRef, type SiswaCardData } from "./shared";
import { DataSiswaExportButtons } from "./DataSiswaExportButtons";

const JURUSAN_PILLS = [
  { value: "" as const, label: "Semua", color: "#0033FF" },
  { value: "Pengembangan Perangkat Lunak dan Gim" as const, label: "PPLG", color: "#6334F4" },
  { value: "Pengembangan Gim" as const, label: "Gim", color: "#0EA5E9" },
  { value: "Rekayasa Perangkat Lunak" as const, label: "RPL", color: "#0d9488" },
];

const GENDER_PILLS = [
  { value: "" as const, label: "Semua", icon: Users },
  { value: "Laki-laki" as const, label: "Laki-laki", icon: Mars },
  { value: "Perempuan" as const, label: "Perempuan", icon: Venus },
];

export function FilterBar({
  search, onSearch,
  filterJurusan, onFilterJurusan,
  filterKelas, onFilterKelas,
  filterGender, onFilterGender,
  kelasList,
  siswaList,
  isFiltered, onReset,
  loading, totalCount, displayedCount, kelasCount,
}: {
  search: string; onSearch: (v: string) => void;
  filterJurusan: string; onFilterJurusan: (v: string) => void;
  filterKelas: string; onFilterKelas: (v: string) => void;
  filterGender: string; onFilterGender: (v: string) => void;
  kelasList: KelasRef[];
  siswaList: SiswaCardData[];
  isFiltered: boolean; onReset: () => void;
  loading: boolean; totalCount: number; displayedCount: number; kelasCount: number;
}) {
  const SELECT =
    "h-10.5 w-full min-w-32 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-600 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const DIVIDER = "hidden h-7 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block";

  const jurusanCount = (value: string) =>
    value ? siswaList.filter((s) => s.jurusan === value).length : siswaList.length;
  const genderCount = (value: string) =>
    value ? siswaList.filter((s) => s.jenisKelamin === value).length : siswaList.length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(circle, #0033FF 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Filter size={13} />
            </span>
            Data Siswa <span className="font-medium text-slate-400 dark:text-slate-500">({displayedCount})</span>
          </p>
          <p className="mt-1 ml-9 text-xs text-slate-500 dark:text-slate-400">
            Cari, saring, dan unduh data siswa dengan cepat
          </p>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          <div className="relative w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1">
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
            <School size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={filterKelas} onChange={(e) => onFilterKelas(e.target.value)} className={SELECT}>
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <span title="Unduh Data Siswa" className="shrink-0">
            <Download size={14} className="text-slate-300 dark:text-slate-600" />
          </span>
          <DataSiswaExportButtons
            kelasId={filterKelas || undefined}
            kelasNama={filterKelas ? kelasList.find((k) => k.id === filterKelas)?.nama : undefined}
          />
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/50">
        <div className="flex flex-wrap items-center gap-1.5">
          {JURUSAN_PILLS.map((opt) => {
            const active = filterJurusan === opt.value;
            return (
              <motion.button
                key={opt.label}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onFilterJurusan(opt.value)}
                className="relative rounded-md px-3.5 py-1.5 text-xs font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="jurusan-pill-active"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-md shadow-sm"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                <span className={`relative flex items-center gap-1.5 transition-colors ${active ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                  <BookOpen size={12} />
                  {opt.label}
                  <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                    {jurusanCount(opt.value)}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {GENDER_PILLS.map((opt) => {
            const active = filterGender === opt.value;
            const OptIcon = opt.icon;
            return (
              <motion.button
                key={opt.label}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onFilterGender(opt.value)}
                className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="gender-pill-active"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-primary shadow-sm"
                  />
                )}
                <span className={`relative flex items-center gap-1.5 transition-colors ${active ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                  <OptIcon size={12} />
                  {opt.label}
                  <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                    {genderCount(opt.value)}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {isFiltered && (
        <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <Sparkles size={11} />
            Filter aktif:
          </span>
          {search && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Search size={12} /> &ldquo;{search}&rdquo;
              <button type="button" onClick={() => onSearch("")}><X size={12} /></button>
            </span>
          )}
          {filterJurusan && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <BookOpen size={12} /> {JURUSAN_PILLS.find((j) => j.value === filterJurusan)?.label ?? filterJurusan}
              <button type="button" onClick={() => onFilterJurusan("")}><X size={12} /></button>
            </span>
          )}
          {filterKelas && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <School size={12} /> {kelasShort(kelasList.find((k) => k.id === filterKelas)?.nama ?? "")}
              <button type="button" onClick={() => onFilterKelas("")}><X size={12} /></button>
            </span>
          )}
          {filterGender && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {filterGender === "Laki-laki" ? <Mars size={12} /> : <Venus size={12} />} {filterGender}
              <button type="button" onClick={() => onFilterGender("")}><X size={12} /></button>
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500"
          >
            Clear all
          </button>
        </div>
      )}

      {!loading && !isFiltered && (
        <p className="relative mt-3 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400 dark:border-slate-700/50 dark:text-slate-500">
          Menampilkan {totalCount} siswa dari {kelasCount} kelas
        </p>
      )}
    </div>
  );
}
