"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Briefcase, Building2, FileText, Loader2, MapPin, Phone, User, UserCheck, Users } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { toTitleCase } from "@/components/data-siswa/shared";
import type { PenempatanMagang } from "./types";

type GuruOption = { id: string; user: { id: string; nama: string } };

const FIELD = "h-11 w-full rounded-2xl border-0 bg-[#F1EDFA] px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100";

/** Modal pengajuan penempatan PKL dari siswa: periksa data tempat & surat, lalu terima (pilih guru) atau tolak. */
export function PengajuanPklModal({ rows, guruList, onClose, onSaved }: {
  rows: PenempatanMagang[]; guruList: GuruOption[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [guruId, setGuruId] = useState("");
  const [tolakMode, setTolakMode] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [saving, setSaving] = useState(false);
  const t = rows[0].tempatMagang;
  const surat = rows.find((r) => r.suratKeteranganUrl);

  const info = [
    { icon: MapPin, label: "Alamat", value: t.alamat },
    { icon: Briefcase, label: "Bidang usaha", value: t.bidangUsaha },
    { icon: User, label: "Pimpinan", value: t.namaPimpinan },
    { icon: Phone, label: "WA usaha", value: t.noWaUsaha },
  ].filter((x) => x.value);

  async function kirim(url: string, body: object, okMsg: [string, string]) {
    setSaving(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(okMsg[0], okMsg[1]);
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ? String(Array.isArray(d.message) ? d.message[0] : d.message) : "Gagal memproses pengajuan", "");
      }
    } finally {
      setSaving(false);
    }
  }

  function terima() {
    if (!guruId) { toast.error("Pilih guru pembimbing", ""); return; }
    return kirim(`/api/magang/penempatan/${rows[0].id}/tetapkan-guru`, { guruPembimbingId: guruId },
      ["Pengajuan diterima", `${rows.length} siswa di ${t.namaTempat} kini punya guru pembimbing.`]);
  }

  function tolak() {
    if (!alasan.trim()) { toast.error("Isi alasan penolakan", "Siswa perlu tahu mengapa pengajuannya ditolak."); return; }
    return kirim(`/api/magang/penempatan/${rows[0].id}/tolak`, { alasan: alasan.trim() },
      ["Pengajuan ditolak", "Siswa diberi tahu dan bisa mengajukan ulang."]);
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700"><Building2 size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Pengajuan Penempatan PKL</h2>
            <p className="truncate text-xs text-slate-600 dark:text-slate-300">{t.namaTempat}{t.dibuatSiswa ? " · tempat diisi siswa" : ""}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5">
          <div className="rounded-2xl bg-[#F1EDFA] p-3 dark:bg-slate-700">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"><Users size={13} /> Siswa yang mengajukan ({rows.length})</p>
            <div className="space-y-1">
              {rows.map((r) => (
                <p key={r.id} className="text-sm font-bold text-slate-900 dark:text-white">
                  {toTitleCase(r.siswa.nama ?? r.siswa.user?.nama ?? "—")} <span className="font-medium text-slate-600 dark:text-slate-300">· {r.siswa.kelas?.nama}</span>
                </p>
              ))}
            </div>
          </div>

          {info.length > 0 && (
            <div className="space-y-1.5 rounded-2xl bg-[#F1EDFA] p-3 dark:bg-slate-700">
              {info.map((x) => (
                <p key={x.label} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200">
                  <x.icon size={13} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />
                  <span><span className="font-bold">{x.label}:</span> {x.value}</span>
                </p>
              ))}
            </div>
          )}

          {surat?.suratKeteranganUrl ? (
            <a href={`/api/uploads${surat.suratKeteranganUrl}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-[#F1EDFA] p-3 text-xs font-bold text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]">
              <FileText size={14} className="shrink-0" /> <span className="truncate underline">Surat keterangan: {surat.suratKeteranganNama ?? "Lihat berkas"}</span>
            </a>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-[#FFE9E2] p-3 text-xs font-bold text-[#E8562B]">
              <FileText size={14} className="shrink-0" /> Siswa belum mengunggah surat keterangan. Pengajuan belum bisa diterima.
            </p>
          )}

          {tolakMode ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Alasan penolakan <span className="text-[#E8562B]">*</span></label>
              <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={3} placeholder="Contoh: surat tidak terbaca, mohon unggah ulang"
                className="w-full rounded-2xl border-0 bg-[#F1EDFA] px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setTolakMode(false)} disabled={saving}
                  className="h-12 flex-1 rounded-full bg-[#F1EDFA] text-sm font-bold text-[#3E03B3] disabled:opacity-50 dark:bg-slate-700 dark:text-[#C4B5FD]">Batal</button>
                <button type="button" onClick={tolak} disabled={saving || !alasan.trim()}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#E8562B] text-sm font-bold text-white disabled:opacity-50">
                  {saving && <Loader2 size={15} className="animate-spin" />} Tolak pengajuan
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Guru pembimbing</label>
                <select value={guruId} onChange={(e) => setGuruId(e.target.value)} className={FIELD}>
                  <option value="">Pilih guru…</option>
                  {guruList.map((g) => <option key={g.id} value={g.id}>{g.user.nama}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTolakMode(true)} disabled={saving}
                  className="h-12 rounded-full bg-[#FFE9E2] px-5 text-sm font-bold text-[#E8562B] disabled:opacity-50">Tolak</button>
                <button type="button" onClick={terima} disabled={saving || !guruId || !surat}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />} Terima &amp; tetapkan guru
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
