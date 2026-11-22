"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, ClipboardList, FileText, Lock } from "lucide-react";
import { DaftarInstansiList, useDaftarInstansi } from "@/components/magang/DaftarInstansiList";
import { FormInstansiPkl } from "@/components/magang/FormInstansiPkl";
import { PendaftaranPklForm } from "@/components/magang/PendaftaranPklForm";
import { StatusPenempatanSiswa } from "@/components/magang/StatusPenempatanSiswa";
import { STATUS_PENDAFTARAN_CFG, STATUS_PENEMPATAN_CFG, type Instansi, type PendaftaranSaya, type PenempatanMagang } from "@/components/magang/types";
import { useAutoRefresh } from "@/lib/useAutoRefresh";

type Kategori = "daftar" | "penempatan";

const KATEGORI: { key: Kategori; label: string; icon: typeof Building2; warna: string }[] = [
  { key: "daftar", label: "Daftar", icon: ClipboardList, warna: "#3E03B3" },
  { key: "penempatan", label: "Penempatan", icon: Building2, warna: "#F26A3D" },
];

export default function SiswaMagangPenempatanPage() {
  const instansi = useDaftarInstansi();
  const [list, setList] = useState<PenempatanMagang[]>([]);
  const [daftar, setDaftar] = useState<PendaftaranSaya | null>(null);
  const [loading, setLoading] = useState(true);
  const [kategoriPilihan, setKategori] = useState<Kategori | null>(null);
  const [pilihanManual, setDipilih] = useState<Instansi | null | undefined>(undefined);

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
  const kategori: Kategori = kategoriPilihan ?? (berjalan || terverifikasi ? "penempatan" : "daftar");
  const bolehIsi = kategori === "penempatan" && !berjalan && terverifikasi;
  const menungguAdmin = daftar?.pendaftaran?.status === "MENUNGGU" || berjalan?.status === "MENUNGGU";
  useAutoRefresh(reload, 3_000, menungguAdmin);

  const rencanaId = daftar?.pendaftaran?.tempatMagangId ?? null;
  const rencana = instansi.list.find((x) => x.id === rencanaId) ?? null;
  const dipilih = pilihanManual === undefined ? rencana : pilihanManual;

  function terkirim() {
    setDipilih(undefined);
    reload();
    instansi.reload();
  }

  const panelDaftar = loading ? (
    <div className="h-96 animate-pulse rounded-3xl bg-white dark:bg-slate-800" />
  ) : !daftar ? (
    <p className="rounded-3xl bg-[#FFE9E2] p-5 text-sm font-bold text-[#E8562B]">Profil siswa tidak ditemukan. Hubungi admin.</p>
  ) : (
    <PendaftaranPklForm data={daftar} onChange={setDaftar} instansi={instansi.list} instansiLoading={instansi.loading}
      onLanjut={() => setKategori("penempatan")} />
  );

  const panelPenempatan = (
    <div className="space-y-4">
      {loading ? (
        <div className="h-72 animate-pulse rounded-3xl bg-white dark:bg-slate-800" />
      ) : berjalan ? (
        <StatusPenempatanSiswa p={berjalan} onChanged={reload} />
      ) : !terverifikasi ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-sm dark:bg-slate-800">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#FFF4E0", color: "#D97706" }}><Lock size={24} /></span>
          <p className="text-base font-extrabold text-slate-900 dark:text-white">Penempatan belum bisa diisi</p>
          <p className="max-w-sm text-xs text-slate-600 dark:text-slate-300">
            {!daftar?.pendaftaran
              ? "Kamu belum mendaftar PKL. Isi formulir di kategori Daftar terlebih dahulu."
              : `Status pendaftaran: ${STATUS_PENDAFTARAN_CFG[daftar.pendaftaran.status].label}. Penempatan terbuka setelah pendaftaran diverifikasi admin.`}
          </p>
          <button type="button" onClick={() => setKategori("daftar")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3E03B3] px-4 text-xs font-bold text-white">
            Buka Daftar <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <>
        <div className="flex items-start gap-3 rounded-3xl p-4" style={{ background: "#FFF4E0" }}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#D97706] dark:bg-slate-800"><FileText size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[#B45309] dark:text-[#FBBF24]">Ambil surat permohonan PKL</p>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              Pendaftaranmu sudah diverifikasi. Ambil surat permohonan PKL di <b>Gedung G Lab PPLG</b>, serahkan ke instansi, lalu isi form penempatan di bawah ini beserta bukti surat dari instansi.
            </p>
          </div>
        </div>
        <FormInstansiPkl key={dipilih?.id ?? "manual"} awal={dipilih} onTerkirim={terkirim} />
        </>
      )}

      {riwayat.length > 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <p className="mb-2 text-sm font-bold text-slate-800 dark:text-white">Riwayat Penempatan</p>
          <div className="space-y-2">
            {riwayat.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-700">
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
  );

  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_17rem] xl:grid-cols-[17rem_minmax(0,1fr)_20rem] lg:p-1">
      <div>
        <div className="hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800 lg:block">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</p>
          <div className="flex flex-col gap-4">
            {KATEGORI.map((k) => {
              const aktif = kategori === k.key;
              return (
                <button key={k.key} type="button" onClick={() => setKategori(k.key)}
                  className="relative flex h-20 items-center gap-3 overflow-hidden rounded-2xl px-4 text-left text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: k.warna,
                    boxShadow: aktif ? `0 8px 24px ${k.warna}59` : "0 8px 24px rgba(0,0,0,0.15)",
                    outline: aktif ? `2px solid ${k.warna}` : "none",
                    outlineOffset: "3px",
                  }}>
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/20"><k.icon size={16} /></div>
                  <p className="relative min-w-0 flex-1 truncate text-lg font-black leading-tight">{k.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="isolate flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm dark:bg-slate-800 lg:hidden">
          {KATEGORI.map((k) => {
            const aktif = kategori === k.key;
            return (
              <button key={k.key} type="button" onClick={() => setKategori(k.key)}
                className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors"
                style={{ color: aktif ? "#fff" : "#94a3b8" }}>
                {aktif && (
                  <motion.span layoutId="penempatanPklTabPill" className="absolute inset-0 rounded-xl"
                    style={{ background: k.warna }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5"><k.icon size={15} /> {k.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {kategori === "daftar" ? panelDaftar : panelPenempatan}

      <DaftarInstansiList list={instansi.list} loading={instansi.loading} judul="Daftar Instansi PKL" mode={kategori === "penempatan" ? "ditempati" : "daftar"}
        onPilih={bolehIsi ? (i) => { setDipilih(i); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined}
        pilihId={kategori === "penempatan" ? dipilih?.id ?? null : null}
        jenisKelaminSiswa={daftar?.profil.jenisKelamin} />
    </div>
  );
}
