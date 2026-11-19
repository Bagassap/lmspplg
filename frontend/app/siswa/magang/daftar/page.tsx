"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Clock, Loader2, Send, XCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { DaftarInstansiList, useDaftarInstansi } from "@/components/magang/DaftarInstansiList";
import { ALAMAT_KOSONG, AlamatFields, PklInput, PKL_CAP, WA_VALID, alamatLengkap, pesanError } from "@/components/magang/pkl-form-ui";
import { STATUS_PENDAFTARAN_CFG, type Alamat, type PendaftaranSaya } from "@/components/magang/types";

function ambilAlamat(src: Alamat): Alamat {
  return { dukuh: src.dukuh ?? "", rt: src.rt ?? "", rw: src.rw ?? "", desa: src.desa ?? "", kecamatan: src.kecamatan ?? "", kabupaten: src.kabupaten ?? "" };
}

export default function SiswaDaftarPklPage() {
  const toast = useToast();
  const instansi = useDaftarInstansi();
  const [data, setData] = useState<PendaftaranSaya | null>(null);
  const [loading, setLoading] = useState(true);
  const [alamat, setAlamat] = useState<Alamat>(ALAMAT_KOSONG);
  const [noWa, setNoWa] = useState("");
  const [saving, setSaving] = useState(false);

  const isi = useCallback((d: PendaftaranSaya) => {
    setData(d);
    const sumber = d.pendaftaran ?? d.profil;
    setAlamat(ambilAlamat(sumber));
    setNoWa(d.pendaftaran?.noWa ?? d.profil.noHp ?? "");
  }, []);

  useEffect(() => {
    fetch("/api/magang/pendaftaran/saya", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PendaftaranSaya | null) => { if (d?.profil) isi(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isi]);

  const p = data?.pendaftaran ?? null;
  const terkunci = p?.status === "DITERIMA";

  async function kirim() {
    if (!alamatLengkap(alamat)) { toast.error("Lengkapi alamat", "Dukuh, RT, RW, desa, kecamatan, dan kabupaten wajib diisi."); return; }
    if (!WA_VALID.test(noWa.trim())) { toast.error("Nomor WA tidak valid", "Isi nomor WA aktif, contoh 081234567890."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/magang/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...alamat, noWa: noWa.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.profil) {
        isi(d);
        toast.success(p ? "Pendaftaran diperbarui" : "Pendaftaran terkirim", "Menunggu verifikasi admin.");
      } else {
        toast.error(pesanError(d, "Gagal mengirim pendaftaran"), "");
      }
    } finally {
      setSaving(false);
    }
  }

  const status = p ? STATUS_PENDAFTARAN_CFG[p.status] : null;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2 lg:p-1">
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
                  ? "Lanjutkan dengan mengisi data instansi di menu Penempatan."
                  : p.status === "DITOLAK"
                    ? `Alasan: ${p.alasanTolak ?? "-"}. Perbaiki data lalu kirim ulang.`
                    : "Data masih bisa diperbarui selama belum diverifikasi."}
              </p>
              {p.status === "DITERIMA" && (
                <Link href="/siswa/magang/penempatan"
                  className="mt-2.5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#3E03B3] px-4 text-xs font-bold text-white">
                  Isi penempatan <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><ClipboardList size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">Formulir Pendaftaran PKL</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Isi data diri dengan benar. Setelah diverifikasi admin, kamu bisa mengisi penempatan.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-11 animate-pulse rounded-2xl bg-[#F1EDFA] dark:bg-slate-700" />)}</div>
          ) : !data ? (
            <p className="rounded-2xl bg-[#FFE9E2] p-3.5 text-xs font-bold text-[#E8562B]">Profil siswa tidak ditemukan. Hubungi admin.</p>
          ) : (
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

              {!terkunci && (
                <button type="button" onClick={kirim} disabled={saving}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {!p ? "Daftar PKL" : p.status === "DITOLAK" ? "Kirim ulang pendaftaran" : "Perbarui pendaftaran"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <DaftarInstansiList list={instansi.list} loading={instansi.loading} judul="Daftar Tempat PKL" />
    </div>
  );
}
