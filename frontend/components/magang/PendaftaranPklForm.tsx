"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Clock, Loader2, Send, XCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { AlamatFields, PklInput, PKL_CAP, PKL_FIELD, WA_VALID, alamatLengkap, pesanError } from "./pkl-form-ui";
import { STATUS_PENDAFTARAN_CFG, type Alamat, type Instansi, type PendaftaranSaya } from "./types";

function ambilAlamat(src: Alamat): Alamat {
  return { dukuh: src.dukuh ?? "", rt: src.rt ?? "", rw: src.rw ?? "", desa: src.desa ?? "", kecamatan: src.kecamatan ?? "", kabupaten: src.kabupaten ?? "" };
}

export function PendaftaranPklForm({ data, onChange, instansi, instansiLoading, onLanjut }: {
  data: PendaftaranSaya;
  onChange: (d: PendaftaranSaya) => void;
  instansi: Instansi[];
  instansiLoading: boolean;
  onLanjut: () => void;
}) {
  const toast = useToast();
  const [alamat, setAlamat] = useState<Alamat>(() => ambilAlamat(data.pendaftaran ?? data.profil));
  const [noWa, setNoWa] = useState(data.pendaftaran?.noWa ?? data.profil.noHp ?? "");
  const [tempatId, setTempatId] = useState(data.pendaftaran?.tempatMagangId ?? "");
  const [saving, setSaving] = useState(false);

  const p = data.pendaftaran;
  const terkunci = p?.status === "DITERIMA";
  const status = p ? STATUS_PENDAFTARAN_CFG[p.status] : null;

  async function kirim() {
    if (!alamatLengkap(alamat)) { toast.error("Lengkapi alamat", "Dukuh, RT, RW, desa, kecamatan, dan kabupaten wajib diisi."); return; }
    if (!WA_VALID.test(noWa.trim())) { toast.error("Nomor WA tidak valid", "Isi nomor WA aktif, contoh 081234567890."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/magang/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...alamat, noWa: noWa.trim(), tempatMagangId: tempatId || null }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.profil) {
        onChange(d);
        toast.success(p ? "Pendaftaran diperbarui" : "Pendaftaran terkirim", "Menunggu verifikasi admin.");
      } else {
        toast.error(pesanError(d, "Gagal mengirim pendaftaran"), "");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {p && status && (
        <div className="flex items-start gap-3 rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: status.bg, color: status.clr }}>
            {p.status === "DITERIMA" ? <CheckCircle2 size={20} /> : p.status === "DITOLAK" ? <XCircle size={20} /> : <Clock size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {p.status === "DITERIMA" ? "Pendaftaran terverifikasi" : p.status === "DITOLAK" ? "Pendaftaran ditolak" : "Menunggu verifikasi admin"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {p.status === "DITERIMA"
                ? "Lanjutkan dengan mengisi data instansi di kategori Penempatan."
                : p.status === "DITOLAK"
                  ? `Alasan: ${p.alasanTolak ?? "-"}. Perbaiki data lalu kirim ulang.`
                  : "Data masih bisa diperbarui selama belum diverifikasi."}
            </p>
            {p.status === "DITERIMA" && (
              <button type="button" onClick={onLanjut}
                className="mt-2.5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#3E03B3] px-4 text-xs font-bold text-white">
                Isi penempatan <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><ClipboardList size={18} /></span>
          <p className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Formulir Pendaftaran PKL</p>
        </div>

        <div className="space-y-3">
          <PklInput label="Nama" readOnly value={data.profil.nama} />
          <div className="grid grid-cols-2 gap-3">
            <PklInput label="Kelas" readOnly value={data.profil.kelas} />
            <PklInput label="NIS" readOnly value={data.profil.nis} />
          </div>

          <div>
            <p className={PKL_CAP}>Alamat</p>
            <AlamatFields value={alamat} onChange={setAlamat} disabled={terkunci} />
          </div>

          <PklInput label="Nomor WA aktif" wajib inputMode="tel" placeholder="08xxxxxxxxxx" value={noWa} disabled={terkunci}
            onChange={(e) => setNoWa(e.target.value.replace(/[^0-9+\s-]/g, ""))} />

          <div>
            <label className={PKL_CAP}>Tempat PKL</label>
            <select value={tempatId} disabled={terkunci || instansiLoading} onChange={(e) => setTempatId(e.target.value)} className={PKL_FIELD}>
              <option value="">{instansiLoading ? "Memuat daftar instansi…" : "Belum ada / instansi lain"}</option>
              {instansi
                .filter((i) => i.id === tempatId || i.sisa === null || i.sisa > 0)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.namaTempat}{i.sisa !== null ? ` (sisa kuota ${i.sisa})` : ""}
                  </option>
                ))}
            </select>
          </div>

          {!terkunci && (
            <button type="button" onClick={kirim} disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {!p ? "Daftar PKL" : p.status === "DITOLAK" ? "Kirim ulang pendaftaran" : "Perbarui pendaftaran"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
