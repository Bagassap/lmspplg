"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Filter, Building2 } from "lucide-react";
import type { StatusPenempatan } from "./types";

const REF_PRIMARY = "#3E03B3";

export type PenempatanStatusFilter = StatusPenempatan | "";

export function PenempatanFilterBar({
  search, onSearch, statusFilter, onStatusFilter,
  total, aktifCount, selesaiCount, batalCount, displayedCount,
  onKelolaTempat, mobileNative = false, menungguCount = 0,
}: {
  search: string; onSearch: (v: string) => void;
  statusFilter: PenempatanStatusFilter; onStatusFilter: (v: PenempatanStatusFilter) => void;
  total: number; aktifCount: number; selesaiCount: number; batalCount: number; displayedCount: number;
  onKelolaTempat: () => void;
  mobileNative?: boolean;
  menungguCount?: number;
}) {
  const STATUS_PILLS: { value: PenempatanStatusFilter; label: string; count: number; bg: string; clr: string }[] = [
    { value: "MENUNGGU", label: "Menunggu", count: menungguCount, bg: "#F1EDFA", clr: "#3E03B3" },
    { value: "AKTIF", label: "Aktif", count: aktifCount, bg: "#E4F5EC", clr: "#22A06B" },
    { value: "SELESAI", label: "Selesai", count: selesaiCount, bg: "#FFF4E0", clr: "#D97706" },
    { value: "BATAL", label: "Batal", count: batalCount, bg: "#FEE2E2", clr: "#DC2626" },
    { value: "", label: "Semua", count: total, bg: "#E0F2FE", clr: "#0EA5E9" },
  ];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(circle, ${REF_PRIMARY} 1px, transparent 1px)`, backgroundSize: "18px 18px" }}
      />

      <p className="relative mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-white">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#F1F5F9", color: REF_PRIMARY }}>
          <Filter size={13} />
        </span>
        Daftar Penempatan <span className="font-medium text-slate-400 dark:text-slate-500">({displayedCount})</span>
      </p>

      <div className="relative flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {STATUS_PILLS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button key={opt.value || "semua"} type="button" onClick={() => onStatusFilter(opt.value)}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-colors"
                style={active ? { background: opt.clr, color: "#fff" } : { background: opt.bg, color: opt.clr }}>
                {opt.label}
                <span className="rounded-lg px-1.5 text-[10px]" style={{ background: active ? "rgba(255,255,255,0.22)" : "#fff" }}>{opt.count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onKelolaTempat} title="Kelola Tempat"
            className={`h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${mobileNative ? "hidden lg:flex" : "flex"}`}>
            <Building2 size={14} /> Kelola Tempat
          </button>
          {mobileNative && (
            <button type="button" onClick={onKelolaTempat} title="Kelola Tempat" aria-label="Kelola Tempat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 lg:hidden">
              <Building2 size={15} />
            </button>
          )}
          <div className="relative w-full lg:w-60">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Cari siswa, NIS, atau tempat…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-[#3E03B3] focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
