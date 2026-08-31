"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor, toTitleCase } from "@/components/data-siswa/shared";
import type { TempatMagang, PenempatanMagang } from "./types";

type GuruOption = { id: string; user: { id: string; nama: string } };

const INPUT_CLS = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0082FB]/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";

export function EditPenempatanModal({
  penempatan, tempatList, guruList, onClose, onSaved,
}: {
  penempatan: PenempatanMagang;
  tempatList: TempatMagang[];
  guruList: GuruOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [tempatId, setTempatId] = useState(penempatan.tempatMagang.id);
  const [guruId, setGuruId] = useState(penempatan.guruPembimbing.id);
  const [tanggalMulai, setTanggalMulai] = useState(penempatan.tanggalMulai.slice(0, 10));
  const [tanggalSelesai, setTanggalSelesai] = useState(penempatan.tanggalSelesai ? penempatan.tanggalSelesai.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  const nama = toTitleCase(penempatan.siswa.nama ?? penempatan.siswa.user?.nama ?? "—");

  async function save() {
    if (!tempatId || !guruId || !tanggalMulai) {
      toast.error("Tempat, guru pembimbing, dan tanggal mulai wajib diisi", "");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/magang/penempatan/${penempatan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempatMagangId: tempatId, guruPembimbingId: guruId,
          tanggalMulai, tanggalSelesai: tanggalSelesai || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Penempatan berhasil diperbarui", "");
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal memperbarui penempatan", "");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="relative flex shrink-0 items-center gap-3 overflow-hidden bg-[#0082FB] px-6 py-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Briefcase size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">PKL</p>
            <h2 className="text-base font-extrabold text-white">Edit Penempatan PKL</h2>
          </div>
          <button onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25">
            <X size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Siswa</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-800/60">
              <Avatar src={penempatan.siswa.user?.fotoProfil} nama={nama} sizePx={32}
                fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{nama}</p>
                <p className="truncate text-[11px] text-slate-400">{penempatan.siswa.nis} · {penempatan.siswa.kelas.nama}</p>
              </div>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Siswa tidak bisa diganti lewat edit — hapus penempatan ini lalu buat yang baru bila perlu.</p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Tempat Magang</label>
            <select value={tempatId} onChange={(e) => setTempatId(e.target.value)} className={INPUT_CLS}>
              {tempatList.map((t) => {
                const terisi = t._count?.penempatan ?? 0;
                const penuh = terisi >= t.kuota && t.id !== penempatan.tempatMagang.id;
                return (
                  <option key={t.id} value={t.id} disabled={penuh}>
                    {t.namaTempat} ({terisi}/{t.kuota}{penuh ? " · penuh" : ""})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Guru Pembimbing</label>
            <select value={guruId} onChange={(e) => setGuruId(e.target.value)} className={INPUT_CLS}>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>{toTitleCase(g.user.nama)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Tanggal Mulai</label>
              <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Tanggal Selesai <span className="font-normal normal-case text-slate-400">(opsional)</span></label>
              <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 p-5 pt-4 dark:border-slate-700/50">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
            Batal
          </button>
          <button onClick={save} disabled={saving}
            className="rounded-xl bg-[#0082FB] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
