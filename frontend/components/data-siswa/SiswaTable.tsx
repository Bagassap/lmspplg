"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { SiswaTableHead, SiswaTableRow } from "./SiswaTableRow";
import { KelasGroupHeader } from "./KelasGroupHeader";
import { type SiswaCardData } from "./shared";

const PAGE_SIZE = 15;

type ActionProps = {
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
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
    <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-700/40 sm:flex-row">
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

function RowList({ siswas, ...actions }: ActionProps & { siswas: SiswaCardData[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1c2434]">
      <div className="overflow-x-auto">
        <div className="min-w-140">
          <SiswaTableHead />
          {pageItems.map((s) => (
            <SiswaTableRow key={s.id} siswa={s} {...actions} />
          ))}
        </div>
      </div>
      {pageCount > 1 && <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />}
    </div>
  );
}

function KelasSection({
  kelas, siswas, ...actions
}: ActionProps & { kelas: string; siswas: SiswaCardData[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const waliKelas = siswas[0]?.kelas.waliKelasGuru?.user.nama;

  return (
    <div className="space-y-2">
      <KelasGroupHeader
        kelas={kelas}
        waliKelas={waliKelas}
        count={siswas.length}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      {!collapsed && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1c2434]">
          <div className="overflow-x-auto">
            <div className="min-w-140">
              <SiswaTableHead />
              {pageItems.map((s) => (
                <SiswaTableRow key={s.id} siswa={s} {...actions} />
              ))}
            </div>
          </div>
          {pageCount > 1 && <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />}
        </div>
      )}
    </div>
  );
}

export function SiswaTable({
  loading, siswas, grouped, kelasNamaOrder, ...actions
}: ActionProps & {
  loading: boolean;
  siswas: SiswaCardData[];
  grouped: boolean;
  kelasNamaOrder: string[];
}) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
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
    return <RowList siswas={siswas} {...actions} />;
  }

  const groupedByKelas = kelasNamaOrder.reduce<Record<string, SiswaCardData[]>>((acc, k) => {
    acc[k] = siswas.filter((s) => s.kelas.nama === k);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {kelasNamaOrder.filter((k) => (groupedByKelas[k]?.length ?? 0) > 0).map((k) => (
        <KelasSection key={k} kelas={k} siswas={groupedByKelas[k]} {...actions} />
      ))}
    </div>
  );
}
