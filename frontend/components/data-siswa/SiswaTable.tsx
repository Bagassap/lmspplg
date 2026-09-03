"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { SiswaTableHead, SiswaTableRow, GRID_COLS } from "./SiswaTableRow";
import { SiswaDetailModal } from "./SiswaDetailModal";
import { type SiswaCardData } from "./shared";
import { PageSizeToggle, paginate } from "@/components/shared/PageSizeToggle";

type ActionProps = {
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
  onViewDetail: (s: SiswaCardData) => void;
  onKeluarkan?: (s: SiswaCardData) => void;
};

function LoadingSkeleton() {
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Users size={24} className="text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

function PaginationBar({ page, pageCount, start, end, total, onPage, pageSize, onPageSize }: {
  page: number; pageCount: number; start: number; end: number; total: number; onPage: (p: number) => void;
  pageSize: number; onPageSize: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-700/40">
      <span className="text-xs text-slate-400 dark:text-slate-500">{start}–{end} dari {total}</span>
      <div className="flex items-center gap-2.5">
        <PageSizeToggle value={pageSize} onChange={onPageSize} />
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => onPage(page - 1)} disabled={page === 0}
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
                  <button onClick={() => onPage(i)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      i === page
                        ? "bg-[#0082FB] text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}>
                    {i + 1}
                  </button>
                </span>
              ))}
            <button onClick={() => onPage(page + 1)} disabled={page >= pageCount - 1}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-700">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SiswaTable({
  loading, siswas, onEdit, onResetPassword, onImpersonate, onKeluarkan,
}: Omit<ActionProps, "onViewDetail"> & {
  loading: boolean;
  siswas: SiswaCardData[];
}) {
  const [detailSiswa, setDetailSiswa] = useState<SiswaCardData | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  useEffect(() => setPage(0), [siswas]);
  const actions: ActionProps = { onEdit, onResetPassword, onImpersonate, onViewDetail: setDetailSiswa, onKeluarkan };

  const { pageItems, pageCount, start, end } = paginate(siswas, page, pageSize);

  const content = (() => {
    if (loading) return <LoadingSkeleton />;
    if (siswas.length === 0) return <EmptyState message="Tidak ada siswa yang ditemukan" />;

    return (
      <>
        <div className="overflow-x-auto">
          <div className="min-w-160">
            <SiswaTableHead />
            <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {pageItems.map((s, i) => (
                <SiswaTableRow key={s.id} siswa={s} index={start - 1 + i} {...actions} />
              ))}
            </div>
          </div>
        </div>
        <PaginationBar page={page} pageCount={pageCount} start={start} end={end} total={siswas.length} onPage={setPage}
          pageSize={pageSize} onPageSize={(n) => { setPageSize(n); setPage(0); }} />
      </>
    );
  })();

  return (
    <>
      {content}
      {detailSiswa && (
        <SiswaDetailModal
          siswa={detailSiswa}
          onEdit={onEdit ? () => { onEdit(detailSiswa); setDetailSiswa(null); } : undefined}
          onClose={() => setDetailSiswa(null)}
        />
      )}
    </>
  );
}
