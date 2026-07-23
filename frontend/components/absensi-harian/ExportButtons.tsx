"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FileSpreadsheet, Loader2, X, Search, User, Download } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { getInitials, avatarColor, formatTgl, MONTH_NAMES } from "./shared";
import type { ExportRange, ExportRangeMode } from "./shared";
import type { UseExportRangeResult } from "./useExportRange";
import {
  downloadAbsensiPdf, downloadAbsensiPdfSiswa, downloadAbsensiExcel, downloadAbsensiExcelSiswa,
} from "./downloadAbsensiPdf";
import type { SiswaAbsensi } from "./types";

const RANGE_MODES: { key: ExportRangeMode; label: string }[] = [
  { key: "harian", label: "Per Hari" },
  { key: "mingguan", label: "Per Minggu" },
  { key: "bulanan", label: "Per Bulan" },
];

const selectCls = "rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400";

/** Per Hari / Per Minggu / Per Bulan tabs + the matching inline picker. Rendered next to the download buttons (or next to Tanggal, when the card wraps to 2 rows) — kept separate from ExportButtons so callers can place the two independently in the filter card's layout. */
export function RangeModeToggle({ rangeMode, setRangeMode, weekAnchor, setWeekAnchor, bulan, setBulan, tahun, setTahun, weekRange }: UseExportRangeResult) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="inline-flex shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
        {RANGE_MODES.map((m, i) => (
          <button key={m.key} type="button" onClick={() => setRangeMode(m.key)}
            className={`px-2 py-1.5 text-[11px] font-bold transition-colors ${i > 0 ? "border-l border-slate-200 dark:border-slate-600" : ""} ${
              rangeMode === m.key
                ? "bg-violet-500 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {rangeMode === "mingguan" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input type="date" value={weekAnchor} onChange={(e) => setWeekAnchor(e.target.value)} className={selectCls} />
          <span className="text-[11px] text-slate-400">
            {formatTgl(weekRange.start)} – {formatTgl(weekRange.end)}
          </span>
        </div>
      )}

      {rangeMode === "bulanan" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className={selectCls}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={selectCls}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

type ExportKind = "pdf-kelas" | "pdf-siswa" | "excel-kelas" | "excel-siswa";

function SiswaPickerModal({ siswaList, title, accent, onPick, onClose }: {
  siswaList: SiswaAbsensi[]; title: string; accent: string;
  onPick: (s: SiswaAbsensi) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return siswaList;
    return siswaList.filter(
      (s) => s.nama.toLowerCase().includes(query) || (s.nis ?? "").toLowerCase().includes(query),
    );
  }, [q, siswaList]);

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}20` }}>
              <User size={16} style={{ color: accent }} />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700/50">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau NIS..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-xs font-semibold text-slate-400">Tidak ada siswa ditemukan</p>
          ) : (
            filtered.map((s) => (
              <button key={s.siswaId} onClick={() => onPick(s)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: avatarColor(s.nama) }}>
                  {getInitials(s.nama)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{s.nama}</p>
                  <p className="text-[11px] text-slate-400">NIS: {s.nis ?? "-"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function ExportButtons({ kelasId, kelasNama, range, siswaList }: {
  kelasId: string; kelasNama: string; range: ExportRange; siswaList: SiswaAbsensi[];
}) {
  const toast = useToast();
  const [loadingKind, setLoadingKind] = useState<ExportKind | null>(null);
  const [picker, setPicker] = useState<"pdf" | "excel" | null>(null);

  const disabled = !kelasId || siswaList.length === 0;

  async function runKelasExport(kind: "pdf-kelas" | "excel-kelas") {
    if (disabled || loadingKind) return;
    setLoadingKind(kind);
    try {
      const result = kind === "pdf-kelas"
        ? await downloadAbsensiPdf({ kelasId, range, kelasNama })
        : await downloadAbsensiExcel({ kelasId, range, kelasNama });
      if (!result.ok) toast.error(kind === "pdf-kelas" ? "Gagal membuat PDF" : "Gagal membuat Excel", result.message);
    } finally {
      setLoadingKind(null);
    }
  }

  async function runSiswaExport(kind: "pdf-siswa" | "excel-siswa", s: SiswaAbsensi) {
    setPicker(null);
    setLoadingKind(kind);
    try {
      const result = kind === "pdf-siswa"
        ? await downloadAbsensiPdfSiswa({ siswaId: s.siswaId, range, siswaNama: s.nama })
        : await downloadAbsensiExcelSiswa({ siswaId: s.siswaId, range, siswaNama: s.nama });
      if (!result.ok) toast.error(kind === "pdf-siswa" ? "Gagal membuat PDF" : "Gagal membuat Excel", result.message);
    } finally {
      setLoadingKind(null);
    }
  }

  const PDF_STYLE = { backgroundColor: "#FFF0EE", color: "#DC2626", borderColor: "#DC262630" };
  const EXCEL_STYLE = { backgroundColor: "#E8F8F1", color: "#0F9D58", borderColor: "#0F9D5830" };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => runKelasExport("pdf-kelas")} disabled={disabled || !!loadingKind}
          className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={PDF_STYLE}>
          {loadingKind === "pdf-kelas" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
          PDF Per Kelas
        </button>
        <button type="button" onClick={() => setPicker("pdf")} disabled={disabled || !!loadingKind}
          className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={PDF_STYLE}>
          {loadingKind === "pdf-siswa" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
          PDF Per Siswa
        </button>
        <button type="button" onClick={() => runKelasExport("excel-kelas")} disabled={disabled || !!loadingKind}
          className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={EXCEL_STYLE}>
          {loadingKind === "excel-kelas" ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
          Excel Per Kelas
        </button>
        <button type="button" onClick={() => setPicker("excel")} disabled={disabled || !!loadingKind}
          className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={EXCEL_STYLE}>
          {loadingKind === "excel-siswa" ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
          Excel Per Siswa
        </button>
        <span title="Unduh Rekap Absensi" className="shrink-0">
          <Download size={14} className="text-slate-300 dark:text-slate-600" />
        </span>
      </div>

      <AnimatePresence>
        {picker && (
          <SiswaPickerModal
            siswaList={siswaList}
            title={picker === "pdf" ? "Pilih Siswa — Export PDF" : "Pilih Siswa — Export Excel"}
            accent={picker === "pdf" ? "#DC2626" : "#0F9D58"}
            onPick={(s) => runSiswaExport(picker === "pdf" ? "pdf-siswa" : "excel-siswa", s)}
            onClose={() => setPicker(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
