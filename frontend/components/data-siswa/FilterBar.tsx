"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Users, Mars, Venus, Filter, Sparkles, School, ChevronDown } from "lucide-react";
import { kelasShort, type SiswaCardData, type KelasRef } from "./shared";

// #0082FB = referensi Nasabah's "primary" (dipakai literal di dot-grid pattern
// & JENIS_COLOR.siswa di file referensi), sengaja di-hardcode di sini alih-alih
// pakai token --color-primary bawaan (#0082FB) karena token itu dipakai luas
// di luar Data Siswa (sidebar, topbar, dll) dan tidak boleh ikut berubah.
const REF_PRIMARY = "#0082FB";
// Warna khusus jenis kelamin - sengaja dibedakan satu sama lain supaya
// Laki-laki & Perempuan tidak lagi kembar warna di Ringkasan Jenis Kelamin
// (sebelumnya keduanya sama-sama #0082FB).
const REF_MALE = "#0082FB";
const REF_FEMALE = "#EC4899";

const GENDER_PILLS = [
  { value: "" as const, label: "Semua", icon: Users, color: "#64748B" },
  { value: "Laki-laki" as const, label: "Laki-laki", icon: Mars, color: REF_MALE },
  { value: "Perempuan" as const, label: "Perempuan", icon: Venus, color: REF_FEMALE },
];

export function FilterBar({
  search, onSearch,
  filterGender, onFilterGender,
  kelasList, selectedKelasId, onSelectKelas,
  siswaList,
  isFiltered, onReset,
  loading, totalCount, displayedCount,
}: {
  search: string; onSearch: (v: string) => void;
  filterGender: string; onFilterGender: (v: string) => void;
  kelasList: KelasRef[]; selectedKelasId: string; onSelectKelas: (id: string) => void;
  siswaList: SiswaCardData[];
  isFiltered: boolean; onReset: () => void;
  loading: boolean; totalCount: number; displayedCount: number;
}) {
  const genderCount = (value: string) =>
    value ? siswaList.filter((s) => s.jenisKelamin === value).length : siswaList.length;

  const total = siswaList.length;
  const lCount = genderCount("Laki-laki");
  const pCount = genderCount("Perempuan");
  const lPct = total > 0 ? Math.round((lCount / total) * 100) : 0;
  const pPct = total > 0 ? 100 - lPct : 0;

  return (
    <div className="relative flex flex-col p-4 sm:p-5">
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${REF_PRIMARY}1a`, color: REF_PRIMARY }}>
              <Filter size={13} />
            </span>
            Data Siswa <span className="font-medium text-slate-400 dark:text-slate-500">({displayedCount})</span>
          </p>
          <p className="mt-1 ml-9 text-xs text-slate-500 dark:text-slate-400">
            Cari dan saring siswa di kelas ini
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative shrink-0 sm:w-44">
            <School size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedKelasId}
              onChange={(e) => onSelectKelas(e.target.value)}
              className="h-10.5 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 transition-all focus:border-[#0082FB] focus:outline-none focus:ring-2 focus:ring-[#0082FB]/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative w-full sm:max-w-xs">
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
              className="h-10.5 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-[#0082FB] focus:outline-none focus:ring-2 focus:ring-[#0082FB]/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
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
      </div>

      <div className="relative mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/50 sm:flex-row sm:items-stretch">
        <div className="flex flex-col gap-1.5 sm:shrink-0">
          {!loading && !isFiltered && (
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Menampilkan {totalCount} siswa di kelas ini
            </p>
          )}
          <div className="flex flex-wrap content-start items-center gap-1.5">
            {GENDER_PILLS.map((opt) => {
            const active = filterGender === opt.value;
            const OptIcon = opt.icon;
            return (
              <motion.button
                key={opt.label}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onFilterGender(opt.value)}
                className="relative rounded-md px-3.5 py-1.5 text-xs font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="gender-pill-active"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-md shadow-sm"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                <span className={`relative flex items-center gap-1.5 transition-colors ${active ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                  <OptIcon size={12} />
                  {opt.label}
                  <span className={`rounded-lg px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                    {genderCount(opt.value)}
                  </span>
                </span>
              </motion.button>
            );
            })}
          </div>
        </div>

        {total > 0 && (
          <div className="flex flex-1 flex-col justify-center rounded-2xl bg-slate-50 p-3 dark:bg-slate-700/20">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <Users size={11} />
              Ringkasan Jenis Kelamin
            </p>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
              {lPct > 0 && <div style={{ width: `${lPct}%`, backgroundColor: REF_MALE }} />}
              {pPct > 0 && <div style={{ width: `${pPct}%`, backgroundColor: REF_FEMALE }} />}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: REF_MALE }} />
                Laki-laki <span className="font-bold text-slate-800 dark:text-white">{lCount}</span>
                <span className="text-slate-400 dark:text-slate-500">({lPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: REF_FEMALE }} />
                Perempuan <span className="font-bold text-slate-800 dark:text-white">{pCount}</span>
                <span className="text-slate-400 dark:text-slate-500">({pPct}%)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {isFiltered && (
        <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <Sparkles size={11} />
            Filter aktif:
          </span>
          {search && (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${REF_PRIMARY}1a`, color: REF_PRIMARY }}>
              <Search size={12} /> &ldquo;{search}&rdquo;
              <button type="button" onClick={() => onSearch("")}><X size={12} /></button>
            </span>
          )}
          {filterGender && (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${filterGender === "Laki-laki" ? REF_MALE : REF_FEMALE}1a`, color: filterGender === "Laki-laki" ? REF_MALE : REF_FEMALE }}>
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
    </div>
  );
}
