"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Search, Plus, Pencil, Trash2, Send, CalendarClock, GraduationCap, Code2, ListChecks, PenLine,
  SlidersHorizontal, CheckCircle, X, ChevronRight,
} from "lucide-react";
import { MobileDetailModal } from "@/components/shared/MobileDetailModal";
import { formatTgl, isTugasActive, tipeLabel } from "./types";
import type { TugasItem, TugasSubmisiItem } from "./types";
import { AppDetailSheet, AppCard, AppEmpty, AppTabs } from "@/components/app/AppUI";
import { icon3dStyle, toneAt } from "@/components/shared/Icon3D";
import { useIsAppMode } from "@/lib/pwaInstall";

function chunkOf4<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 4) out.push(items.slice(i, i + 4));
  return out;
}

const TIPE_BADGE: Record<string, { icon: typeof Code2; cls: string }> = {
  PRAKTIK: { icon: Code2, cls: "bg-[#F6FEE8] text-[#48700B] dark:bg-slate-700 dark:text-[#C4B5FD]" },
  PILIHAN_GANDA: { icon: ListChecks, cls: "bg-[#FFFFFF] text-[#000000] dark:bg-slate-700 dark:text-[#C4B5FD]" },
  ESSAY: { icon: PenLine, cls: "bg-[#F1EDFA] text-[#2D0281] dark:bg-slate-700 dark:text-[#8F6DD3]" },
};

const ROW_PALETTES = [
  { bar: "#3E03B3", gradient: "#3E03B3" },
  { bar: "#F26A3D", gradient: "#F26A3D" },
  { bar: "#F26A3D", gradient: "#F26A3D" },
  { bar: "#F26A3D", gradient: "#F26A3D" },
  { bar: "#0EA5E9", gradient: "#0EA5E9" },
];
function rowPalette(i: number) { return ROW_PALETTES[i % ROW_PALETTES.length]; }

