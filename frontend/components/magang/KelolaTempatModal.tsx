"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, X, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { JENIS_KELAMIN_TEMPAT, labelJenisKelaminTempat, type TempatMagang } from "./types";
import { pesanError } from "./pkl-form-ui";
import { KuotaTerpenuhiChip } from "./KuotaTerpenuhiChip";
import { Portal } from "@/components/shared/Portal";

const INPUT_CLS = "w-full rounded-xl border-0 bg-[#F1EDFA] px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

export function KelolaTempatModal({ tempatList, onClose, onSaved }: {
  tempatList: TempatMagang[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<TempatMagang | { id: "" } | null>(null);
  const [namaTempat, setNamaTempat] = useState("");
  const [kuota, setKuota] = useState("1");
  const [jenisKelamin, setJenisKelamin] = useState("Semua");
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing({ id: "" });
    setNamaTempat(""); setKuota("1"); setJenisKelamin("Semua");
  }
  function startEdit(t: TempatMagang) {
    setEditing(t);
    setNamaTempat(t.namaTempat); setKuota(String(t.kuota));
    setJenisKelamin(t.jenisKelamin ?? "Semua");
  }

  async function save() {
    if (!namaTempat.trim()) { toast.error("Nama tempat wajib diisi", ""); return; }
    setSaving(true);
    try {
      const isNew = !editing?.id;
      const res = await fetch(isNew ? "/api/magang/tempat" : `/api/magang/tempat/${editing!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaTempat: namaTempat.trim(), kuota: Math.max(1, Number(kuota) || 1), jenisKelamin }),
      });
      if (res.ok) {
        toast.success(isNew ? "Tempat magang ditambahkan" : "Tempat magang diperbarui", "");
        setEditing(null);
        onSaved();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(pesanError(d, "Gagal menyimpan tempat magang"), "");
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
    <Portal><div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFE9E2] text-[#E8562B] dark:bg-[#E8562B]/20">
            <Building2 size={20} />
          </span>
          <h2 className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Tempat Magang</h2>
          <button onClick={onClose} aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {editing ? (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Nama tempat</label>
                <input value={namaTempat} onChange={(e) => setNamaTempat(e.target.value)} placeholder="Contoh: PT Maju Jaya Digital" className={`${INPUT_CLS} !bg-white dark:!bg-slate-900`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Kuota siswa</label>
                  <input type="number" inputMode="numeric" min={1} value={kuota} onChange={(e) => setKuota(e.target.value)} className={`${INPUT_CLS} !bg-white dark:!bg-slate-900`} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Jenis kelamin</label>
                  <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className={`${INPUT_CLS} !bg-white dark:!bg-slate-900`}>
                    {JENIS_KELAMIN_TEMPAT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">Batal</button>
                <button onClick={save} disabled={saving}
                  className="rounded-xl bg-[#3E03B3] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={startCreate}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white">
              <Plus size={15} /> Tambah tempat
            </button>
          )}

          {!editing && <div className="mt-3 space-y-2">
            {tempatList.map((t) => {
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800">
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">{t.namaTempat}</p>
                  {t.penuh && <KuotaTerpenuhiChip />}
                  {t.jenisKelamin && (
                    <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                      style={t.jenisKelamin === "Perempuan" ? { background: "#FEE2E2", color: "#DB2777" } : { background: "#E0F2FE", color: "#0EA5E9" }}>
                      {labelJenisKelaminTempat(t.jenisKelamin)}
                    </span>
                  )}
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => startEdit(t)} aria-label="Ubah" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0EA5E9] dark:bg-[#0EA5E9]/20">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(t)} aria-label="Hapus" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626] dark:bg-[#DC2626]/20 dark:text-[#F87171]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
            {tempatList.length === 0 && (
              <p className="py-8 text-center text-xs font-semibold text-slate-600">Belum ada tempat magang</p>
            )}
          </div>}
        </div>
      </motion.div>
    </div></Portal>
  );
}
