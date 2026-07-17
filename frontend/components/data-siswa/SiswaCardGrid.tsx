"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { SiswaCard } from "./SiswaCard";
import { type SiswaCardData, kelasShort } from "./shared";

const PAGE_SIZE = 12;
const GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

type ActionProps = {
  onDetail: (s: SiswaCardData) => void;
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
  showStatus?: boolean;
};

function PaginationBar({ page, pageCount, total, onPage }: {
  page: number; pageCount: number; total: number; onPage: (p: number) => void;
}) {
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  const pages: (number | "…")[] = [];
  if (pageCount <= 7) {
    for (let i = 0; i < pageCount; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 2) pages.push("…");
    for (let i = Math.max(1, page - 1); i <= Math.min(pageCount - 2, page + 1); i++) pages.push(i);
    if (page < pageCount - 3) pages.push("…");
    pages.push(pageCount - 1);
  }
  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-1 pt-3.5 dark:border-slate-700/40 sm:flex-row">
      <span className="text-xs text-slate-400 dark:text-slate-500">{start}–{end} dari {total}</span>
      <div className="flex items-center gap-0.5">
        <button onClick={() => onPage(page - 1)} disabled={page === 0}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/10">
          <ChevronLeft size={13} /> Previous
        </button>
        <div className="mx-1 flex items-center gap-0.5">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`el-${i}`} className="flex h-8 w-6 items-center justify-center text-xs text-slate-400">…</span>
            ) : (
              <button key={p} onClick={() => onPage(p as number)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  p === page ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}>
                {(p as number) + 1}
              </button>
            )
          )}
        </div>
        <button onClick={() => onPage(page + 1)} disabled={page === pageCount - 1}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/10">
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function KelasSection({
  kelas, siswas, ac, ...actions
}: ActionProps & { kelas: string; siswas: SiswaCardData[]; ac: { main: string; light: string; text: string } }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const waliKelas = siswas[0]?.kelas.waliKelasGuru?.user.nama;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl px-1">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ac.main }} />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{kelasShort(kelas)}</p>
            {waliKelas && <p className="text-[11px] text-slate-400 dark:text-slate-500">Wali: {waliKelas}</p>}
          </div>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: ac.light, color: ac.text }}>
          {siswas.length} siswa
        </span>
      </div>

      <div className={GRID_CLASS}>
        {pageItems.map((s, i) => (
          <SiswaCard key={s.id} siswa={s} index={i} {...actions} />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-4">
          <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />
        </div>
      )}
    </motion.div>
  );
}

function FlatGrid({ siswas, ...actions }: ActionProps & { siswas: SiswaCardData[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434] sm:p-5">
      <div className={GRID_CLASS}>
        {pageItems.map((s, i) => (
          <SiswaCard key={s.id} siswa={s} index={i} {...actions} />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="mt-4">
          <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />
        </div>
      )}
    </div>
  );
}

export function SiswaCardGrid({
  loading, siswas, grouped, kelasNamaOrder, kelasColor, defaultAc, ...actions
}: ActionProps & {
  loading: boolean;
  siswas: SiswaCardData[];
  grouped: boolean;
  kelasNamaOrder: string[];
  kelasColor: Record<string, { main: string; light: string; text: string }>;
  defaultAc: { main: string; light: string; text: string };
}) {
  if (loading) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (siswas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-24 text-center shadow-sm dark:border-slate-700/40 dark:bg-slate-900/60">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
          <Users size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tidak ada siswa yang ditemukan</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Coba ubah filter atau kata kunci pencarian</p>
      </div>
    );
  }

  if (!grouped) {
    return <FlatGrid siswas={siswas} {...actions} />;
  }

  const groupedByKelas = kelasNamaOrder.reduce<Record<string, SiswaCardData[]>>((acc, k) => {
    acc[k] = siswas.filter((s) => s.kelas.nama === k);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {kelasNamaOrder.filter((k) => (groupedByKelas[k]?.length ?? 0) > 0).map((k) => (
        <KelasSection key={k} kelas={k} siswas={groupedByKelas[k]} ac={kelasColor[k] ?? defaultAc} {...actions} />
      ))}
    </div>
  );
}
