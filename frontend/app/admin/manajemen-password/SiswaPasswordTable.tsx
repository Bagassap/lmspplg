"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, KeyRound, CheckCircle2, XCircle, Users } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { PageSizeToggle, paginate } from "@/components/shared/PageSizeToggle";

const REF_PRIMARY = "#0082FB";
const REF_SUCCESS = "#00D67F";
const GRID_COLS = "28px 40px 2.2fr 1.8fr 1.6fr";

export type SiswaPasswordItem = {
  id: string;
  nis: string;
  nama: string;
  user: { id: string; mustChangePassword: boolean; updatedAt: string; fotoProfil?: string | null } | null;
};

function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}
function belumGantiLabel(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return "Belum ganti hari ini";
  if (d === 1) return "Belum ganti 1 hari";
  return `Belum ganti ${d} hari`;
}

export function SiswaPasswordTable({
  loading, siswas, onReset,
}: {
  loading: boolean;
  siswas: SiswaPasswordItem[];
  onReset: (s: SiswaPasswordItem) => void;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  useEffect(() => setPage(0), [siswas]);

  const { pageItems, pageCount, start, end } = paginate(siswas, page, pageSize);

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  if (siswas.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Users size={24} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Tidak ada siswa yang ditemukan</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-140">
          <div className="grid items-center gap-3 px-5 py-3" style={{ gridTemplateColumns: GRID_COLS, backgroundColor: "#1C2B33" }}>
            <span />
            <span />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Nama Siswa</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Status Password</span>
            <span className="text-right text-[10px] font-bold uppercase tracking-wider text-white">Aksi</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {pageItems.map((s, idx) => {
              const displayNama = toTitleCase(s.nama);
              const mustChange = s.user?.mustChangePassword ?? null;
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (idx % 15) * 0.02 }}
                  className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                  style={{ gridTemplateColumns: GRID_COLS }}>
                  <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{start + idx}</span>
                  <Avatar src={s.user?.fotoProfil} nama={displayNama} sizePx={36} fallbackBg="#0082FB" textClassName="text-[10px] font-extrabold" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{displayNama}</p>
                    <p className="truncate text-xs font-mono text-slate-400 dark:text-slate-500">{s.nis}</p>
                  </div>
                  <div>
                    {mustChange === null ? (
                      <span className="text-xs text-slate-300 dark:text-slate-600">Belum ada akun</span>
                    ) : mustChange ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                          <XCircle size={11} /> Belum Ganti
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{belumGantiLabel(s.user!.updatedAt)}</span>
                      </div>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${REF_SUCCESS}26`, color: REF_SUCCESS }}>
                        <CheckCircle2 size={12} /> Sudah Ganti
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {s.user ? (
                      <button onClick={() => onReset(s)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-95"
                        style={{ backgroundColor: REF_PRIMARY }}>
                        <KeyRound size={12} /> Reset
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-700/40">
        <span className="text-xs text-slate-400 dark:text-slate-500">{start}–{end} dari {siswas.length}</span>
        <div className="flex items-center gap-2.5">
          <PageSizeToggle value={pageSize} onChange={(n) => { setPageSize(n); setPage(0); }} />
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-700">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i)
                .filter((i) => i === 0 || i === pageCount - 1 || Math.abs(i - page) <= 1)
                .map((i, idx, arr) => (
                  <span key={i} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== i - 1 && (
                      <span className="px-1 text-xs font-semibold text-slate-300 dark:text-slate-600">…</span>
                    )}
                    <button onClick={() => setPage(i)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        i === page
                          ? "bg-[#0082FB] text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                      }`}>
                      {i + 1}
                    </button>
                  </span>
                ))}
              <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-700">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
