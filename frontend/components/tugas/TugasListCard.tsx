"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Search, Plus, Pencil, Trash2, Send, CalendarClock, GraduationCap, Code2, ListChecks, PenLine,
  SlidersHorizontal, CheckCircle, X,
} from "lucide-react";
import { formatTgl, isTugasActive, tipeLabel } from "./types";
import type { TugasItem, TugasSubmisiItem } from "./types";

const TIPE_BADGE: Record<string, { icon: typeof Code2; cls: string }> = {
  PRAKTIK: { icon: Code2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  PILIHAN_GANDA: { icon: ListChecks, cls: "bg-[#F1F5F8] text-[#1C2B33] dark:bg-[#1C2B33]/40 dark:text-[#C3F84A]" },
  ESSAY: { icon: PenLine, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
};

const ROW_PALETTES = [
  { bar: "#0082FB", gradient: "#0082FB" },
  { bar: "#00D67F", gradient: "#00D67F" },
  { bar: "#EF4444", gradient: "#EF4444" },
  { bar: "#8A9E1F", gradient: "#C3F84A" },
  { bar: "#0064E0", gradient: "#0064E0" },
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
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch ?? internalSearch;
  const setSearch = controlledOnSearchChange ?? setInternalSearch;
  const [mapelFilter, setMapelFilter] = useState<string | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const canEdit = (t: TugasItem) => !currentUserRole || currentUserRole === "ADMIN" || t.createdBy.id === currentUserId;

  const uniqueMapel = useMemo(() => Array.from(new Set(tugasList.map((t) => t.mapel))).sort(), [tugasList]);

  const active = tugasList.filter((t) => isTugasActive(t));
  const completed = tugasList.filter((t) => !isTugasActive(t));
  const shown = (tab === "active" ? active : completed)
    .filter((t) => !mapelFilter || t.mapel === mapelFilter)
    .filter((t) => t.judul.toLowerCase().includes(search.trim().toLowerCase()) || t.mapel.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div>
    <div className="hidden flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden lg:flex">
      <div className="px-5 pt-5 pb-0" style={{ background: "rgba(0,130,251,0.05)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#C3F84A" }}>
              <ClipboardList size={14} className="text-[#1C2B33]" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">Daftar Tugas</p>
          </div>
          {canCreate && (
            <button onClick={onAddTugas}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl shadow-sm"
              style={{ background: "#C3F84A", color: "#1C2B33" }}>
              <Plus size={13} /> Tambah Tugas
            </button>
          )}
        </div>
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tugas atau mapel..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#C3F84A] focus:ring-2 focus:ring-[#F1F5F8] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:ring-[#1C2B33]/30" />
        </div>
        <div className="flex gap-6 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setTab("active")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === "active" ? "border-blue-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
            style={tab === "active" ? { color: "#0082FB" } : {}}>
            Aktif
            {tab === "active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{ backgroundColor: "#0082FB" }}>{active.length}</span>}
          </button>
          <button onClick={() => setTab("completed")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === "completed" ? "border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
            style={tab === "completed" ? { color: "#00D67F" } : {}}>
            Selesai
            {tab === "completed" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{ backgroundColor: "#00D67F" }}>{completed.length}</span>}
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
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-700/40 dark:bg-slate-700/60">
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
                  <tr key={t.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: rp.gradient }}>
                          <span className="text-xs font-bold" style={{ color: rp.gradient === "#C3F84A" ? "#1C2B33" : "#FFFFFF" }}>{idx + 1}</span>
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
                          style={{ borderColor: rp.bar, color: rp.bar, backgroundColor: `${rp.bar}14` }}>
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
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
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

    {mobileNative && (
      <div className="relative isolate space-y-3 lg:hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-1 dark:border-slate-700">
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setTab("active")}
              className="-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors"
              style={tab === "active" ? { borderColor: "#0082FB", color: "#0082FB" } : { borderColor: "transparent", color: "#94a3b8" }}>
              Aktif
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={tab === "active" ? { background: "#0082FB18", color: "#0082FB" } : { background: "#E2E8F0", color: "#94a3b8" }}>
                {active.length}
              </span>
            </button>
            <button type="button" onClick={() => setTab("completed")}
              className="-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors"
              style={tab === "completed" ? { borderColor: "#00D67F", color: "#00D67F" } : { borderColor: "transparent", color: "#94a3b8" }}>
              Selesai
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={tab === "completed" ? { background: "#00D67F18", color: "#00D67F" } : { background: "#E2E8F0", color: "#94a3b8" }}>
                {completed.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {uniqueMapel.length > 1 && (
              <button type="button" onClick={() => setShowFilterSheet(true)}
                className="relative -mb-px mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={mapelFilter ? { background: "#0082FB18", color: "#0082FB" } : { background: "#F1F5F9", color: "#94a3b8" }}>
                <SlidersHorizontal size={14} />
                {mapelFilter && <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-white" style={{ background: "#0082FB" }} />}
              </button>
            )}
            {canCreate && (
              <button type="button" onClick={onAddTugas}
                className="mb-1.5 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                style={{ background: "#C3F84A", color: "#1C2B33" }}>
                <Plus size={13} /> Tambah
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="rounded-3xl bg-white py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1C2B33]">
            <p className="text-sm text-slate-400">Memuat data...</p>
          </div>
        )}
        {!loading && shown.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1C2B33]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#C3F84A30" }}>
              <ClipboardList size={24} style={{ color: "#8A9E1F" }} />
            </div>
            <p className="mt-4 text-sm text-slate-400">{search.trim() ? `Tidak ada tugas dengan nama "${search.trim()}"` : tab === "active" ? "Tidak ada tugas aktif" : "Tidak ada tugas selesai"}</p>
          </div>
        )}
        {!loading && shown.length > 0 && (
          <div className="space-y-2.5">
            {shown.map((t, idx) => {
              const accent = idx % 2 === 0;
              const rp = rowPalette(idx);
              const cnt = submisiList.filter((s) => s.tugasId === t.id).length;
              return (
                <motion.div key={t.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className={`relative overflow-hidden rounded-[22px] p-4 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.10)] ${accent ? "" : "bg-white dark:bg-[#1C2B33]"}`}
                  style={accent ? { backgroundColor: "#0082FB" } : undefined}>
                  {accent && <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />}
                  <div className="relative flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold"
                      style={{ backgroundColor: accent ? "rgba(255,255,255,0.2)" : "#0082FB18", color: accent ? "#fff" : "#0082FB" }}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${accent ? "text-white" : "text-slate-800 dark:text-white"}`}>{t.judul}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[9.5px] font-semibold ${accent ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                          <GraduationCap size={9} /> {t.mapel}
                        </span>
                        {TIPE_BADGE[t.tipe] && (
                          <span className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[9.5px] font-bold ${accent ? "bg-white/20 text-white" : TIPE_BADGE[t.tipe].cls}`}>
                            {(() => { const Icon = TIPE_BADGE[t.tipe].icon; return <Icon size={9} />; })()} {tipeLabel(t.tipe)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`relative mt-3 flex items-center justify-between gap-2 border-t pt-3 ${accent ? "border-white/20" : "border-black/[0.06] dark:border-slate-700/50"}`}>
                    <span className={`flex shrink-0 items-center gap-1 text-[10.5px] ${accent ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                      <CalendarClock size={11} />{formatTgl(t.deadline)}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => onLihatSubmisi(t)}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10.5px] font-bold transition-all active:scale-95"
                        style={accent
                          ? { borderColor: "rgba(255,255,255,0.4)", color: "#fff", backgroundColor: "rgba(255,255,255,0.15)" }
                          : { borderColor: rp.bar, color: rp.bar, backgroundColor: `${rp.bar}14` }}>
                        <Send size={11} /> Lihat
                        {cnt > 0 && (
                          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={accent ? { backgroundColor: "#fff", color: "#0082FB" } : { backgroundColor: rp.bar, color: "#fff" }}>
                            {cnt}
                          </span>
                        )}
                      </button>
                      {canEdit(t) && (
                        <>
                          <button type="button" onClick={() => onEditTugas(t)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${accent ? "text-white/85 hover:bg-white/20" : "text-slate-400 hover:bg-[#F1F5F8] hover:text-[#8A9E1F] dark:hover:bg-[#1C2B33]/20"}`}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => onDeleteTugas(t.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${accent ? "text-white/85 hover:bg-white/20" : "text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"}`}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    )}

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
            className="relative z-10 w-full overflow-hidden rounded-t-3xl bg-white dark:bg-[#1C2B33]"
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
                className="flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors"
                style={mapelFilter === null ? { borderColor: "#0082FB", background: "#0082FB18", color: "#0082FB" } : { borderColor: "#F1F5F9", background: "transparent", color: "#334155" }}>
                Semua Mapel
                {mapelFilter === null && <CheckCircle size={16} style={{ color: "#0082FB" }} />}
              </button>
              {uniqueMapel.map((mp) => (
                <button key={mp} type="button" onClick={() => { setMapelFilter(mp); setShowFilterSheet(false); }}
                  className="flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors"
                  style={mapelFilter === mp ? { borderColor: "#0082FB", background: "#0082FB18", color: "#0082FB" } : { borderColor: "#F1F5F9", background: "transparent", color: "#334155" }}>
                  {mp}
                  {mapelFilter === mp && <CheckCircle size={16} style={{ color: "#0082FB" }} />}
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
