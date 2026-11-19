"use client";

import { motion } from "framer-motion";
import { Building2, CheckCircle2, Loader2, RotateCcw, X, XCircle } from "lucide-react";
import { toTitleCase } from "@/components/data-siswa/shared";
import { STATUS_PENDAFTARAN_CFG, type PendaftaranMagang } from "./types";

export const namaPendaftar = (p: PendaftaranMagang) => toTitleCase(p.siswa?.user?.nama ?? p.siswa?.nama ?? "—");

export function PendaftarTempatModal({ judul, rows, busyId, onTerima, onTolak, onBatal, onClose }: {
  judul: string;
  rows: PendaftaranMagang[];
  busyId: string | null;
  onTerima: (p: PendaftaranMagang) => void;
  onTolak: (p: PendaftaranMagang) => void;
  onBatal: (p: PendaftaranMagang) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#E0F2FE", color: "#0EA5E9" }}><Building2 size={20} /></span>
          <h2 className="min-w-0 flex-1 truncate text-base font-extrabold text-slate-900 dark:text-white">{judul}</h2>
          <span className="shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: "#E0F2FE", color: "#0EA5E9" }}>{rows.length} siswa</span>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-5 pb-5">
          {rows.map((p) => {
            const cfg = STATUS_PENDAFTARAN_CFG[p.status];
            const busy = busyId === p.id;
            return (
              <div key={p.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-white" title={namaPendaftar(p)}>{namaPendaftar(p)}</p>
                <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.clr }}>{cfg.label}</span>
                {p.status === "MENUNGGU" && (
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => onTolak(p)} disabled={busy} title="Tolak" aria-label="Tolak"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626] disabled:opacity-50">
                      <XCircle size={14} />
                    </button>
                    <button type="button" onClick={() => onTerima(p)} disabled={busy}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-[#22A06B] px-3 text-xs font-bold text-white disabled:opacity-50">
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Verifikasi
                    </button>
                  </div>
                )}
                {p.status === "DITERIMA" && (
                  <button type="button" onClick={() => onBatal(p)} disabled={busy} title="Batalkan verifikasi" aria-label="Batalkan verifikasi"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#3E03B3] disabled:opacity-50 dark:bg-slate-700 dark:text-[#C4B5FD]">
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  </button>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="py-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Tidak ada pendaftaran pada filter ini</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
