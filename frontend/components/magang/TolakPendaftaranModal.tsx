"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X, XCircle } from "lucide-react";

export function TolakPendaftaranModal({ onClose, onTolak }: {
  onClose: () => void; onTolak: (alasan: string) => Promise<void>;
}) {
  const [alasan, setAlasan] = useState("");
  const [saving, setSaving] = useState(false);

  async function kirim() {
    if (!alasan.trim()) return;
    setSaving(true);
    try { await onTolak(alasan.trim()); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#DC2626]"><XCircle size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Tolak pendaftaran</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700"><X size={16} /></button>
        </div>
        <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Alasan penolakan <span className="text-[#E8562B]">*</span></label>
        <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={3} autoFocus placeholder="Contoh: alamat belum lengkap, nomor WA tidak aktif"
          className="w-full rounded-2xl border-0 bg-[#F1EDFA] px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400" />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="h-12 flex-1 rounded-xl bg-[#F1EDFA] text-sm font-bold text-[#3E03B3] disabled:opacity-50 dark:bg-slate-700 dark:text-[#C4B5FD]">Batal</button>
          <button type="button" onClick={kirim} disabled={saving || !alasan.trim()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#DC2626] text-sm font-bold text-white disabled:opacity-50">
            {saving && <Loader2 size={15} className="animate-spin" />} Tolak
          </button>
        </div>
      </motion.div>
    </div>
  );
}
