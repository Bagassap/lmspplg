"use client";

import { useRef, useState } from "react";
import { Building2, FileText, Loader2, Send, Upload, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ALAMAT_KOSONG, AlamatFields, PklInput, PKL_CAP, WA_VALID, alamatLengkap, pesanError } from "./pkl-form-ui";
import type { Alamat, Instansi } from "./types";

const MAKS_SURAT = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";

export function FormInstansiPkl({ awal, onTerkirim }: {
  awal: Instansi | null;
  onTerkirim: () => void;
}) {
  const toast = useToast();
  const [namaTempat, setNamaTempat] = useState(awal?.namaTempat ?? "");
  const [namaPimpinan, setNamaPimpinan] = useState(awal?.namaPimpinan ?? "");
  const [alamat, setAlamat] = useState<Alamat>(() => awal
    ? { dukuh: awal.dukuh ?? "", rt: awal.rt ?? "", rw: awal.rw ?? "", desa: awal.desa ?? "", kecamatan: awal.kecamatan ?? "", kabupaten: awal.kabupaten ?? "" }
    : ALAMAT_KOSONG);
  const [noWa, setNoWa] = useState(awal?.noWaUsaha ?? "");
  const [surat, setSurat] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  function pilihBerkas(f?: File | null) {
    if (f && f.size > MAKS_SURAT) { toast.error("Berkas terlalu besar", "Ukuran maksimal 10 MB."); return; }
    setSurat(f ?? null);
  }

  async function kirim() {
    if (!namaTempat.trim() || !namaPimpinan.trim()) { toast.error("Lengkapi data instansi", "Nama instansi dan nama kepala instansi wajib diisi."); return; }
    if (!alamatLengkap(alamat)) { toast.error("Lengkapi alamat instansi", "Dukuh, RT, RW, desa, kecamatan, dan kabupaten wajib diisi."); return; }
    if (!WA_VALID.test(noWa.trim())) { toast.error("Nomor WA instansi tidak valid", "Contoh: 081234567890."); return; }
    if (!surat) { toast.error("Upload bukti surat instansi", "Berkas ini wajib diunggah."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("tempatBaru", JSON.stringify({ namaTempat: namaTempat.trim(), namaPimpinan: namaPimpinan.trim(), ...alamat, noWaUsaha: noWa.trim() }));
      fd.append("surat", surat);
      const res = await fetch("/api/magang/penempatan/ajukan", { method: "POST", body: fd });
      if (res.ok) {
        toast.success("Penempatan terkirim", "Menunggu verifikasi admin dan penetapan guru pembimbing.");
        onTerkirim();
      } else {
        toast.error(pesanError(await res.json().catch(() => null), "Gagal mengirim penempatan"), "");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FFE9E2", color: "#E8562B" }}><Building2 size={18} /></span>
        <p className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Formulir Penempatan PKL</p>
      </div>

      <div className="space-y-3">
        <PklInput label="Nama instansi" wajib placeholder="Nama perusahaan / instansi" value={namaTempat} onChange={(e) => setNamaTempat(e.target.value)} />
        <PklInput label="Nama kepala instansi" wajib value={namaPimpinan} onChange={(e) => setNamaPimpinan(e.target.value)} />
        <div>
          <p className={PKL_CAP}>Alamat instansi</p>
          <AlamatFields value={alamat} onChange={setAlamat} />
        </div>
        <PklInput label="Nomor WA instansi aktif" wajib inputMode="tel" placeholder="08xxxxxxxxxx" value={noWa}
          onChange={(e) => setNoWa(e.target.value.replace(/[^0-9+\s-]/g, ""))} />

        <div>
          <label className={PKL_CAP}>Upload bukti surat instansi <span className="text-[#E8562B]">*</span></label>
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pilihBerkas(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-[#0EA5E9]/40 bg-[#E0F2FE]/60 px-4 py-2.5 text-left dark:bg-slate-700">
            {surat ? <FileText size={16} className="shrink-0 text-[#22A06B]" /> : <Upload size={16} className="shrink-0 text-[#0EA5E9]" />}
            <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${surat ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
              {surat ? surat.name : "Pilih berkas surat (PDF, Word, atau foto)"}
            </span>
            {surat && (
              <span role="button" aria-label="Hapus berkas" onClick={(e) => { e.stopPropagation(); setSurat(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-[#E8562B] dark:bg-slate-800"><X size={13} /></span>
            )}
          </button>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">Surat balasan/keterangan dari instansi. Maksimal 10 MB.</p>
        </div>

        <button type="button" onClick={kirim} disabled={saving || !surat}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Kirim penempatan
        </button>
      </div>
    </div>
  );
}
