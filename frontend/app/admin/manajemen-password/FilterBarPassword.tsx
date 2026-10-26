"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Users, CheckCircle2, XCircle, Filter, KeyRound, UserCheck, School, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { kelasShort } from "@/components/data-siswa/shared";
import { useIsAppMode } from "@/lib/pwaInstall";

const REF_PRIMARY = "#3E03B3";
const REF_SUCCESS = "#059669";

export type StatusFilter = "" | "sudah" | "belum";

type WaliInfo = {
  id: string;
  nama: string;
  fotoProfil?: string | null;
  mustChangePassword: boolean;
} | null;

type KelasOption = { id: string; nama: string };

export function FilterBarPassword({
  kelasList, selectedKelasId, onSelectKelas,
  kelasNama, wali, onResetWali,
  search, onSearch,
  statusFilter, onStatusFilter,
  total, sudahCount, belumCount, displayedCount,
}: {
  kelasList: KelasOption[]; selectedKelasId: string; onSelectKelas: (id: string) => void;
  kelasNama?: string;
  wali: WaliInfo;
  onResetWali: () => void;
  search: string; onSearch: (v: string) => void;
  statusFilter: StatusFilter; onStatusFilter: (v: StatusFilter) => void;
  total: number; sudahCount: number; belumCount: number; displayedCount: number;
}) {
  const STATUS_PILLS: { value: StatusFilter; label: string; icon: typeof Users; count: number }[] = [
    { value: "", label: "Semua", icon: Users, count: total },
    { value: "sudah", label: "Sudah Ganti", icon: CheckCircle2, count: sudahCount },
    { value: "belum", label: "Belum Ganti", icon: XCircle, count: belumCount },
  ];

  const app = useIsAppMode();
  if (app) {
    return (
      <div className="space-y-2.5 p-3">
        <div className="flex items-center gap-2">
          <div className="relative w-28 shrink-0">
            <select value={selectedKelasId} onChange={(e) => onSelectKelas(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border-0 bg-[#F1EDFA] pl-3.5 pr-7 text-xs font-bold text-[#3E03B3] focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/30">
              {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#3E03B3]" />
          </div>
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Cari nama atau NIS…"
              className="h-10 w-full rounded-xl border-0 bg-[#F1EDFA] pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/30 dark:bg-slate-700 dark:text-slate-200" />
            {search && <button type="button" onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_PILLS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => onStatusFilter(opt.value)}
              className={`rounded-xl px-3 py-1 text-[11px] font-bold ${statusFilter === opt.value ? "bg-[#3E03B3] text-white" : "bg-[#F1EDFA] text-[#3E03B3]"}`}>
              {opt.label} {opt.count}
            </button>
          ))}
        </div>
        {wali && (
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-700">
            <Avatar src={wali.fotoProfil} nama={wali.nama} sizePx={28} fallbackBg="#3E03B3" textClassName="text-[10px] font-bold" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-white">{wali.nama}</p>
              <p className="text-[10px] text-slate-500">Wali kelas · {wali.mustChangePassword ? "belum ganti" : "sudah ganti"}</p>
            </div>
            <button onClick={onResetWali} className="flex items-center gap-1 rounded-xl bg-[#3E03B3] px-3 py-1.5 text-[11px] font-bold text-white">
              <KeyRound size={11} /> Reset
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <p className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#F1F5F9", color: REF_PRIMARY }}>
              <Filter size={13} />
            </span>
            Kelola Password <span className="font-medium text-slate-400 dark:text-slate-500">({displayedCount})</span>
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center">
          <div className="relative shrink-0 sm:w-44">
            <School size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedKelasId}
              onChange={(e) => onSelectKelas(e.target.value)}
              className="h-10.5 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 transition-all focus:border-[#3E03B3] focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative w-full sm:min-w-0 sm:flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Cari nama atau NIS…"
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
          <div className="relative flex shrink-0 items-center gap-1.5">
            {STATUS_PILLS.map((opt) => {
              const active = statusFilter === opt.value;
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStatusFilter(opt.value)}
                  className="relative rounded-md px-3.5 py-1.5 text-xs font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="password-status-pill-active"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-md shadow-sm"
                      style={{ backgroundColor: "#3E03B3" }}
                    />
                  )}
                  <span className={`relative flex items-center gap-1.5 transition-colors ${active ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                    <Icon size={12} />
                    {opt.label}
                    <span className={`rounded-lg px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                      {opt.count}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {wali && (
        <div className="relative mt-4 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar src={wali.fotoProfil} nama={wali.nama} sizePx={34} fallbackBg="#3E03B3" textClassName="text-xs font-bold" />
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <UserCheck size={11} /> Wali Kelas
              </p>
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{wali.nama}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {wali.mustChangePassword ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#FFE9E2] px-2.5 py-1 text-[10px] font-semibold text-[#F26A3D]">
                Belum Ganti
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold" style={{ backgroundColor: "#F1F5F9", color: REF_SUCCESS }}>
                Sudah Ganti
              </span>
            )}
            <button onClick={onResetWali}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:brightness-95"
              style={{ background: REF_PRIMARY }}>
              <KeyRound size={11} /> Reset
            </button>
          </div>
        </div>
      )}

      <p className="relative mt-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400 dark:border-slate-700/50 dark:text-slate-500">
        Menampilkan {displayedCount} dari {total} siswa di kelas ini
      </p>
    </div>
  );
}
