"use client";

import { motion } from "framer-motion";
import { Users, Eye, Camera, PenTool, ChevronLeft, ChevronRight } from "lucide-react";
import { PageSizeToggle } from "@/components/shared/PageSizeToggle";
import { StatusBadge } from "./StatusBadge";
import { STATUS_CFG, PULANG_CFG, getInitials, avatarColor, parseLokasi } from "./shared";
import type { SiswaAbsensi, StatusAbsensi, FilterAbsensi } from "./types";

const GRID_COLS = "28px 40px 2fr 1.2fr 2.4fr 1fr 1.4fr 60px 60px 96px";

type Props = {
  loading: boolean;
  hasSiswa: boolean;
  filteredSiswa: SiswaAbsensi[];
  pagedSiswa: SiswaAbsensi[];
  tableStart: number;
  tableEnd: number;
  activeFilter: FilterAbsensi | null;
  tablePage: number;
  setTablePage: React.Dispatch<React.SetStateAction<number>>;
  tablePageCount: number;
  tablePageSize: number;
  setTablePageSize: (n: number) => void;
  onOpenDokumen: (siswa: SiswaAbsensi, source: "hadir" | "pulang") => void;
  editable?: boolean;
  draft?: Record<string, StatusAbsensi>;
  onStatusChange?: (siswaId: string, status: StatusAbsensi) => void;
};

export function AbsensiHarianTable({
  loading, hasSiswa, filteredSiswa, pagedSiswa, tableStart, tableEnd, activeFilter,
  tablePage, setTablePage, tablePageCount, tablePageSize, setTablePageSize,
  onOpenDokumen, editable = false, draft, onStatusChange,
}: Props) {
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

  if (!hasSiswa) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Users size={24} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Belum ada siswa di kelas ini</p>
      </div>
    );
  }

  if (filteredSiswa.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Users size={24} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Tidak ada siswa dengan status ini</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-225">
          <div className="grid items-center gap-3 border-b border-slate-100 px-5 py-2.5 dark:border-slate-700/40"
            style={{ gridTemplateColumns: GRID_COLS }}>
            <span />
            <span />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nama</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">NIS</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</span>
            <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Waktu</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lokasi</span>
            <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Foto</span>
            <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">TTD</span>
            <span className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Aksi</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {pagedSiswa.map((s, idx) => {
              const ac = avatarColor(s.nama);
              const isPulangView = activeFilter === "PULANG";
              const waktu = isPulangView ? s.waktuPulang : s.waktuAbsen;
              const lokasiRaw = isPulangView ? s.lokasiPulang : s.lokasi;
              const fotoRaw = isPulangView ? s.fotoPulang : s.foto;
              const ttdRaw = isPulangView ? s.ttdPulang : s.ttd;
              const hasDok = !!(ttdRaw || lokasiRaw || fotoRaw);
              const lokasiParsed = parseLokasi(lokasiRaw);
              const cur = editable ? (draft?.[s.siswaId] ?? s.status) : s.status;
              const openDokumen = () => onOpenDokumen(s, isPulangView ? "pulang" : "hadir");
              return (
                <motion.div key={s.siswaId}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                  className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                  style={{ gridTemplateColumns: GRID_COLS }}>
                  <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{tableStart + idx}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-extrabold text-white shrink-0" style={{ backgroundColor: ac }}>
                    {getInitials(s.nama)}
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{s.nama}</p>
                  <p className="truncate text-sm font-semibold text-slate-600 dark:text-slate-300">{s.nis ?? "—"}</p>
                  {isPulangView ? (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: PULANG_CFG.bg, color: PULANG_CFG.clr }}>
                      <PULANG_CFG.icon size={10} /> Pulang
                    </span>
                  ) : editable ? (
                    <div className="flex gap-1">
                      {(["HADIR", "IZIN", "SAKIT", "ALPA"] as StatusAbsensi[]).map((st) => {
                        const cfg = STATUS_CFG[st];
                        const active = cur === st;
                        return (
                          <button key={st} onClick={() => onStatusChange?.(s.siswaId, st)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg border transition-all hover:scale-105"
                            style={{
                              backgroundColor: active ? cfg.bg : "transparent",
                              color: active ? cfg.clr : "#94a3b8",
                              borderColor: active ? cfg.clr + "60" : "#e2e8f040",
                            }}>
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <StatusBadge status={s.status} />
                  )}
                  <span className="text-center text-sm text-slate-500 dark:text-slate-400">{waktu ?? "—"}</span>
                  <div className="min-w-0">
                    {lokasiParsed ? (
                      <button onClick={openDokumen} title="Lihat lokasi absen"
                        className="block max-w-full truncate text-left text-[11px] text-blue-500 hover:underline">
                        {lokasiParsed.lat.slice(0, 8)}…
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-300">—</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {fotoRaw ? (
                      <button onClick={openDokumen} title="Lihat foto selfie"
                        className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        <Camera size={13} className="text-emerald-500" />
                      </button>
                    ) : <Camera size={13} className="text-slate-200 dark:text-slate-700" />}
                  </div>
                  <div className="flex justify-center">
                    {ttdRaw ? (
                      <button onClick={openDokumen} title="Lihat tanda tangan"
                        className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20">
                        <PenTool size={13} className="text-violet-500" />
                      </button>
                    ) : <PenTool size={13} className="text-slate-200 dark:text-slate-700" />}
                  </div>
                  <div className="flex justify-end">
                    {hasDok ? (
                      <button onClick={openDokumen}
                        className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
                        style={{ background: "linear-gradient(135deg,#6334F4,#4F8EF7)" }}>
                        <Eye size={11} /> Lihat
                      </button>
                    ) : <span />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      {filteredSiswa.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/40 px-5 py-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {tableStart}–{tableEnd} dari {filteredSiswa.length}
          </span>
          <div className="flex items-center gap-2.5">
            <PageSizeToggle value={tablePageSize} onChange={setTablePageSize} />
            {tablePageCount > 1 && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setTablePage((p) => Math.max(0, p - 1))} disabled={tablePage === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tablePage + 1}/{tablePageCount}</span>
                <button onClick={() => setTablePage((p) => Math.min(tablePageCount - 1, p + 1))} disabled={tablePage >= tablePageCount - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
