"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Download, Send, Code2, ListChecks, PenLine } from "lucide-react";
import type { TugasSubmisiItem } from "./types";
import { formatTglJam } from "./types";
import { TugasPraktikViewerModal } from "./TugasPraktikViewerModal";
import { TugasJawabanViewerModal } from "./TugasJawabanViewerModal";

export function SubmisiSayaModal({
  target, judul, tipe, onClose, onKirimUlang,
}: {
  target: TugasSubmisiItem | null;
  judul?: string;
  tipe?: string;
  onClose: () => void;
  onKirimUlang: () => void;
}) {
  const [viewCode, setViewCode] = useState(false);
  const [viewJawaban, setViewJawaban] = useState(false);
  if (!target) return null;
  const isDiterima = target.status === "DITERIMA";
  const isRevisi = target.status === "REVISI";
  const isPraktik = tipe ? tipe === "PRAKTIK" : (target.submittedHtml !== null || target.submittedCss !== null || target.submittedJs !== null);
  const isSoalBased = tipe ? (tipe === "PILIHAN_GANDA" || tipe === "ESSAY") : !!(target.jawaban && target.jawaban.length > 0);

  return (
    <AnimatePresence>
      {target && (
        <motion.div key="submisi-saya-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 py-5 overflow-hidden"
              style={{ background: isDiterima ? "#00D67F" : isRevisi ? "#F59E0B" : "#2563EB" }}>
              <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    {isRevisi ? <AlertCircle size={18} className="text-white" /> : <CheckCircle size={18} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                      {isDiterima ? "Tugas Diterima ✓" : isRevisi ? "Perlu Revisi" : "Tugas Terkirim"}
                    </p>
                    <p className="text-base font-extrabold text-white leading-tight">{judul ?? "Tugas"}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {(tipe === "PILIHAN_GANDA" || tipe === "ESSAY") && target.nilai !== null && (
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Nilai Kamu</p>
                  <p className="text-2xl font-black leading-none text-amber-600 dark:text-amber-400">{target.nilai}</p>
                </div>
              )}
              {isDiterima && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Tugas kamu telah diterima!</p>
                </div>
              )}
              {isRevisi && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5">Catatan dari Guru/Admin</p>
                      <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-line">
                        {target.pesanRevisi || "Silakan perbaiki tugas kamu dan kirim ulang."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-500">Dikirim pada</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{formatTglJam(target.submittedAt)}</span>
                </div>
                {target.catatan && (
                  <div className="py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Catatan kamu</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{target.catatan}</p>
                  </div>
                )}
              </div>
              {isPraktik ? (
                <button onClick={() => setViewCode(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#0033FF" }}>
                  <Code2 size={14} /> Lihat Kode Terkirim
                </button>
              ) : isSoalBased ? (
                <button onClick={() => setViewJawaban(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#0033FF" }}>
                  {tipe === "PILIHAN_GANDA" ? <ListChecks size={14} /> : <PenLine size={14} />} Lihat Jawaban Saya
                </button>
              ) : target.fileUrl && (
                <a href={target.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#0033FF" }}>
                  <Download size={14} /> Lihat File Terkirim
                </a>
              )}
              {isRevisi && (
                <button onClick={onKirimUlang}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#F59E0B" }}>
                  <Send size={13} /> Kirim Ulang Tugas
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      <TugasPraktikViewerModal
        open={viewCode}
        onClose={() => setViewCode(false)}
        title={judul ?? "Tugas"}
        subtitle="Kode yang kamu kirimkan"
        html={target.submittedHtml ?? ""}
        css={target.submittedCss ?? ""}
        js={target.submittedJs ?? ""}
      />
      <TugasJawabanViewerModal
        open={viewJawaban}
        onClose={() => setViewJawaban(false)}
        judul={judul ?? "Tugas"}
        tipe={tipe ?? ""}
        jawaban={target.jawaban ?? []}
        nilai={target.nilai}
      />
    </AnimatePresence>
  );
}
