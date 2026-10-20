"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Users, Building2, UserCheck } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor, toTitleCase } from "@/components/data-siswa/shared";
import { STATUS_PENEMPATAN_CFG } from "./types";
import type { PenempatanMagang, StatusPenempatan } from "./types";
import { useIsAppMode } from "@/lib/pwaInstall";
import { icon3dStyle, MENU_TONE } from "@/components/shared/Icon3D";

const PAGE_SIZE = 10;

export function PenempatanTable({
  loading, list, busyId, canManage = true, mobileNative = false, onUbahStatus, onEdit, onHapus, onTetapkanTempat,
}: {
  loading: boolean;
  list: PenempatanMagang[];
  busyId?: string | null;
  canManage?: boolean;
  mobileNative?: boolean;
  onUbahStatus?: (p: PenempatanMagang, status: StatusPenempatan) => void;
  onEdit?: (p: PenempatanMagang) => void;
  onHapus?: (p: PenempatanMagang) => void;
  onTetapkanTempat?: (rows: PenempatanMagang[]) => void;
}) {
  const app = useIsAppMode();
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [list]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageItems = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const start = list.length ? page * PAGE_SIZE + 1 : 0;
  const end = Math.min((page + 1) * PAGE_SIZE, list.length);

  // Baris judul per tempat: tampil di awal tiap kelompok tempat pada halaman ini.
  const barisTempat = (p: PenempatanMagang) => list.filter((x) => x.tempatMagang.id === p.tempatMagang.id && (x.status === "MENUNGGU" || x.status === "AKTIF"));
  const judulTempat = (p: PenempatanMagang, i: number, colSpan?: number) => {
    if (i > 0 && pageItems[i - 1].tempatMagang.id === p.tempatMagang.id) return null;
    const semua = list.filter((x) => x.tempatMagang.id === p.tempatMagang.id);
    const target = barisTempat(p);
    const tanpaGuru = target.filter((x) => !x.guruPembimbing).length;
    const isi = (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3E03B3] text-white"><Building2 size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{p.tempatMagang.namaTempat}</p>
          <p className="truncate text-[11px] text-slate-600 dark:text-slate-300">{semua.length} siswa · {tanpaGuru > 0 ? `${tanpaGuru} belum punya pembimbing` : "semua sudah punya pembimbing"}</p>
        </div>
        {canManage && onTetapkanTempat && target.length > 0 && (
          <button onClick={() => onTetapkanTempat(target)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#3E03B3] px-3.5 py-2 text-xs font-bold text-white">
            <UserCheck size={13} /> Tetapkan guru
          </button>
        )}
      </div>
    );
    if (colSpan) return <tr key={`h-${p.id}`}><td colSpan={colSpan} className="bg-[#F1EDFA] px-4 py-2.5 dark:bg-slate-700/40">{isi}</td></tr>;
    return <div key={`h-${p.id}`} className="rounded-2xl bg-[#F1EDFA] p-3 dark:bg-slate-700/40">{isi}</div>;
  };

  return (
    <div className={app && mobileNative ? "lg:overflow-hidden lg:rounded-3xl lg:border lg:border-slate-100 lg:bg-white lg:shadow-sm dark:lg:border-slate-700 dark:lg:bg-slate-800" : "overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"}>
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
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Users size={24} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Tidak ada penempatan yang ditemukan</p>
        </div>
      ) : (
        <>
          <div className={mobileNative ? "hidden overflow-x-auto lg:block" : "overflow-x-auto"}>
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-700/20">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Nama</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Kelas</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Tempat</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Pembimbing</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Status</th>
                  {canManage && (
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p, i) => {
                  const nama = toTitleCase(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
                  const cfg = STATUS_PENEMPATAN_CFG[p.status];
                  const busy = busyId === p.id;
                  return (
                    <Fragment key={p.id}>
                    {judulTempat(p, i, canManage ? 6 : 5)}
                    <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={p.siswa.user?.fotoProfil} nama={nama} sizePx={36} fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
                          <p className="whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">{nama}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{p.siswa.kelas.nama}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.tempatMagang.namaTempat}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.guruPembimbing ? toTitleCase(p.guruPembimbing.user.nama) : "Belum ditetapkan"}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {canManage ? (
                          <select value={p.status} disabled={busy} onChange={(e) => onUbahStatus?.(p, e.target.value as StatusPenempatan)}
                            className="rounded-lg border-0 px-2.5 py-1 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/30"
                            style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
                            <option value="MENUNGGU" disabled>Menunggu guru</option>
                            <option value="AKTIF">Aktif</option>
                            <option value="SELESAI">Selesai</option>
                            <option value="BATAL">Batal</option>
                          </select>
                        ) : (
                          <span className="rounded-lg px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
                            {cfg.label}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => onEdit?.(p)} disabled={busy}
                              className="flex items-center gap-1 rounded-lg bg-[#F1EDFA] px-2.5 py-1.5 text-xs font-bold text-[#3E03B3] shadow-sm transition-colors hover:bg-[#F1EDFA] disabled:opacity-40 dark:bg-[#000000]/20">
                              <Pencil size={12} /> Edit
                            </button>
                            <button onClick={() => onHapus?.(p)} disabled={busy}
                              className="flex items-center gap-1 rounded-lg bg-[#F6FEE8] px-2.5 py-1.5 text-xs font-bold text-[#5D900F] dark:text-[#A1F919] shadow-sm transition-colors hover:bg-[#F6FEE8] disabled:opacity-40 dark:bg-[#48700B]/20">
                              <Trash2 size={12} /> Hapus
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {mobileNative && app && (
            <ul className="space-y-3 lg:hidden">
              {pageItems.map((p, i) => {
                const nama = toTitleCase(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
                const cfg = STATUS_PENEMPATAN_CFG[p.status];
                const busy = busyId === p.id;
                return (
                  <Fragment key={p.id}>
                  {judulTempat(p, i)}
                  <li className="rounded-3xl bg-white p-3 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                    <div className="flex items-center gap-4">
                      <Avatar src={p.siswa.user?.fotoProfil} nama={nama} sizePx={56} fallbackBg={avatarColorFor(nama)} textClassName="text-sm font-extrabold" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{nama}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{p.siswa.kelas.nama}</p>
                        <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: cfg.bg, color: cfg.clr }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 rounded-2xl bg-slate-100 px-4 py-3 text-[12px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <p className="flex items-center gap-2 font-semibold"><Building2 size={13} className="shrink-0" />{p.tempatMagang.namaTempat}</p>
                      <p className="flex items-center gap-2"><UserCheck size={13} className="shrink-0" />{p.guruPembimbing ? toTitleCase(p.guruPembimbing.user.nama) : "Belum ditetapkan"}</p>
                    </div>
                    {canManage && (
                      <div className="mt-3 flex gap-2">
                        <select value={p.status} disabled={busy} onChange={(e) => onUbahStatus?.(p, e.target.value as StatusPenempatan)}
                          className="flex-1 rounded-full border-0 px-3 py-2.5 text-xs font-bold focus:outline-none" style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
                          <option value="MENUNGGU" disabled>Menunggu guru</option>
                            <option value="AKTIF">Aktif</option>
                          <option value="SELESAI">Selesai</option>
                          <option value="BATAL">Batal</option>
                        </select>
                        <button onClick={() => onEdit?.(p)} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold disabled:opacity-40" style={{ background: "#FFE9E2", color: "#F26A3D" }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => onHapus?.(p)} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-50 py-2.5 text-xs font-bold text-red-600 disabled:opacity-40">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    )}
                  </li>
                  </Fragment>
                );
              })}
            </ul>
          )}

          {mobileNative && !app && (
            <div className="divide-y divide-slate-100 p-2 lg:hidden dark:divide-slate-700/40">
              {pageItems.map((p, i) => {
                const nama = toTitleCase(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
                const cfg = STATUS_PENEMPATAN_CFG[p.status];
                const busy = busyId === p.id;
                return (
                  <Fragment key={p.id}>
                  {judulTempat(p, i)}
                  <div className="flex flex-col gap-2.5 p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={p.siswa.user?.fotoProfil} nama={nama} sizePx={38} fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{nama}</p>
                        <p className="truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">{p.siswa.kelas.nama}</p>
                      </div>
                      {canManage ? (
                        <select value={p.status} disabled={busy} onChange={(e) => onUbahStatus?.(p, e.target.value as StatusPenempatan)}
                          className="shrink-0 rounded-lg border-0 px-2 py-1 text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/30"
                          style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
                          <option value="MENUNGGU" disabled>Menunggu guru</option>
                            <option value="AKTIF">Aktif</option>
                          <option value="SELESAI">Selesai</option>
                          <option value="BATAL">Batal</option>
                        </select>
                      ) : (
                        <span className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
                          {cfg.label}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[50px] text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Building2 size={11} className="shrink-0" />{p.tempatMagang.namaTempat}</span>
                      <span className="flex items-center gap-1"><UserCheck size={11} className="shrink-0" />{p.guruPembimbing ? toTitleCase(p.guruPembimbing.user.nama) : "Belum ditetapkan"}</span>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1.5 pl-[50px]">
                        <button onClick={() => onEdit?.(p)} disabled={busy}
                          className="flex items-center gap-1 rounded-lg bg-[#F1EDFA] px-2.5 py-1.5 text-xs font-bold text-[#3E03B3] shadow-sm transition-colors hover:bg-[#F1EDFA] disabled:opacity-40 dark:bg-[#000000]/20">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => onHapus?.(p)} disabled={busy}
                          className="flex items-center gap-1 rounded-lg bg-[#F6FEE8] px-2.5 py-1.5 text-xs font-bold text-[#5D900F] dark:text-[#A1F919] shadow-sm transition-colors hover:bg-[#F6FEE8] disabled:opacity-40 dark:bg-[#48700B]/20">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                  </Fragment>
                );
              })}
            </div>
          )}

          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700/40">
              <span className="text-xs text-slate-400 dark:text-slate-500">{start}–{end} dari {list.length}</span>
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
