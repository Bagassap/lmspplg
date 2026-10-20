"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, UserCheck, Loader2, MapPin, Phone, Briefcase, User } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { toTitleCase } from "@/components/data-siswa/shared";
import type { PenempatanMagang } from "./types";

type GuruOption = { id: string; user: { id: string; nama: string } };

function todayStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/** Admin menetapkan guru pembimbing untuk satu pengajuan (atau satu kelompok siswa). */
export function TetapkanGuruModal({ rows, guruList, onClose, onSaved }: {
  rows: PenempatanMagang[]; guruList: GuruOption[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [guruId, setGuruId] = useState("");
  const [saving, setSaving] = useState(false);
  const t = rows[0].tempatMagang;

  async function simpan() {
    if (!guruId) { toast.error("Pilih guru pembimbing", ""); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/magang/penempatan/${rows[0].id}/tetapkan-guru`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guruPembimbingId: guruId }),
      });
      if (res.ok) {
        toast.success("Guru pembimbing ditetapkan", "Penempatan aktif dan menu PKL guru terbuka.");
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menetapkan guru pembimbing", "");
      }
    } finally {
      setSaving(false);
    }
  }

  const info = [
    { icon: MapPin, label: "Alamat", value: t.alamat },
    { icon: Briefcase, label: "Bidang usaha", value: t.bidangUsaha },
    { icon: User, label: "Pimpinan", value: t.namaPimpinan },
    { icon: Phone, label: "WA usaha", value: t.noWaUsaha },
  ].filter((x) => x.value);

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#3E03B3]"><UserCheck size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Tetapkan Guru Pembimbing</h2>
            <p className="truncate text-xs text-slate-600 dark:text-slate-300">{t.namaTempat}</p>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3]"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5">
          <div className="rounded-2xl bg-[#F1EDFA] p-3">
            <p className="mb-1.5 text-xs font-bold text-slate-700">Siswa ({rows.length})</p>
            <div className="space-y-1">
              {rows.map((r) => (
                <p key={r.id} className="text-sm font-bold text-slate-900">
                  {toTitleCase(r.siswa.nama ?? r.siswa.user?.nama ?? "—")} <span className="font-medium text-slate-600">· {r.siswa.kelas?.nama}</span>
                </p>
              ))}
            </div>
          </div>

          {info.length > 0 && (
            <div className="space-y-1.5 rounded-2xl bg-[#F1EDFA] p-3">
              {info.map((x) => (
                <p key={x.label} className="flex items-start gap-2 text-xs text-slate-800">
                  <x.icon size={13} className="mt-0.5 shrink-0 text-[#3E03B3]" />
                  <span><span className="font-bold">{x.label}:</span> {x.value}</span>
                </p>
              ))}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Guru pembimbing</label>
            <select value={guruId} onChange={(e) => setGuruId(e.target.value)}
              className="h-11 w-full rounded-full border-0 bg-[#F1EDFA] px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E03B3]">
              <option value="">Pilih guru…</option>
              {guruList.map((g) => <option key={g.id} value={g.id}>{g.user.nama}</option>)}
            </select>
          </div>

          <button onClick={simpan} disabled={saving || !guruId}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Menyimpan..." : "Tetapkan & Aktifkan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
