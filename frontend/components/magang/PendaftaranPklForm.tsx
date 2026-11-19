"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Building2, CheckCircle2, ChevronRight, ClipboardList, Clock, Loader2, MapPin, Phone, Send, User, XCircle } from "lucide-react";
import { PilihTempatModal } from "./PilihTempatModal";
import { useToast } from "@/components/shared/ToastSystem";
import { AlamatFields, PklInput, PKL_CAP, PKL_FIELD, WA_VALID, alamatLengkap, pesanError } from "./pkl-form-ui";
import { STATUS_PENDAFTARAN_CFG, formatAlamat, type Alamat, type Instansi, type PendaftaranSaya } from "./types";

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
  const [modalTempat, setModalTempat] = useState(false);

  const p = data.pendaftaran;
  const terkunci = p?.status === "DITERIMA";
  const status = p ? STATUS_PENDAFTARAN_CFG[p.status] : null;
  const instansiTerpilih = instansi.find((i) => i.id === tempatId);
  const alamatTempat = instansiTerpilih && formatAlamat(instansiTerpilih) !== "-" ? formatAlamat(instansiTerpilih) : null;
  const tempatTerpilih = instansi.find((i) => i.id === tempatId) ?? (tempatId && p?.tempatMagang?.id === tempatId ? { namaTempat: p.tempatMagang.namaTempat } : null);

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

  if (p?.status === "MENUNGGU") {
    const baris = [
      { icon: User, label: "Nama", value: `${data.profil.nama} · ${data.profil.kelas} · NIS ${data.profil.nis}`, bg: "#F1EDFA", fg: "#3E03B3" },
      { icon: MapPin, label: "Alamat", value: formatAlamat(p), bg: "#FFE9E2", fg: "#E8562B" },
      { icon: Phone, label: "WA aktif", value: p.noWa, bg: "#E4F5EC", fg: "#22A06B" },
      { icon: Building2, label: "Tempat PKL", value: p.tempatMagang?.namaTempat ?? "Belum ada / instansi lain", bg: "#E0F2FE", fg: "#0EA5E9" },
    ];
    return (
      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: "#F1EDFA", color: "#3E03B3" }}>
            <Clock size={30} />
          </span>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">Menunggu verifikasi admin</p>
          <span className="rounded-xl px-3 py-1 text-[11px] font-bold" style={{ background: STATUS_PENDAFTARAN_CFG.MENUNGGU.bg, color: STATUS_PENDAFTARAN_CFG.MENUNGGU.clr }}>
            {STATUS_PENDAFTARAN_CFG.MENUNGGU.label}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          {baris.map((x) => (
            <div key={x.label} className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-700">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: x.bg, color: x.fg }}><x.icon size={15} /></span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{x.label}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{x.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
                ? "Ambil surat permohonan PKL di Gedung G Lab PPLG, lalu isi data instansi di kategori Penempatan."
                : p.status === "DITOLAK"
                  ? `Alasan: ${p.alasanTolak ?? "-"}. Perbaiki data lalu kirim ulang.`
                  : ""}
            </p>
            {p.status === "DITERIMA" && (
              <button type="button" onClick={onLanjut}
                className="mt-2.5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#22A06B] px-4 text-xs font-bold text-white">
                Isi penempatan <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#E0F2FE", color: "#0EA5E9" }}><ClipboardList size={18} /></span>
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
            <button type="button" onClick={() => setModalTempat(true)} disabled={terkunci || instansiLoading}
              className={`${PKL_FIELD} flex items-center gap-2 text-left`}>
              <Building2 size={16} className="shrink-0 text-[#E8562B]" />
              <span className={`min-w-0 flex-1 truncate ${tempatTerpilih ? "" : "text-slate-500 dark:text-slate-400"}`}>
                {instansiLoading ? "Memuat daftar instansi…" : tempatTerpilih?.namaTempat ?? "Belum ada / instansi lain"}
              </span>
              {!terkunci && <ChevronRight size={16} className="shrink-0 text-[#F26A3D]" />}
            </button>
            {alamatTempat && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <MapPin size={12} className="mt-0.5 shrink-0 text-[#E8562B]" /> {alamatTempat}
              </p>
            )}
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

      <AnimatePresence>
        {modalTempat && (
          <PilihTempatModal list={instansi} nilai={tempatId} jenisKelamin={data.profil.jenisKelamin} onPilih={setTempatId} onClose={() => setModalTempat(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
