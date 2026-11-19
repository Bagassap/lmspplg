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

const WARNA = {
  ungu: ["#F1EDFA", "#3E03B3"],
  oranye: ["#FFE9E2", "#E8562B"],
  hijau: ["#F6FEE8", "#5D900F"],
  biru: ["#E0F2FE", "#0EA5E9"],
  amber: ["#FFF4E0", "#D97706"],
} as const;

function Baris({ icon: Icon, label, value, warna = "ungu" }: { icon: typeof MapPin; label: string; value: React.ReactNode; warna?: keyof typeof WARNA }) {
  const [bg, fg] = WARNA[warna];
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-700">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: bg, color: fg }}><Icon size={15} /></span>
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
        <p className={`min-w-0 flex-1 text-base font-extrabold ${aktif ? "text-white" : "text-slate-900 dark:text-white"}`}>{aktif ? t.namaTempat : "Penempatan terkirim"}</p>
        <span className={`shrink-0 rounded-xl px-3 py-1 text-[11px] font-bold ${aktif ? "bg-white/20 text-white" : ""}`}
          style={aktif ? undefined : { background: cfg.bg, color: cfg.clr }}>{cfg.label}</span>
      </div>

      <div className="space-y-2 p-5 pt-0">
        {!aktif && <Baris warna="oranye" icon={Building2} label="Instansi" value={t.namaTempat} />}
        {t.namaPimpinan && <Baris warna="biru" icon={User} label="Kepala instansi" value={t.namaPimpinan} />}
        <Baris warna="oranye" icon={MapPin} label="Alamat" value={formatAlamat(t)} />
        {(t.noWaUsaha ?? t.kontak) && <Baris warna="hijau" icon={Phone} label="WA instansi" value={t.noWaUsaha ?? t.kontak} />}
        {aktif && <Baris icon={UserCheck} label="Guru pembimbing" value={toTitleCase(p.guruPembimbing?.user.nama ?? "-")} />}
        <Baris warna="amber" icon={CalendarDays} label={aktif ? "Mulai PKL" : "Diajukan"} value={fmt(aktif ? p.tanggalMulai : p.createdAt)} />
        {p.suratKeteranganUrl && (
          <a href={`/api/uploads${p.suratKeteranganUrl}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-2xl bg-[#E0F2FE] p-3 text-xs font-bold text-[#0369A1] dark:bg-slate-700 dark:text-[#7DD3FC]">
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
