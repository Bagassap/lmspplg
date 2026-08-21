"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Users, AlertTriangle, Clock } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor, toTitleCase } from "@/components/data-siswa/shared";
import { STATUS_CFG } from "@/components/absensi-harian/shared";
import type { MonitoringRow } from "./monitoring-types";

const PAGE_SIZE = 10;

function fmtTgl(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

function aktivitasLabel(row: MonitoringRow): { text: string; danger: boolean } {
  if (row.lastAktivitas === null) {
    return row.hariBerjalan > 0 ? { text: "Belum pernah absen", danger: true } : { text: "Baru mulai", danger: false };
  }
  const hari = row.hariSejakAktivitas ?? 0;
  if (hari <= 0) return { text: "Hari ini", danger: false };
  if (hari === 1) return { text: "1 hari lalu", danger: hari >= 3 };
  return { text: `${hari} hari lalu`, danger: hari >= 3 };
}

export function MonitoringTable({ loading, rows, showPembimbing = false }: {
  loading: boolean; rows: MonitoringRow[]; showPembimbing?: boolean;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageItems = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const start = rows.length ? page * PAGE_SIZE + 1 : 0;
  const end = Math.min((page + 1) * PAGE_SIZE, rows.length);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {loading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Users size={24} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Tidak ada penempatan PKL aktif yang ditemukan</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-235 text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-700/20">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Siswa</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Tempat PKL{showPembimbing ? " & Pembimbing" : ""}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Mulai PKL</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Kehadiran</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Aktivitas Terakhir</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const nama = toTitleCase(r.siswa.nama ?? "—");
                  const aktivitas = aktivitasLabel(r);
                  const pctColor = r.persentaseKehadiran >= 70 ? STATUS_CFG.HADIR.clr : STATUS_CFG.ALPA.clr;
                  return (
                    <tr key={r.penempatanId} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={r.siswa.fotoProfil} nama={nama} sizePx={36} fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{nama}</p>
                            <p className="font-mono text-xs text-slate-400 dark:text-slate-500">{r.siswa.nis}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.tempatMagang.namaTempat}</p>
                        {showPembimbing && (
                          <p className="text-[11px] text-slate-400">Pembimbing: {r.guruPembimbing.nama ? toTitleCase(r.guruPembimbing.nama) : "—"}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {fmtTgl(r.tanggalMulai)}
                        <p className="text-[10px] text-slate-400">{r.hariBerjalan} hari efektif berjalan</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: pctColor }}>{r.persentaseKehadiran}%</span>
                          <div className="h-1.5 w-20 rounded-full bg-slate-100 dark:bg-slate-700">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, r.persentaseKehadiran)}%`, backgroundColor: pctColor }} />
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          H{r.rekap.HADIR} · I{r.rekap.IZIN} · S{r.rekap.SAKIT} · A{r.rekap.ALPA}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          aktivitas.danger ? "bg-red-50 text-red-500 dark:bg-red-900/20" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                        }`}>
                          <Clock size={10} /> {aktivitas.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {r.perluPerhatian ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                            <AlertTriangle size={10} /> Perlu Perhatian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: "#E3FBF0", color: "#00D67F" }}>
                            Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700/40">
              <span className="text-xs text-slate-400 dark:text-slate-500">{start}–{end} dari {rows.length}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{page + 1}/{pageCount}</span>
                <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
