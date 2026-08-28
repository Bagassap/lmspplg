"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";
import { formatTglJam } from "./types";

export function TugasFileViewerModal({
  open, onClose, title, subtitle, fileUrl, fileName, catatan, submittedAt, isDone, onTerima, onRevisi,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fileUrl: string | null;
  fileName: string | null;
  catatan: string | null;
  submittedAt?: string;
  // isDone true = sudah diterima, sembunyikan aksi Terima/Revisi (read-only).
  isDone?: boolean;
  onTerima?: () => void;
  onRevisi?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800"
          >
            <div className="relative flex shrink-0 items-center gap-3 overflow-hidden px-6 py-4" style={{ background: "#0082FB" }}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FileText size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-extrabold text-white">{title}</h2>
                {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
              </div>
              <button onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-4 p-6">
              {fileUrl ? (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-4 transition-colors hover:border-[#0082FB]/40 hover:bg-[#0082FB]/5 dark:border-slate-600">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#0082FB]">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{fileName ?? "File jawaban"}</p>
                    {submittedAt && <p className="text-xs text-slate-400">Dikumpulkan {formatTglJam(submittedAt)}</p>}
                  </div>
                  <Download size={16} className="shrink-0 text-[#0082FB]" />
                </a>
              ) : (
                <p className="py-6 text-center text-sm text-slate-400">Belum ada file yang diunggah.</p>
              )}
              {catatan && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold text-slate-400">Catatan Siswa</p>
                  <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-700/40 dark:text-slate-200">
                    {catatan}
                  </p>
                </div>
              )}
            </div>

            {!isDone && (onTerima || onRevisi) && (
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
                {onRevisi && (
                  <button onClick={onRevisi}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-transform hover:scale-[1.03]"
                    style={{ background: "#C3F84A", color: "#1C2B33" }}>
                    <AlertCircle size={14} /> Minta Revisi
                  </button>
                )}
                {onTerima && (
                  <button onClick={onTerima}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.03]"
                    style={{ background: "#00D67F" }}>
                    <CheckCircle size={14} /> Terima
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
