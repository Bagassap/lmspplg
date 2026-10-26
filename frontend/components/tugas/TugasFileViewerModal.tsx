"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download } from "lucide-react";
import { formatTglJam } from "./types";
import { icon3dStyle } from "@/components/shared/Icon3D";

export function TugasFileViewerModal({
  open, onClose, title, subtitle, fileUrl, fileName, catatan, submittedAt,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fileUrl: string | null;
  fileName: string | null;
  catatan: string | null;
  submittedAt?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-80 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:rounded-3xl"
          >
            <div className="flex shrink-0 items-center gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle("sky")}>
                <FileText size={20} color="#fff" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Tutup"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-6 sm:px-8">
              {fileUrl ? (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-3xl bg-[#F1EDFA] px-5 py-5 dark:bg-slate-700">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#3E03B3]">
                    <Download size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-slate-900 dark:text-white">{fileName ?? "File jawaban"}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {submittedAt ? `Dikumpulkan ${formatTglJam(submittedAt)}` : "Klik untuk membuka file"}
                    </p>
                  </div>
                </a>
              ) : (
                <p className="py-10 text-center text-base text-slate-500">Belum ada file yang diunggah.</p>
              )}
              {catatan && (
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Catatan siswa</p>
                  <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 px-5 py-4 text-base text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {catatan}
                  </p>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
