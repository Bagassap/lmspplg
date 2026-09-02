"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2, X, Plus, Pencil, Trash2, School, Users } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { avatarColor } from "./shared";
import type { Kelas } from "./types";

export type Guru = { id: string; user: { id: string; nama: string } };

export function KelolaKelasModal({ kelasList, guruList, onClose, onSaved }: {
  kelasList: Kelas[]; guruList: Guru[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<Kelas | null>(null);
  const [nama, setNama] = useState("");
  const [waliId, setWaliId] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function startCreate() {
    setEditing({ id: "", nama: "" });
    setNama("");
    setWaliId("");
  }
  function startEdit(k: Kelas) {
    setEditing(k);
    setNama(k.nama);
    setWaliId(k.waliKelasGuru?.user.id ?? "");
  }

  async function save() {
    if (!nama.trim()) { toast.error("Nama kelas wajib diisi", ""); return; }
    setSaving(true);
    try {
      const isNew = !editing?.id;
      const guruEntry = guruList.find((g) => g.user.id === waliId);
      const res = await fetch(isNew ? "/api/kelas" : `/api/kelas/${editing!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, waliKelasGuruId: guruEntry?.id || undefined }),
      });
      if (res.ok) {
        toast.success(isNew ? "Kelas ditambahkan" : "Kelas diperbarui", "");
        setEditing(null);
        onSaved();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menyimpan kelas", "");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(k: Kelas) {
    const ok = await toast.confirm(
      "Hapus kelas ini?",
      `"${k.nama}" akan dihapus. Kelas hanya bisa dihapus kalau sudah tidak ada siswa di dalamnya.`,
    );
    if (!ok) return;
    setBusyId(k.id);
    try {
      const res = await fetch(`/api/kelas/${k.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Kelas dihapus", ""); onSaved(); }
      else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menghapus kelas", "");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">

        <div className="relative flex shrink-0 items-center gap-3 overflow-hidden bg-[#0082FB] px-6 py-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-6 right-20 h-16 w-16 rounded-full bg-white/8" />
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Settings2 size={18} className="text-white" />
          </div>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Absensi Harian</p>
            <h2 className="text-base font-extrabold text-white">Kelola Kelas</h2>
          </div>
          <button onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25">
            <X size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {editing ? (
            <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Nama Kelas</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: XII RPL 1"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0082FB] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Wali Kelas</label>
                <select value={waliId} onChange={(e) => setWaliId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0082FB] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                  <option value="">— Belum ditentukan —</option>
                  {guruList.map((g) => (
                    <option key={g.id} value={g.user.id}>{g.user.nama}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(null)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                  Batal
                </button>
                <button onClick={save} disabled={saving}
                  className="rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                  style={{ background: "#0082FB" }}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <motion.button onClick={startCreate}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:border-[#0082FB] hover:bg-blue-50/50 hover:text-[#0082FB] dark:border-slate-600 dark:hover:bg-blue-900/10">
              <Plus size={14} /> Tambah Kelas
            </motion.button>
          )}

          <div className="mt-3 space-y-2">
            {kelasList.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3.5 py-2.5 transition-colors hover:border-blue-100 hover:bg-blue-50/30 dark:border-slate-700/50 dark:hover:bg-blue-900/10">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: avatarColor(k.nama) }}>
                    <School size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{k.nama}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {k.waliKelasGuru?.user.nama ?? "Belum ada wali kelas"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="mr-1 flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <Users size={10} /> {k._count?.siswa ?? 0}
                  </span>
                  <button onClick={() => startEdit(k)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#0082FB] hover:bg-blue-100 dark:bg-blue-900/20">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(k)} disabled={busyId === k.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40 dark:bg-red-900/20">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {kelasList.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">Belum ada kelas</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
