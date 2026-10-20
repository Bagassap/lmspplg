"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, X, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import type { TempatMagang } from "./types";

const INPUT_CLS = "w-full rounded-xl border-0 bg-[#F1EDFA] px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3]";

/**
 * Kelola tempat PKL oleh guru/admin: cukup nama tempat dan kuota siswa.
 * Alamat, bidang usaha, pimpinan, dan WA usaha diisi siswa saat mengajukan tempat baru.
 */
export function KelolaTempatModal({ tempatList, onClose, onSaved }: {
  tempatList: TempatMagang[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<TempatMagang | { id: "" } | null>(null);
  const [namaTempat, setNamaTempat] = useState("");
  const [kuota, setKuota] = useState("1");
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing({ id: "" });
    setNamaTempat(""); setKuota("1");
  }
  function startEdit(t: TempatMagang) {
    setEditing(t);
    setNamaTempat(t.namaTempat); setKuota(String(t.kuota));
  }

  async function save() {
    if (!namaTempat.trim()) { toast.error("Nama tempat wajib diisi", ""); return; }
    setSaving(true);
    try {
      const isNew = !editing?.id;
      const res = await fetch(isNew ? "/api/magang/tempat" : `/api/magang/tempat/${editing!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaTempat: namaTempat.trim(), kuota: Math.max(1, Number(kuota) || 1) }),
      });
      if (res.ok) {
        toast.success(isNew ? "Tempat magang ditambahkan" : "Tempat magang diperbarui", "");
        setEditing(null);
        onSaved();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menyimpan tempat magang", "");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: TempatMagang) {
    const ok = await toast.confirm("Hapus tempat magang ini?", `"${t.namaTempat}" akan dihapus permanen.`);
    if (!ok) return;
    const res = await fetch(`/api/magang/tempat/${t.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Tempat magang dihapus", ""); onSaved(); }
    else {
      const d = await res.json().catch(() => null);
      toast.error(d?.message ?? "Gagal menghapus tempat magang", "");
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#3E03B3]">
            <Building2 size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Tempat Magang</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">Siswa memilih dari daftar ini saat mengajukan PKL</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3]">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {editing ? (
            <div className="space-y-3 rounded-2xl bg-[#F1EDFA] p-3.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Nama tempat</label>
                <input value={namaTempat} onChange={(e) => setNamaTempat(e.target.value)} placeholder="Contoh: PT Maju Jaya Digital" className={`${INPUT_CLS} !bg-white`} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Kuota siswa</label>
                <input type="number" inputMode="numeric" min={1} value={kuota} onChange={(e) => setKuota(e.target.value)} className={`${INPUT_CLS} !bg-white`} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-xs font-bold text-slate-700">Batal</button>
                <button onClick={save} disabled={saving}
                  className="rounded-full bg-[#3E03B3] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={startCreate}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#3E03B3] text-sm font-bold text-white">
              <Plus size={15} /> Tambah tempat
            </button>
          )}

          <div className="mt-3 space-y-2">
            {tempatList.map((t) => {
              const terisi = t._count?.penempatan ?? 0;
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-[#F1EDFA] px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{t.namaTempat}</p>
                    <p className="truncate text-xs text-slate-600">
                      Kuota {terisi}/{t.kuota}{t.dibuatSiswa ? " · diajukan siswa" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => startEdit(t)} aria-label="Ubah" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#3E03B3]">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(t)} aria-label="Hapus" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#F26A3D]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
            {tempatList.length === 0 && (
              <p className="py-8 text-center text-xs font-semibold text-slate-600">Belum ada tempat magang</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
