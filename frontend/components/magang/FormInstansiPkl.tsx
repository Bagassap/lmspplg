"use client";

import { useRef, useState } from "react";
import { Building2, FileText, Loader2, MapPin, Pencil, Phone, Send, Upload, User, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ALAMAT_KOSONG, AlamatFields, PklInput, PKL_CAP, WA_VALID, alamatLengkap, pesanError } from "./pkl-form-ui";
import { formatAlamat, type Alamat, type Instansi } from "./types";

const MAKS_SURAT = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";

export function FormInstansiPkl({ dipilih, onBatalPilih, onTerkirim }: {
  dipilih: Instansi | null;
  onBatalPilih: () => void;
  onTerkirim: () => void;
}) {
  const toast = useToast();
  const [namaTempat, setNamaTempat] = useState("");
  const [namaPimpinan, setNamaPimpinan] = useState("");
  const [alamat, setAlamat] = useState<Alamat>(ALAMAT_KOSONG);
  const [noWa, setNoWa] = useState("");
  const [surat, setSurat] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  function pilihBerkas(f?: File | null) {
    if (f && f.size > MAKS_SURAT) { toast.error("Berkas terlalu besar", "Ukuran maksimal 10 MB."); return; }
    setSurat(f ?? null);
  }

  async function kirim() {
    if (!dipilih) {
      if (!namaTempat.trim() || !namaPimpinan.trim()) { toast.error("Lengkapi data instansi", "Nama instansi dan nama kepala instansi wajib diisi."); return; }
      if (!alamatLengkap(alamat)) { toast.error("Lengkapi alamat instansi", "Dukuh, RT, RW, desa, kecamatan, dan kabupaten wajib diisi."); return; }
      if (!WA_VALID.test(noWa.trim())) { toast.error("Nomor WA instansi tidak valid", "Contoh: 081234567890."); return; }
    }
    if (!surat) { toast.error("Upload bukti surat instansi", "Berkas ini wajib diunggah."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      if (dipilih) fd.append("tempatMagangId", dipilih.id);
      else fd.append("tempatBaru", JSON.stringify({ namaTempat: namaTempat.trim(), namaPimpinan: namaPimpinan.trim(), ...alamat, noWaUsaha: noWa.trim() }));
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
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><Building2 size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold text-slate-900 dark:text-white">Formulir Penempatan PKL</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Isi data instansi tempat PKL, atau pilih instansi yang sudah ada di daftar.</p>
        </div>
      </div>

      <div className="space-y-3">
        {dipilih ? (
          <div className="flex items-start gap-3 rounded-2xl bg-[#F1EDFA] p-3.5 dark:bg-slate-700">
            <div className="min-w-0 flex-1 space-y-1 text-xs text-slate-700 dark:text-slate-200">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{dipilih.namaTempat}</p>
              {dipilih.namaPimpinan && <p className="flex items-start gap-1.5"><User size={12} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> {dipilih.namaPimpinan}</p>}
              <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> {formatAlamat(dipilih)}</p>
              {dipilih.noWaUsaha && <p className="flex items-center gap-1.5"><Phone size={12} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> {dipilih.noWaUsaha}</p>}
            </div>
            <button type="button" onClick={onBatalPilih}
              className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-white px-2.5 text-[11px] font-bold text-[#3E03B3] dark:bg-slate-800 dark:text-[#C4B5FD]">
              <Pencil size={12} /> Isi manual
            </button>
          </div>
        ) : (
          <>
            <PklInput label="Nama instansi" wajib placeholder="Nama perusahaan / instansi" value={namaTempat} onChange={(e) => setNamaTempat(e.target.value)} />
            <PklInput label="Nama kepala instansi" wajib value={namaPimpinan} onChange={(e) => setNamaPimpinan(e.target.value)} />
            <div>
              <p className={PKL_CAP}>Alamat instansi</p>
              <AlamatFields value={alamat} onChange={setAlamat} />
            </div>
            <PklInput label="Nomor WA instansi aktif" wajib inputMode="tel" placeholder="08xxxxxxxxxx" value={noWa}
              onChange={(e) => setNoWa(e.target.value.replace(/[^0-9+\s-]/g, ""))} />
          </>
        )}

        <div>
          <label className={PKL_CAP}>Upload bukti surat instansi <span className="text-[#E8562B]">*</span></label>
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pilihBerkas(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-[#F1EDFA] px-4 py-2.5 text-left dark:bg-slate-700">
            {surat ? <FileText size={16} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> : <Upload size={16} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />}
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
