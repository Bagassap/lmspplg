"use client";

import { useState } from "react";
import {
  ClipboardList, Search, Send, CheckCircle, AlertCircle, CalendarClock, GraduationCap, Code2, ListChecks, PenLine, Download,
} from "lucide-react";
import { formatTgl, isTugasActive, tipeLabel } from "./types";
import type { TugasItem, TugasSubmisiItem } from "./types";

const TIPE_BADGE: Record<string, { icon: typeof Code2; cls: string }> = {
  PRAKTIK: { icon: Code2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  PILIHAN_GANDA: { icon: ListChecks, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  ESSAY: { icon: PenLine, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
};

const ROW_PALETTES = [
  { bar: "#0082FB", gradient: "linear-gradient(135deg,#0082FB,#0064E0)" },
  { bar: "#00D67F", gradient: "linear-gradient(135deg,#00D67F,#0064E0)" },
  { bar: "#EF4444", gradient: "linear-gradient(135deg,#EF4444,#0082FB)" },
  { bar: "#F59E0B", gradient: "linear-gradient(135deg,#F59E0B,#EF4444)" },
  { bar: "#0064E0", gradient: "linear-gradient(135deg,#0064E0,#0082FB)" },
];
function rowPalette(i: number) { return ROW_PALETTES[i % ROW_PALETTES.length]; }

export function TugasListCardSiswa({
  tugasList, loading, onKumpulkan, onLihatDetail,
}: {
  tugasList: TugasItem[];
  loading: boolean;
  onKumpulkan: (t: TugasItem) => void;
  onLihatDetail: (s: TugasSubmisiItem, t: TugasItem) => void;
}) {
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [search, setSearch] = useState("");

  const active = tugasList.filter((t) => isTugasActive(t));
  const completed = tugasList.filter((t) => !isTugasActive(t));
  const shown = (tab === "active" ? active : completed)
    .filter((t) => t.judul.toLowerCase().includes(search.trim().toLowerCase()) || t.mapel.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="px-5 pt-5 pb-0" style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.06) 0%,rgba(0,100,224,0.06) 50%,rgba(0,130,251,0.06) 100%)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F59E0B,#0064E0)" }}>
            <ClipboardList size={14} className="text-white" />
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">Daftar Tugas Saya</p>
        </div>
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tugas atau mapel..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:ring-amber-900/30" />
        </div>
        <div className="flex gap-5 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setTab("active")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === "active" ? "border-blue-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
            style={tab === "active" ? { color: "#0082FB" } : {}}>
            Aktif
            {tab === "active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: "#0082FB" }}>{active.length}</span>}
          </button>
          <button onClick={() => setTab("completed")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === "completed" ? "border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
            style={tab === "completed" ? { color: "#00D67F" } : {}}>
            Selesai
            {tab === "completed" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: "#00D67F" }}>{completed.length}</span>}
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto">
        {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Memuat data...</div>}
        {!loading && shown.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">{search.trim() ? `Tidak ada tugas dengan nama "${search.trim()}"` : "Belum ada tugas tersedia"}</p>
          </div>
        )}
        {!loading && shown.length > 0 && (
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-700/40 dark:bg-slate-700/60">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tugas</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Mapel</th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Deadline</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t, idx) => {
                const rp = rowPalette(idx);
                const mySubmisi = t.submisi?.[0];
                const isDiterima = mySubmisi?.status === "DITERIMA";
                const isRevisi = mySubmisi?.status === "REVISI";
                const isTerkirim = mySubmisi?.status === "TERKIRIM";
                const overdue = !isTugasActive(t) && !mySubmisi;

                const btn = isDiterima
                  ? { label: "Diterima", icon: <CheckCircle size={11} />, bg: "#E3FBF0", clr: "#00D67F", border: "#00D67F", onClick: () => onLihatDetail(mySubmisi!, t) }
                  : isRevisi
                  ? { label: "Revisi", icon: <AlertCircle size={11} />, bg: "#FFFBEB", clr: "#F59E0B", border: "#F59E0B", onClick: () => onLihatDetail(mySubmisi!, t) }
                  : isTerkirim
                  ? { label: "Terkirim", icon: <CheckCircle size={11} />, bg: "#EAF3FF", clr: "#0064E0", border: "#0064E0", onClick: () => onLihatDetail(mySubmisi!, t) }
                  : overdue
                  ? { label: "Terlambat", icon: <AlertCircle size={11} />, bg: "#FEE9EA", clr: "#EF4444", border: "#EF4444", onClick: () => onKumpulkan(t) }
                  : { label: t.tipe === "PILIHAN_GANDA" || t.tipe === "ESSAY" ? "Kerjakan" : t.tipe === "PRAKTIK" ? "Mulai Praktik" : "Kumpulkan", icon: <Send size={11} />, bg: "#E3FBF0", clr: "#00D67F", border: "#00D67F", onClick: () => onKumpulkan(t) };

                return (
                  <tr key={t.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: rp.gradient }}>
                          <span className="text-xs font-bold text-white">{idx + 1}</span>
                        </div>
                        <p className="max-w-[180px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.judul}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          <GraduationCap size={10} /> {t.mapel}
                        </span>
                        {TIPE_BADGE[t.tipe] && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${TIPE_BADGE[t.tipe].cls}`}>
                            {(() => { const Icon = TIPE_BADGE[t.tipe].icon; return <Icon size={10} />; })()} {tipeLabel(t.tipe)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><CalendarClock size={11} />{formatTgl(t.deadline)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {(t.tipe === "PILIHAN_GANDA" || t.tipe === "ESSAY") && mySubmisi?.nilai !== null && mySubmisi?.nilai !== undefined && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                            Nilai {mySubmisi.nilai}
                          </span>
                        )}
                        {t.fileUrl && (
                          <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" title={`Unduh lampiran${t.fileName ? `: ${t.fileName}` : ""}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20">
                            <Download size={14} />
                          </a>
                        )}
                        <button onClick={btn.onClick}
                          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-95"
                          style={{ borderColor: btn.border, color: btn.clr, backgroundColor: btn.bg }}>
                          {btn.icon}{btn.label}
                        </button>
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
  );
}
