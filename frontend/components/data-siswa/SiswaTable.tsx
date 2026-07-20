"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { SiswaTableHead, SiswaTableRow } from "./SiswaTableRow";
import { KelasGroupHeader } from "./KelasGroupHeader";
import { SiswaDetailModal } from "./SiswaDetailModal";
import { type SiswaCardData } from "./shared";
import { PageSizeToggle, paginate } from "@/components/shared/PageSizeToggle";

type ActionProps = {
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
  onViewDetail: (s: SiswaCardData) => void;
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

function PaginationBar({ page, pageCount, start, end, total, onPage }: {
  page: number; pageCount: number; start: number; end: number; total: number; onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700/40">
      <span className="text-xs text-slate-400 dark:text-slate-500">{start}–{end} dari {total}</span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={page === 0}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{page + 1}/{pageCount}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= pageCount - 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function TableBody({ siswas, page, setPage, pageSize, ...actions }: ActionProps & {
  siswas: SiswaCardData[]; page: number; setPage: (p: number) => void; pageSize: number;
}) {
  const { pageItems, pageCount, start, end } = paginate(siswas, page, pageSize);
  const offset = Number.isFinite(pageSize) ? page * pageSize : 0;

  if (siswas.length === 0) {
    return <EmptyState message="Tidak ada siswa yang ditemukan" />;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-170">
          <SiswaTableHead />
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {pageItems.map((s, i) => (
              <SiswaTableRow key={s.id} siswa={s} index={offset + i} {...actions} />
            ))}
          </div>
        </div>
      </div>
      {pageCount > 1 && (
        <PaginationBar page={page} pageCount={pageCount} start={start} end={end} total={siswas.length} onPage={setPage} />
      )}
    </>
  );
}

function RowList({ siswas, pageSize, ...actions }: ActionProps & { siswas: SiswaCardData[]; pageSize: number }) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [pageSize]);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <TableBody siswas={siswas} page={page} setPage={setPage} pageSize={pageSize} {...actions} />
    </div>
  );
}

function KelasSection({
  kelas, siswas, pageSize, ...actions
}: ActionProps & { kelas: string; siswas: SiswaCardData[]; pageSize: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [pageSize]);
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
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <TableBody siswas={siswas} page={page} setPage={setPage} pageSize={pageSize} {...actions} />
        </div>
      )}
    </div>
  );
}

export function SiswaTable({
  loading, siswas, grouped, kelasNamaOrder, onEdit, onResetPassword, onImpersonate,
}: Omit<ActionProps, "onViewDetail"> & {
  loading: boolean;
  siswas: SiswaCardData[];
  grouped: boolean;
  kelasNamaOrder: string[];
}) {
  const [detailSiswa, setDetailSiswa] = useState<SiswaCardData | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const actions: ActionProps = { onEdit, onResetPassword, onImpersonate, onViewDetail: setDetailSiswa };

  const content = (() => {
    if (loading) {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <LoadingSkeleton />
        </div>
      );
    }

    if (siswas.length === 0) {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <EmptyState message="Tidak ada siswa yang ditemukan" />
        </div>
      );
    }

    if (!grouped) {
      return <RowList siswas={siswas} pageSize={pageSize} {...actions} />;
    }

    const groupedByKelas = kelasNamaOrder.reduce<Record<string, SiswaCardData[]>>((acc, k) => {
      acc[k] = siswas.filter((s) => s.kelas.nama === k);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        {kelasNamaOrder.filter((k) => (groupedByKelas[k]?.length ?? 0) > 0).map((k) => (
          <KelasSection key={k} kelas={k} siswas={groupedByKelas[k]} pageSize={pageSize} {...actions} />
        ))}
      </div>
    );
  })();

  return (
    <>
      {!loading && siswas.length > 0 && (
        <div className="mb-3 flex items-center justify-end gap-2">
          <span className="text-xs font-semibold text-slate-400">Tampilkan</span>
          <PageSizeToggle value={pageSize} onChange={setPageSize} />
        </div>
      )}
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
