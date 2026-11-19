"use client";

import { useRef, useState } from "react";
import { Building2, CalendarDays, Clock, FileText, Loader2, MapPin, Phone, Upload, User, UserCheck } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { toTitleCase } from "@/components/data-siswa/shared";
import { pesanError } from "./pkl-form-ui";
import { STATUS_PENEMPATAN_CFG, formatAlamat, type PenempatanMagang } from "./types";

const MAKS_SURAT = 10 * 1024 * 1024;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

function Baris({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-[#F1EDFA] p-3 dark:bg-slate-700">
      <Icon size={15} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export function StatusPenempatanSiswa({ p, onChanged }: { p: PenempatanMagang; onChanged: () => void }) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const t = p.tempatMagang;
  const aktif = p.status === "AKTIF";
  const cfg = STATUS_PENEMPATAN_CFG[p.status];

  async function unggah(f?: File) {
    if (!f) return;
    if (f.size > MAKS_SURAT) { toast.error("Berkas terlalu besar", "Ukuran maksimal 10 MB."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("surat", f);
      const res = await fetch("/api/magang/penempatan/saya/surat", { method: "POST", body: fd });
      if (res.ok) { toast.success("Surat terkirim", "Admin dapat memeriksa suratmu."); onChanged(); }
      else toast.error(pesanError(await res.json().catch(() => null), "Gagal mengunggah surat"), "");
    } finally {
      setSaving(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-slate-800">
      <div className="flex items-center gap-3 p-5" style={{ background: aktif ? "#3E03B3" : undefined }}>
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${aktif ? "bg-white/20 text-white" : "bg-[#FFE9E2] text-[#E8562B]"}`}>
          {aktif ? <Building2 size={22} /> : <Clock size={22} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-base font-extrabold ${aktif ? "text-white" : "text-slate-900 dark:text-white"}`}>{aktif ? t.namaTempat : "Penempatan terkirim"}</p>
          <p className={`text-xs ${aktif ? "text-white/80" : "text-slate-600 dark:text-slate-300"}`}>
            {aktif ? "Penempatan PKL kamu sudah diverifikasi." : "Menunggu admin memverifikasi dan menetapkan guru pembimbing."}
          </p>
        </div>
        <span className={`shrink-0 rounded-xl px-3 py-1 text-[11px] font-bold ${aktif ? "bg-white/20 text-white" : ""}`}
          style={aktif ? undefined : { background: cfg.bg, color: cfg.clr }}>{cfg.label}</span>
      </div>

      <div className="space-y-2 p-5 pt-0">
        {!aktif && <Baris icon={Building2} label="Instansi" value={t.namaTempat} />}
        {t.namaPimpinan && <Baris icon={User} label="Kepala instansi" value={t.namaPimpinan} />}
        <Baris icon={MapPin} label="Alamat" value={formatAlamat(t)} />
        {(t.noWaUsaha ?? t.kontak) && <Baris icon={Phone} label="WA instansi" value={t.noWaUsaha ?? t.kontak} />}
        {aktif && <Baris icon={UserCheck} label="Guru pembimbing" value={toTitleCase(p.guruPembimbing?.user.nama ?? "-")} />}
        <Baris icon={CalendarDays} label={aktif ? "Mulai PKL" : "Diajukan"} value={fmt(aktif ? p.tanggalMulai : p.createdAt)} />
        {p.suratKeteranganUrl && (
          <a href={`/api/uploads${p.suratKeteranganUrl}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-2xl bg-[#F1EDFA] p-3 text-xs font-bold text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]">
            <FileText size={14} className="shrink-0" /> <span className="truncate underline">Surat instansi: {p.suratKeteranganNama ?? "Lihat berkas"}</span>
          </a>
        )}
        {!aktif && !p.suratKeteranganUrl && (
          <div className="rounded-2xl bg-[#FFE9E2] p-3.5">
            <p className="text-xs font-bold text-[#E8562B]">Bukti surat instansi belum diunggah. Admin baru bisa memverifikasi setelah surat terkirim.</p>
            <input ref={ref} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => unggah(e.target.files?.[0])} />
            <button type="button" onClick={() => ref.current?.click()} disabled={saving}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-xs font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Unggah surat instansi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
