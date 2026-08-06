"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import { type KelasRef, type SiswaCardData, kelasShort, completeness } from "./shared";

const KELAS_GRADIENTS = [
  "linear-gradient(135deg,#fb923c,#ea580c)",
  "linear-gradient(135deg,#1120F0,#3B4CF5)",
  "linear-gradient(135deg,#22D3EE,#06B6D4)",
  "linear-gradient(135deg,#4ade80,#22c55e)",
];

const KELAS_PER_PAGE = 4;

export function KelasSelectorGrid({
  kelasList, siswaList, selectedId, onSelect,
}: {
  kelasList: KelasRef[]; siswaList: SiswaCardData[]; selectedId: string; onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(kelasList.length / KELAS_PER_PAGE));
  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);
  const pageSlice = kelasList.slice(page * KELAS_PER_PAGE, page * KELAS_PER_PAGE + KELAS_PER_PAGE);

  function stat(k: KelasRef) {
    const anggota = siswaList.filter((s) => s.kelas.id === k.id);
    const total = anggota.length;
    const avgPct = total > 0 ? Math.round(anggota.reduce((sum, s) => sum + completeness(s), 0) / total) : 0;
    const l = anggota.filter((s) => s.jenisKelamin === "Laki-laki").length;
    const p = anggota.filter((s) => s.jenisKelamin === "Perempuan").length;
    return { total, avgPct, l, p };
  }

  return (
    <div className="mb-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kelas</p>
        <div className="flex items-center gap-2">
          {pageCount > 1 && (
            <span className="text-xs font-semibold text-slate-400">{page + 1} / {pageCount}</span>
          )}
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            <ChevronLeft size={13} />
          </button>
          <button type="button" onClick={() => setPage((p) => (p + 1 < pageCount ? p + 1 : p))} disabled={page + 1 >= pageCount}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {kelasList.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {pageSlice.map((k, i) => {
            const s = stat(k);
            const isSelected = k.id === selectedId;
            const gradient = KELAS_GRADIENTS[(page * KELAS_PER_PAGE + i) % KELAS_GRADIENTS.length];
            const wali = k.waliKelasGuru?.user.nama ?? "Belum ada wali kelas";
            return (
              <button type="button" key={k.id} onClick={() => onSelect(k.id)}
                className="relative flex h-56 flex-col justify-between overflow-hidden rounded-3xl p-4 text-left text-white transition-all"
                style={{
                  background: gradient,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                  outline: isSelected ? "3px solid white" : "3px solid transparent",
                  outlineOffset: isSelected ? "2px" : "0",
                }}>
                <div className="relative flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
                    <BookOpen size={16} />
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    Kelas
                  </span>
                </div>

                <div className="relative">
                  <p className="truncate text-base font-bold">{kelasShort(k.nama)}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium text-white/70">
                    <UserCheck size={10} className="shrink-0" />
                    {wali}
                  </p>
                </div>

                <div className="relative">
                  <p className="text-2xl font-extrabold tabular-nums">{s.total}</p>
                  <p className="text-[11px] font-semibold text-white/80">Siswa Terdaftar</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/25">
                    <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${s.avgPct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-white/70">{s.avgPct}% kelengkapan data</p>
                </div>

                <div className="relative flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">L {s.l}</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">P {s.p}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
