"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, CalendarDays, CheckCircle2, FileText, Loader2, MapPin, Phone, User, UserCheck, X, XCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor, waLink } from "@/components/data-siswa/shared";
import { STATUS_PENEMPATAN_CFG, formatAlamat, type PenempatanMagang } from "./types";
import { namaSiswa, namaOrang } from "@/lib/nama";
import { Portal } from "@/components/shared/Portal";
import { BuktiSuratViewer } from "./BuktiSuratViewer";

type GuruOption = { id: string; user: { id: string; nama: string } };

const FIELD = "h-11 w-full rounded-2xl border-0 bg-slate-50 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-800 dark:text-slate-100";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

function Baris({ icon: Icon, label, children, bg, fg }: { icon: typeof MapPin; label: string; children: React.ReactNode; bg: string; fg: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: bg, color: fg }}><Icon size={15} /></span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</div>
      </div>
    </div>
  );
}

export function PengajuanPklModal({ rows, guruList, onClose, onSaved }: {
  rows: PenempatanMagang[]; guruList: GuruOption[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [guruId, setGuruId] = useState("");
  const [tolakMode, setTolakMode] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [saving, setSaving] = useState(false);
  const p = rows[0];
  const t = p.tempatMagang;
  const menunggu = p.status === "MENUNGGU";
  const cfg = STATUS_PENEMPATAN_CFG[p.status];
  const nama = namaSiswa(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
  const wa = waLink(t.noWaUsaha ?? t.kontak);

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
        toast.error(d?.message ? String(Array.isArray(d.message) ? d.message[0] : d.message) : "Gagal memproses penempatan", "");
      }
    } finally {
      setSaving(false);
    }
  }

  function verifikasi() {
    return kirim(`/api/magang/penempatan/${p.id}/tetapkan-guru`, guruId ? { guruPembimbingId: guruId } : {},
      ["Penempatan diverifikasi", `${nama} di ${t.namaTempat}`]);
  }

  function tolak() {
    if (!alasan.trim()) { toast.error("Isi alasan penolakan", "Siswa perlu tahu bagian mana yang harus diperbaiki."); return; }
    return kirim(`/api/magang/penempatan/${p.id}/tolak`, { alasan: alasan.trim() },
      ["Penempatan ditolak", "Siswa diberi tahu dan perlu mengisi ulang form penempatan."]);
  }

  return (
    <Portal><div data-plain className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#E0F2FE", color: "#0EA5E9" }}><FileText size={20} /></span>
          <h2 className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Dokumen Penempatan</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5">
          <div className="flex items-center gap-3 rounded-2xl bg-[#F1EDFA] p-3 dark:bg-slate-800">
            <Avatar src={p.siswa.user?.fotoProfil} nama={nama} sizePx={40} fallbackBg={avatarColorFor(nama)} textClassName="text-xs font-extrabold" />
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">
              {nama} <span className="block truncate text-xs font-medium text-slate-600 dark:text-slate-300 sm:inline sm:text-sm">· {p.siswa.kelas?.nama} · NIS {p.siswa.nis}</span>
            </p>
            <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.clr }}>{cfg.label}</span>
          </div>

          <p className="pt-1 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Form penempatan siswa</p>
          <Baris icon={Building2} label="Nama instansi" bg="#FFE9E2" fg="#E8562B">{t.namaTempat}</Baris>
          <Baris icon={User} label="Kepala instansi" bg="#E0F2FE" fg="#0EA5E9">{t.namaPimpinan || "-"}</Baris>
          <Baris icon={MapPin} label="Alamat instansi" bg="#FFE9E2" fg="#E8562B">{formatAlamat(t)}</Baris>
          <Baris icon={Phone} label="WA instansi" bg="#E4F5EC" fg="#22A06B">
            {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="underline">{t.noWaUsaha ?? t.kontak}</a> : (t.noWaUsaha ?? t.kontak ?? "-")}
          </Baris>
          <Baris icon={CalendarDays} label="Diajukan" bg="#FFF4E0" fg="#D97706">{fmt(p.createdAt)}</Baris>
          {!menunggu && (
            <Baris icon={UserCheck} label="Guru pembimbing" bg="#F1EDFA" fg="#3E03B3">{p.guruPembimbing ? namaOrang(p.guruPembimbing.user.nama) : "Belum ditetapkan"}</Baris>
          )}

          <p className="pt-1 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Bukti surat instansi</p>
          {p.suratKeteranganUrl ? (
            <BuktiSuratViewer key={p.suratKeteranganUrl} path={p.suratKeteranganUrl} nama={p.suratKeteranganNama} />
          ) : (
            <p className="rounded-2xl bg-[#FEE2E2] p-3 text-xs font-bold text-[#DC2626]">Siswa belum mengunggah bukti surat instansi.</p>
          )}

          {menunggu && (tolakMode ? (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Alasan penolakan <span className="text-[#DC2626]">*</span></label>
              <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={3} placeholder="Contoh: nama kepala instansi tidak sesuai surat, mohon perbaiki"
                className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#DC2626] dark:bg-slate-800 dark:text-slate-100" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setTolakMode(false)} disabled={saving}
                  className="h-12 flex-1 rounded-xl bg-[#F1EDFA] text-sm font-bold text-[#3E03B3] disabled:opacity-50 dark:bg-slate-700 dark:text-[#C4B5FD]">Batal</button>
                <button type="button" onClick={tolak} disabled={saving || !alasan.trim()}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FEE2E2] text-sm font-bold text-[#DC2626] disabled:opacity-50 lg:bg-[#DC2626] lg:text-white">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Tolak
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Guru pembimbing (opsional)</label>
              <select value={guruId} onChange={(e) => setGuruId(e.target.value)} className={FIELD}>
                <option value="">Tetapkan nanti</option>
                {guruList.map((g) => <option key={g.id} value={g.id}>{g.user.nama}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTolakMode(true)} disabled={saving}
                  className="flex h-12 items-center gap-1.5 rounded-xl bg-[#FEE2E2] px-5 text-sm font-bold text-[#DC2626] disabled:opacity-50">
                  <XCircle size={15} /> Tolak
                </button>
                <button type="button" onClick={verifikasi} disabled={saving || !p.suratKeteranganUrl}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50 lg:bg-[#22A06B]">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Verifikasi
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div></Portal>
  );
}
