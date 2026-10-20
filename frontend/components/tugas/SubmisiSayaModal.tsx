"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Download, Send, Code2, ListChecks, PenLine } from "lucide-react";
import type { TugasSubmisiItem } from "./types";
import { formatTglJam } from "./types";
import { TugasPraktikViewerModal } from "./TugasPraktikViewerModal";
import { TugasJawabanViewerModal } from "./TugasJawabanViewerModal";
import { useIsAppMode } from "@/lib/pwaInstall";

export function SubmisiSayaModal({
  target, judul, tipe, onClose, onKirimUlang,
}: {
  target: TugasSubmisiItem | null;
  judul?: string;
  tipe?: string;
  onClose: () => void;
  onKirimUlang: () => void;
}) {
  const app = useIsAppMode();
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}>
          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:rounded-2xl"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 py-5 overflow-hidden"
              style={app ? { background: "#F1EDFA", color: "#1E293B" } : { background: isDiterima ? "#F26A3D" : isRevisi ? "#0F172A" : "#0EA5E9", color: isDiterima ? "#0F172A" : "#FFFFFF" }}>
              <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full" style={{ backgroundColor: isDiterima ? "#0F172A19" : "#FFFFFF1A" }} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: app ? "#FFFFFF" : isDiterima ? "#0F172A33" : isRevisi ? "#FFFFFF26" : "#FFFFFF33" }}>
                    {isRevisi ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ opacity: 0.7 }}>
                      {isDiterima ? "Tugas Diterima ✓" : isRevisi ? "Perlu Revisi" : "Tugas Terkirim"}
                    </p>
                    <p className="text-base font-extrabold leading-tight">{judul ?? "Tugas"}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80" style={{ backgroundColor: app ? "#FFFFFF" : isDiterima ? "#0F172A33" : isRevisi ? "#FFFFFF26" : "#FFFFFF33" }}>
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="space-y-4 overflow-y-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]" style={{ maxHeight: "calc(92vh - 84px)" }}>
              {(tipe === "PILIHAN_GANDA" || tipe === "ESSAY") && target.nilai !== null && (
                <div className="flex items-center justify-between rounded-xl border border-[#FFFFFF] bg-[#FFFFFF] px-4 py-3 dark:border-[#A1F919]/30 dark:bg-[#A1F919]/10">
                  <p className="text-sm font-bold text-[#000000] dark:text-[#A1F919]">Nilai Kamu</p>
                  <p className="text-2xl font-black leading-none text-[#000000] dark:text-[#A1F919]">{target.nilai}</p>
                </div>
              )}
              {isDiterima && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F6FEE8] dark:bg-[#A1F919]/10 border border-[#F6FEE8] dark:border-[#A1F919]/20">
                  <CheckCircle size={18} className="text-[#5D900F] dark:text-[#A1F919] shrink-0" />
                  <p className="text-sm font-bold text-[#48700B] dark:text-[#A1F919]">Tugas kamu telah diterima!</p>
                </div>
              )}
              {isRevisi && (
                <div className="rounded-xl border border-[#FFFFFF] dark:border-[#A1F919]/30 bg-[#FFFFFF] dark:bg-[#A1F919]/10 px-4 py-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-[#5D900F] dark:text-[#A1F919] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#000000] dark:text-[#A1F919] mb-1.5">Catatan dari Guru/Admin</p>
                      <p className="text-sm text-[#000000] dark:text-[#A1F919] leading-relaxed whitespace-pre-line">
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
                  className={`flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white ${app ? "rounded-full" : "rounded-xl"}`}
                  style={{ background: app ? "#3E03B3" : "#3E03B3" }}>
                  <Code2 size={14} /> Lihat Kode Terkirim
                </button>
              ) : isSoalBased ? (
                <button onClick={() => setViewJawaban(true)}
                  className={`flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white ${app ? "rounded-full" : "rounded-xl"}`}
                  style={{ background: app ? "#3E03B3" : "#3E03B3" }}>
                  {tipe === "PILIHAN_GANDA" ? <ListChecks size={14} /> : <PenLine size={14} />} Lihat Jawaban Saya
                </button>
              ) : target.fileUrl && (
                <a href={target.fileUrl} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white ${app ? "rounded-full" : "rounded-xl"}`}
                  style={{ background: app ? "#3E03B3" : "#3E03B3" }}>
                  <Download size={14} /> Lihat File Terkirim
                </a>
              )}
              {isRevisi && (
                <button onClick={onKirimUlang}
                  className={`flex items-center justify-center gap-2 w-full py-3 text-sm font-bold ${app ? "rounded-full" : "rounded-xl"}`}
                  style={app ? { background: "#F1EDFA", color: "#3E03B3" } : { background: "#F26A3D", color: "#FFFFFF" }}>
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
