"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageSizeToggle, paginate } from "./PageSizeToggle";

export function usePagedList<T>(items: T[], resetKey = "") {
  const [pageSize, setUkuran] = useState<number>(10);
  const [posisi, setPosisi] = useState({ key: resetKey, page: 0 });
  const mentah = posisi.key === resetKey ? posisi.page : 0;
  const maks = Number.isFinite(pageSize) ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;
  const page = Math.min(mentah, maks - 1);
  const { pageItems, pageCount, start, end } = paginate(items, page, pageSize);
  const setPage = (p: number) => setPosisi({ key: resetKey, page: p });
  const setPageSize = (n: number) => { setUkuran(n); setPage(0); };
  return { pageItems, pageCount, start, end, page, pageSize, total: items.length, setPage, setPageSize };
}

export function TablePager({ pg, className = "", ringkas = false }: {
  pg: Pick<ReturnType<typeof usePagedList>, "pageCount" | "start" | "end" | "page" | "pageSize" | "total" | "setPage" | "setPageSize">;
  className?: string;
  ringkas?: boolean;
}) {
  if (pg.total === 0) return null;
  if (ringkas) {
    return (
      <div className={`flex flex-nowrap items-center justify-between gap-1 ${className}`}>
        <span className="shrink-0 whitespace-nowrap text-[10px] tabular-nums text-slate-400 dark:text-slate-500">{pg.start}–{pg.end}/{pg.total}</span>
        <PageSizeToggle value={pg.pageSize} onChange={pg.setPageSize} kecil />
        {pg.pageCount > 1 && (
          <div className="flex shrink-0 items-center">
            <button type="button" onClick={() => pg.setPage(Math.max(0, pg.page - 1))} disabled={pg.page === 0} aria-label="Sebelumnya"
              className="flex h-6 w-5 items-center justify-center rounded-lg text-slate-400 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500">
              <ChevronLeft size={13} />
            </button>
            <span className="whitespace-nowrap text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-300">{pg.page + 1}/{pg.pageCount}</span>
            <button type="button" onClick={() => pg.setPage(Math.min(pg.pageCount - 1, pg.page + 1))} disabled={pg.page >= pg.pageCount - 1} aria-label="Berikutnya"
              className="flex h-6 w-5 items-center justify-center rounded-lg text-slate-400 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500">
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    );
  }
  const nomor = Array.from({ length: pg.pageCount }, (_, i) => i)
    .filter((i) => i === 0 || i === pg.pageCount - 1 || Math.abs(i - pg.page) <= 1);
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <span className="text-xs text-slate-400 dark:text-slate-500">{pg.start}–{pg.end} dari {pg.total}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        <PageSizeToggle value={pg.pageSize} onChange={pg.setPageSize} />
        {pg.pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => pg.setPage(Math.max(0, pg.page - 1))} disabled={pg.page === 0} aria-label="Sebelumnya"
              className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-700">
              <ChevronLeft size={14} />
            </button>
            {nomor.map((i, idx) => (
              <span key={i} className="flex items-center">
                {idx > 0 && nomor[idx - 1] !== i - 1 && <span className="px-1 text-xs font-semibold text-slate-300 dark:text-slate-600">…</span>}
                <button type="button" onClick={() => pg.setPage(i)}
                  className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold transition-colors ${i === pg.page ? "bg-[#3E03B3] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"}`}>
                  {i + 1}
                </button>
              </span>
            ))}
            <button type="button" onClick={() => pg.setPage(Math.min(pg.pageCount - 1, pg.page + 1))} disabled={pg.page >= pg.pageCount - 1} aria-label="Berikutnya"
              className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-700">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
