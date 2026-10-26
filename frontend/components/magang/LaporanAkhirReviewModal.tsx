"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor, toTitleCase } from "@/components/data-siswa/shared";
import type { LaporanAkhirRow } from "./laporan-akhir-types";

function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

export function LaporanAkhirReviewModal({ row, onClose, onReview }: {
  row: LaporanAkhirRow | null;
  onClose: () => void;
  onReview: (penempatanId: string, status: "DITERIMA" | "REVISI", pesanRevisi?: string) => Promise<void>;
}) {
  const [showRevisiForm, setShowRevisiForm] = useState(false);
  const [pesanRevisi, setPesanRevisi] = useState("");
  const [busy, setBusy] = useState<"terima" | "revisi" | null>(null);

  function handleClose() {
    setShowRevisiForm(false);
    setPesanRevisi("");
    onClose();
  }

  async function handleTerima() {
    if (!row) return;
    setBusy("terima");
    try { await onReview(row.penempatanId, "DITERIMA"); handleClose(); } finally { setBusy(null); }
  }

  async function handleKirimRevisi() {
    if (!row || !pesanRevisi.trim()) return;
    setBusy("revisi");
    try { await onReview(row.penempatanId, "REVISI", pesanRevisi.trim()); handleClose(); } finally { setBusy(null); }
  }

  const laporan = row?.laporan ?? null;
  const nama = row ? toTitleCase(row.siswa.nama ?? "—") : "";

  return (
    <AnimatePresence>
      {row && laporan && (
        <div className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:rounded-3xl">

            <div className="flex shrink-0 items-center gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
              <Avatar src={row.siswa.fotoProfil} nama={nama} sizePx={56} fallbackBg={avatarColorFor(nama)} textClassName="text-lg font-extrabold" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{nama}</h2>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{row.tempatMagang.namaTempat}</p>
              </div>
              <button onClick={handleClose} aria-label="Tutup"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-6 sm:px-8">
              <a href={`/api/uploads${laporan.fileUrl}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-3xl bg-[#F1EDFA] px-5 py-5 dark:bg-slate-700">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#3E03B3]">
                  <Download size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-slate-900 dark:text-white">{laporan.fileName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Laporan akhir · dikirim {fmtTgl(laporan.submittedAt)}</p>
                </div>
              </a>

              {laporan.catatan && (
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Catatan siswa</p>
                  <p className="rounded-2xl bg-slate-50 px-5 py-4 text-base text-slate-700 dark:bg-slate-700 dark:text-slate-200">{laporan.catatan}</p>
                </div>
              )}

              {laporan.status === "DITERIMA" && (
                <div className="flex items-center gap-3 rounded-2xl bg-[#F6FEE8] px-5 py-4 text-base font-bold text-[#48700B]">
                  <CheckCircle2 size={20} /> Laporan ini sudah diterima
                </div>
              )}
              {laporan.status === "REVISI" && (
                <div className="rounded-2xl bg-[#FFE9E2] px-5 py-4">
                  <p className="flex items-center gap-2 text-base font-bold text-[#C2410C]"><AlertTriangle size={20} /> Revisi diminta</p>
                  {laporan.pesanRevisi && <p className="mt-1.5 text-base text-slate-800">{laporan.pesanRevisi}</p>}
                </div>
              )}

              {laporan.status === "TERKIRIM" && showRevisiForm && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900 dark:text-white">Pesan revisi untuk siswa</label>
                  <textarea value={pesanRevisi} onChange={(e) => setPesanRevisi(e.target.value)} rows={4} autoFocus
                    placeholder="Tuliskan bagian yang perlu diperbaiki…"
                    className="w-full resize-none rounded-2xl border-0 bg-slate-50 px-5 py-4 text-base text-slate-800 outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100" />
                </div>
              )}
            </div>

            {laporan.status === "TERKIRIM" && (
              <div className="flex shrink-0 gap-3 px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
                {showRevisiForm ? (
                  <>
                    <button type="button" onClick={() => setShowRevisiForm(false)}
                      className="h-12 flex-1 rounded-xl bg-[#F1EDFA] text-base font-bold text-[#3E03B3]">
                      Batal
                    </button>
                    <button type="button" onClick={handleKirimRevisi} disabled={!pesanRevisi.trim() || !!busy}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold disabled:opacity-50"
                      style={{ background: "#F26A3D", color: "#FFFFFF" }}>
                      {busy === "revisi" ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                      Kirim Revisi
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setShowRevisiForm(true)} disabled={!!busy}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold disabled:opacity-50"
                      style={{ background: "#F26A3D", color: "#FFFFFF" }}>
                      <AlertTriangle size={18} /> Minta Revisi
                    </button>
                    <button type="button" onClick={handleTerima} disabled={!!busy}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold disabled:opacity-50"
                      style={{ background: "#3E03B3", color: "#FFFFFF" }}>
                      {busy === "terima" ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      Terima
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
