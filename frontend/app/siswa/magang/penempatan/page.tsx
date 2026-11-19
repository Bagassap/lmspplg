"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { DaftarInstansiList, useDaftarInstansi } from "@/components/magang/DaftarInstansiList";
import { FormInstansiPkl } from "@/components/magang/FormInstansiPkl";
import { StatusPenempatanSiswa } from "@/components/magang/StatusPenempatanSiswa";
import { STATUS_PENDAFTARAN_CFG, STATUS_PENEMPATAN_CFG, type Instansi, type PendaftaranSaya, type PenempatanMagang } from "@/components/magang/types";

export default function SiswaMagangPenempatanPage() {
  const instansi = useDaftarInstansi();
  const [list, setList] = useState<PenempatanMagang[]>([]);
  const [daftar, setDaftar] = useState<PendaftaranSaya | null>(null);
  const [loading, setLoading] = useState(true);
  const [dipilih, setDipilih] = useState<Instansi | null>(null);

  const reload = useCallback(() => {
    Promise.all([
      fetch("/api/magang/penempatan/saya", { cache: "no-store" }).then((r) => r.json()).then((d) => setList(Array.isArray(d) ? d : [])),
      fetch("/api/magang/pendaftaran/saya", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setDaftar(d?.profil ? d : null)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const berjalan = list.find((p) => p.status === "AKTIF") ?? list.find((p) => p.status === "MENUNGGU");
  const riwayat = list.filter((p) => p.status === "SELESAI" || p.status === "BATAL");
  const terverifikasi = daftar?.pendaftaran?.status === "DITERIMA";
  const bolehIsi = !berjalan && terverifikasi;

  function terkirim() {
    setDipilih(null);
    reload();
    instansi.reload();
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:p-1">
      <div className="space-y-4">
        {loading ? (
          <div className="h-72 animate-pulse rounded-3xl bg-white dark:bg-slate-800" />
        ) : berjalan ? (
          <StatusPenempatanSiswa p={berjalan} onChanged={reload} />
        ) : !terverifikasi ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-sm dark:bg-slate-800">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><Lock size={24} /></span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">Penempatan belum bisa diisi</p>
            <p className="max-w-sm text-xs text-slate-600 dark:text-slate-300">
              {!daftar?.pendaftaran
                ? "Kamu belum mendaftar PKL. Isi formulir di menu Daftar terlebih dahulu."
                : `Status pendaftaran: ${STATUS_PENDAFTARAN_CFG[daftar.pendaftaran.status].label}. Penempatan terbuka setelah pendaftaran diverifikasi admin.`}
            </p>
            <Link href="/siswa/magang/daftar" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3E03B3] px-4 text-xs font-bold text-white">
              Buka menu Daftar <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <FormInstansiPkl dipilih={dipilih} onBatalPilih={() => setDipilih(null)} onTerkirim={terkirim} />
        )}

        {riwayat.length > 0 && (
          <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <p className="mb-2 text-sm font-bold text-slate-800 dark:text-white">Riwayat Penempatan</p>
            <div className="space-y-2">
              {riwayat.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-2xl bg-[#F1EDFA] px-3.5 py-2.5 dark:bg-slate-700">
                  <p className="min-w-0 truncate text-sm font-bold text-slate-900 dark:text-white">{p.tempatMagang.namaTempat}</p>
                  <span className="shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-bold" style={{ background: STATUS_PENEMPATAN_CFG[p.status].bg, color: STATUS_PENEMPATAN_CFG[p.status].clr }}>
                    {STATUS_PENEMPATAN_CFG[p.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DaftarInstansiList list={instansi.list} loading={instansi.loading}
        onPilih={bolehIsi ? (i) => { setDipilih(i); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined}
        pilihId={dipilih?.id ?? null} />
    </div>
  );
}