export function TugasListCard({
  tugasList, submisiList, loading, onAddTugas, onEditTugas, onDeleteTugas, onLihatSubmisi,
  currentUserId, currentUserRole, canCreate = true,
  mobileNative = false, search: controlledSearch, onSearchChange: controlledOnSearchChange,
}: {
  tugasList: TugasItem[];
  submisiList: TugasSubmisiItem[];
  loading: boolean;
  onAddTugas: () => void;
  onEditTugas: (t: TugasItem) => void;
  onDeleteTugas: (id: string) => void;
  onLihatSubmisi: (t: TugasItem) => void;
  currentUserId?: string;
  currentUserRole?: string;
  canCreate?: boolean;
  mobileNative?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
}) {
  const appMode = useIsAppMode();
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch ?? internalSearch;
  const setSearch = controlledOnSearchChange ?? setInternalSearch;
  const [mapelFilter, setMapelFilter] = useState<string | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [detailItem, setDetailItem] = useState<TugasItem | null>(null);
  const canEdit = (t: TugasItem) => !currentUserRole || currentUserRole === "ADMIN" || t.createdBy.id === currentUserId;

  const uniqueMapel = useMemo(() => Array.from(new Set(tugasList.map((t) => t.mapel))).sort(), [tugasList]);

  const active = tugasList.filter((t) => isTugasActive(t));
  const completed = tugasList.filter((t) => !isTugasActive(t));
  const shown = (tab === "active" ? active : completed)
    .filter((t) => !mapelFilter || t.mapel === mapelFilter)
    .filter((t) => t.judul.toLowerCase().includes(search.trim().toLowerCase()) || t.mapel.toLowerCase().includes(search.trim().toLowerCase()));
  const chunked = useMemo(() => chunkOf4(shown), [shown]);

  return (
    <div className="min-w-0">
    <div className="hidden flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden lg:flex">
      <div className="px-5 pt-5 pb-0" style={{ background: "#F1F5F9" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F26A3D" }}>
              <ClipboardList size={14} className="text-[#000000] dark:text-[#C4B5FD]" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">Daftar Tugas</p>
          </div>
          {canCreate && (
            <button onClick={onAddTugas}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl shadow-sm"
              style={{ background: "#F26A3D", color: "#FFFFFF" }}>
              <Plus size={13} /> Tambah Tugas
            </button>
          )}
        </div>
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tugas atau mapel..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#F26A3D] focus:ring-2 focus:ring-[#FFFFFF] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:ring-[#000000]/30" />
        </div>
        <div className="flex gap-6 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setTab("active")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === "active" ? "border-[#00AAFA] text-[#3E03B3] dark:text-[#8F6DD3]" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
            Aktif
            {tab === "active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{ backgroundColor: "#3E03B3" }}>{active.length}</span>}
          </button>
          <button onClick={() => setTab("completed")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === "completed" ? "border-[#F26A3D] text-[#5D900F] dark:text-[#C4B5FD]" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
            Selesai
            {tab === "completed" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{ backgroundColor: "#F26A3D" }}>{completed.length}</span>}
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto">
        {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Memuat data...</div>}
        {!loading && shown.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">{search.trim() ? `Tidak ada tugas dengan nama "${search.trim()}"` : tab === "active" ? "Tidak ada tugas aktif" : "Tidak ada tugas selesai"}</p>
          </div>
        )}
        {!loading && shown.length > 0 && (
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-700/40 dark:bg-slate-700">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tugas</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Mapel</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Kelas Target</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Deadline</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Terkumpul</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t, idx) => {
                const rp = rowPalette(idx);
                const cnt = submisiList.filter((s) => s.tugasId === t.id).length;
                return (
                  <tr key={t.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-600">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: rp.gradient }}>
                          <span className="text-xs font-bold" style={{ color: rp.gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF" }}>{idx + 1}</span>
                        </div>
                        <p className="max-w-[180px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.judul}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          <GraduationCap size={10} /> {t.mapel}
                        </span>
                        {TIPE_BADGE[t.tipe] && (
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${TIPE_BADGE[t.tipe].cls}`}>
                            {(() => { const Icon = TIPE_BADGE[t.tipe].icon; return <Icon size={10} />; })()} {tipeLabel(t.tipe)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {t.kelasList.length ? (
                        <div className="flex flex-wrap gap-1">
                          {t.kelasList.map((k) => (
                            <span key={k.id} className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {k.nama}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "Semua Kelas"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><CalendarClock size={11} />{formatTgl(t.deadline)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-xs font-bold" style={{ color: rp.bar }}>{cnt} siswa</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onLihatSubmisi(t)}
                          className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all"
                          style={{ borderColor: rp.bar, color: rp.bar, backgroundColor: "#F1F5F9" }}>
                          <Send size={11} /> Lihat
                          {cnt > 0 && <span className="rounded-lg px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: rp.bar }}>{cnt}</span>}
                        </button>
                        {canEdit(t) && (
                          <>
                            <button onClick={() => onEditTugas(t)}
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => onDeleteTugas(t.id)}
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-[#F6FEE8] hover:text-[#5D900F] hover:dark:text-[#C4B5FD] dark:hover:bg-slate-600">
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>

    {mobileNative && appMode && (
      <div className="space-y-4 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{shown.length} tugas</span>
          {canCreate && (
            <button type="button" onClick={onAddTugas}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white active:scale-95"
              style={{ background: "#3E03B3" }}>
              <Plus size={14} /> Tambah
            </button>
          )}
        </div>

        <AppTabs
          tabs={[["active", `Aktif (${active.length})`], ["completed", `Selesai (${completed.length})`]] as const}
          value={tab} onChange={setTab} layoutId="app-tugas-guru-tab" />

        {uniqueMapel.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[null, ...uniqueMapel].map((mp) => (
              <button key={mp ?? "all"} type="button" onClick={() => setMapelFilter(mp)}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                style={mapelFilter === mp ? { background: "#3E03B3", color: "#fff" } : { background: "#F1F5F9", color: "#475569" }}>
                {mp ?? "Semua"}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />)}</div>
        ) : shown.length === 0 ? (
          <AppEmpty icon={ClipboardList} title={search.trim() ? `Tidak ada tugas dengan nama "${search.trim()}"` : tab === "active" ? "Tidak ada tugas aktif" : "Tidak ada tugas selesai"} />
        ) : (
          <ul className="space-y-3">
            {shown.map((t, i) => {
              const cnt = submisiList.filter((s) => s.tugasId === t.id).length;
              const Icon = TIPE_BADGE[t.tipe]?.icon ?? ClipboardList;
              return (
                <li key={t.id}>
                  <AppCard onClick={() => setDetailItem(t)} className="flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(toneAt(i + 2))}>
                      <Icon size={26} color="#fff" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{t.judul}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">{t.mapel}</span><span>•</span><span className="shrink-0">{formatTgl(t.deadline)}</span>
                      </p>
                    </div>
                    {cnt > 0 && (
                      <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold text-white" style={{ backgroundColor: "#3E03B3" }}>{cnt}</span>
                    )}
                    <ChevronRight size={18} className="shrink-0 text-slate-300" />
                  </AppCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    )}

    {mobileNative && !appMode && (
      <div className="relative isolate space-y-3 lg:hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-1 dark:border-slate-700">
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setTab("active")}
              className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors ${tab === "active" ? "text-[#3E03B3] dark:text-[#8F6DD3]" : "text-[#94a3b8]"}`}
              style={{ borderColor: tab === "active" ? "#3E03B3" : "transparent" }}>
              Aktif
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tab === "active" ? "text-[#3E03B3] dark:text-[#8F6DD3]" : "text-[#94a3b8]"}`}
                style={{ background: tab === "active" ? "#3E03B318" : "#E2E8F0" }}>
                {active.length}
              </span>
            </button>
            <button type="button" onClick={() => setTab("completed")}
              className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors ${tab === "completed" ? "text-[#5D900F] dark:text-[#C4B5FD]" : "text-[#94a3b8]"}`}
              style={{ borderColor: tab === "completed" ? "#F26A3D" : "transparent" }}>
              Selesai
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tab === "completed" ? "text-[#5D900F] dark:text-[#C4B5FD]" : "text-[#94a3b8]"}`}
                style={{ background: tab === "completed" ? "#F26A3D18" : "#E2E8F0" }}>
                {completed.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {uniqueMapel.length > 1 && (
              <button type="button" onClick={() => setShowFilterSheet(true)}
                className={`relative -mb-px mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${mapelFilter ? "text-[#3E03B3] dark:text-[#8F6DD3]" : "text-[#94a3b8]"}`}
                style={{ background: mapelFilter ? "#3E03B318" : "#FFFFFF" }}>
                <SlidersHorizontal size={14} />
                {mapelFilter && <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-white" style={{ background: "#3E03B3" }} />}
              </button>
            )}
            {canCreate && (
              <button type="button" onClick={onAddTugas}
                className="mb-1.5 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                style={{ background: "#F26A3D", color: "#FFFFFF" }}>
                <Plus size={13} /> Tambah
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="rounded-3xl bg-white py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1E293B]">
            <p className="text-sm text-slate-400">Memuat data...</p>
          </div>
        )}
        {!loading && shown.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1E293B]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#F1F5F9" }}>
              <ClipboardList size={24} className="text-[#5D900F] dark:text-[#C4B5FD]" />
            </div>
            <p className="mt-4 text-sm text-slate-400">{search.trim() ? `Tidak ada tugas dengan nama "${search.trim()}"` : tab === "active" ? "Tidak ada tugas aktif" : "Tidak ada tugas selesai"}</p>
          </div>
        )}
        {!loading && shown.length > 0 && (
          <div className="space-y-2.5">
            {chunked.map((group, gi) => (
              <motion.div key={gi}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: gi * 0.05 }}
                className="divide-y divide-slate-100 overflow-hidden rounded-[22px] bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.10)] dark:divide-slate-700/50 dark:bg-[#1E293B]">
                {group.map((t) => {
                  const cnt = submisiList.filter((s) => s.tugasId === t.id).length;
                  return (
                    <button key={t.id} type="button" onClick={() => setDetailItem(t)}
                      className="flex w-full items-center gap-3 p-4 text-left">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "#F1F5F9" }}>
                        {(() => { const Icon = TIPE_BADGE[t.tipe]?.icon ?? ClipboardList; return <Icon size={18} style={{ color: "#3E03B3" }} />; })()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{t.judul}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            <GraduationCap size={9} /> {t.mapel}
                          </span>
                          <span className="flex items-center gap-1 text-[9.5px] font-medium text-slate-500 dark:text-slate-400">
                            <CalendarClock size={9} />{formatTgl(t.deadline)}
                          </span>
                        </div>
                      </div>
                      {cnt > 0 && (
                        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: "#3E03B3" }}>
                          {cnt}
                        </span>
                      )}
                      <ChevronRight size={15} className="shrink-0 text-slate-300 dark:text-slate-600" />
                    </button>
                  );
                })}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )}

    <AnimatePresence>
      {detailItem && !appMode && (() => {
        const cnt = submisiList.filter((s) => s.tugasId === detailItem.id).length;
        return (
          <MobileDetailModal onClose={() => setDetailItem(null)} accent="#3E03B3">
            <div className="relative px-6 pb-6 pt-10 text-center">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/8" />
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/25 shadow-lg">
                {(() => { const Icon = TIPE_BADGE[detailItem.tipe]?.icon ?? ClipboardList; return <Icon size={24} className="text-white" />; })()}
              </div>
              <h2 className="relative mt-3 text-lg font-extrabold text-white">{detailItem.judul}</h2>
              <p className="relative mt-1 text-sm text-white/80">{detailItem.mapel} · {tipeLabel(detailItem.tipe)}</p>
            </div>

            <div className="relative mx-auto max-w-md space-y-2 px-6 text-left">
              <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <span className="text-xs font-semibold text-white/70">Deadline</span>
                <span className="text-xs font-bold text-white">{formatTgl(detailItem.deadline)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <span className="text-xs font-semibold text-white/70">Terkumpul</span>
                <span className="text-xs font-bold text-white">{cnt} siswa</span>
              </div>
              {detailItem.kelasList.length > 0 && (
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Kelas Target</span>
                  <div className="flex flex-wrap gap-1">
                    {detailItem.kelasList.map((k) => (
                      <span key={k.id} className="rounded-lg bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">{k.nama}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex flex-col gap-2 px-6 pb-6 pt-4">
              <button type="button" onClick={() => { setDetailItem(null); onLihatSubmisi(detailItem); }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-extrabold text-[#3E03B3] shadow-lg">
                <Send size={16} /> Lihat Submisi{cnt > 0 ? ` (${cnt})` : ""}
              </button>
              {canEdit(detailItem) && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => { onEditTugas(detailItem); setDetailItem(null); }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 py-3 text-sm font-bold text-white">
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => { onDeleteTugas(detailItem.id); setDetailItem(null); }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 py-3 text-sm font-bold text-white">
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              )}
            </div>
          </MobileDetailModal>
        );
      })()}
    </AnimatePresence>

    <AnimatePresence>
      {detailItem && appMode && (() => {
        const cnt = submisiList.filter((s) => s.tugasId === detailItem.id).length;
        const Icon = TIPE_BADGE[detailItem.tipe]?.icon ?? ClipboardList;
        return (
          <AppDetailSheet
            onClose={() => setDetailItem(null)}
            icon={Icon}
            tone="emerald"
            title={detailItem.judul}
            subtitle={`${detailItem.mapel} · ${tipeLabel(detailItem.tipe)}`}
            rows={[
              { label: "Deadline", value: formatTgl(detailItem.deadline) },
              { label: "Terkumpul", value: `${cnt} siswa` },
            ]}
            chips={{ label: "Kelas Target", values: detailItem.kelasList.map((k) => k.nama) }}
            primary={{ label: `Lihat Submisi${cnt > 0 ? ` (${cnt})` : ""}`, icon: Send, onClick: () => { const t = detailItem; setDetailItem(null); onLihatSubmisi(t); } }}
            secondary={canEdit(detailItem) ? [
              { label: "Edit", icon: Pencil, onClick: () => { onEditTugas(detailItem); setDetailItem(null); } },
              { label: "Hapus", icon: Trash2, danger: true, onClick: () => { onDeleteTugas(detailItem.id); setDetailItem(null); } },
            ] : []}
          />
        );
      })()}
    </AnimatePresence>

    <AnimatePresence>
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFilterSheet(false)}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 w-full overflow-hidden rounded-t-3xl bg-white dark:bg-[#1E293B]"
            style={{ maxHeight: "80vh" }}
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Filter Mata Pelajaran</h3>
              <button type="button" onClick={() => setShowFilterSheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <X size={15} />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto px-5 py-5">
              <button type="button" onClick={() => { setMapelFilter(null); setShowFilterSheet(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors ${mapelFilter === null ? "text-[#3E03B3] dark:text-[#8F6DD3]" : "text-[#334155] dark:text-slate-300"}`}
                style={{ borderColor: mapelFilter === null ? "#3E03B3" : "#FFFFFF", background: mapelFilter === null ? "#3E03B318" : "transparent" }}>
                Semua Mapel
                {mapelFilter === null && <CheckCircle size={16} className="text-[#3E03B3] dark:text-[#8F6DD3]" />}
              </button>
              {uniqueMapel.map((mp) => (
                <button key={mp} type="button" onClick={() => { setMapelFilter(mp); setShowFilterSheet(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors ${mapelFilter === mp ? "text-[#3E03B3] dark:text-[#8F6DD3]" : "text-[#334155] dark:text-slate-300"}`}
                  style={{ borderColor: mapelFilter === mp ? "#3E03B3" : "#FFFFFF", background: mapelFilter === mp ? "#3E03B318" : "transparent" }}>
                  {mp}
                  {mapelFilter === mp && <CheckCircle size={16} className="text-[#3E03B3] dark:text-[#8F6DD3]" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
}
