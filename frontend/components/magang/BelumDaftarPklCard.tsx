"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck, UserX, X } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { Portal } from "@/components/shared/Portal";
import { TablePager, usePagedList } from "@/components/shared/TablePager";
import { avatarColorFor, kelasShort } from "@/components/data-siswa/shared";
import { namaSiswa } from "@/lib/nama";
import { useAutoRefresh } from "@/lib/useAutoRefresh";

type SiswaBelum = { id: string; nis: string; nama: string; fotoProfil: string | null; ditolak?: boolean };
type KelasBelum = { id: string; nama: string; total: number; siswa: SiswaBelum[] };

const BATAS_KARTU = 5;
const KOLOM_MODAL = "2.5rem minmax(0,1fr) 7rem";

function labelKelas(nama: string) {
  return kelasShort(nama).replace(/^(XII|12)\s+/i, "");
}

function ChipDitolak() {
  return <span className="shrink-0 rounded-lg px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>Ditolak</span>;
}

function TabKelas({ list, aktifId, onPilih, layoutId }: { list: KelasBelum[]; aktifId?: string; onPilih: (id: string) => void; layoutId: string }) {
  return (
    <div className="isolate flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] dark:bg-slate-700 [&::-webkit-scrollbar]:hidden">
      {list.map((k) => {
        const aktif = k.id === aktifId;
        return (
          <button key={k.id} type="button" onClick={() => onPilih(k.id)} title={k.nama}
            className={`relative min-w-[3.25rem] flex-1 shrink-0 whitespace-nowrap rounded-lg px-1.5 py-1.5 text-[10.5px] font-bold transition-colors ${aktif ? "text-white" : "text-slate-500 dark:text-slate-300"}`}>
            {aktif && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-lg bg-[#3E03B3]" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className="relative z-10">{labelKelas(k.nama)} · {k.siswa.length}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModalBelumDaftar({ list, aktif, onPilih, onClose }: { list: KelasBelum[]; aktif: KelasBelum; onPilih: (id: string) => void; onClose: () => void }) {
  const pg = usePagedList(aktif.siswa, aktif.id);
  return (
    <Portal><div data-plain className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#FFE9E2", color: "#E8562B" }}><UserX size={20} /></span>
          <h2 className="min-w-0 flex-1 truncate text-base font-extrabold text-slate-900 dark:text-white">Belum Daftar PKL</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>
        <div className="shrink-0 px-5 pb-3"><TabKelas list={list} aktifId={aktif.id} onPilih={onPilih} layoutId="belum-daftar-tab-modal" /></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {aktif.siswa.length === 0 ? (
            <p className="py-10 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Semua siswa kelas ini sudah daftar</p>
          ) : (
            <div className="overflow-hidden rounded-2xl">
              <div className="sticky top-0 z-10 grid items-center gap-2 px-3 py-2.5" style={{ gridTemplateColumns: KOLOM_MODAL, backgroundColor: "#0F172A" }}>
                <span className="text-center text-[10px] font-bold uppercase tracking-wider text-white">No</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Nama Siswa</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">NIS</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {pg.pageItems.map((s, i) => {
                  const nama = namaSiswa(s.nama);
                  return (
                    <div key={s.id} className="grid items-center gap-2 px-3 py-2" style={{ gridTemplateColumns: KOLOM_MODAL }}>
                      <span className="text-center text-xs font-bold text-slate-400">{pg.start + i}</span>
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar src={s.fotoProfil} nama={nama} sizePx={28} fallbackBg={avatarColorFor(nama)} textClassName="text-[9px] font-extrabold" />
                        <span className="truncate text-sm font-semibold text-slate-800 dark:text-white">{nama}</span>
                        {s.ditolak && <ChipDitolak />}
                      </span>
                      <span className="truncate text-xs tabular-nums text-slate-500 dark:text-slate-400">{s.nis}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <TablePager pg={pg} className="shrink-0 px-5 py-3" />
      </motion.div>
    </div></Portal>
  );
}

export function BelumDaftarPklCard() {
  const [list, setList] = useState<KelasBelum[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelasId, setKelasId] = useState("");
  const [modal, setModal] = useState(false);

  const muat = useCallback(() => {
    fetch("/api/magang/pendaftaran/belum-daftar", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d)) setList(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { muat(); }, [muat]);
  useAutoRefresh(muat);

  const aktif = list.find((k) => k.id === kelasId) ?? list[0];
  const totalBelum = list.reduce((n, k) => n + k.siswa.length, 0);
  const tampil = aktif?.siswa.slice(0, BATAS_KARTU) ?? [];

  return (
    <div className="card-pisah rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FFE9E2", color: "#E8562B" }}><UserX size={16} /></span>
        <p className="min-w-0 flex-1 text-sm font-bold text-slate-800 dark:text-white">Belum Daftar <span className="font-medium text-slate-400 dark:text-slate-500">({totalBelum})</span></p>
      </div>

      {list.length > 0 && <TabKelas list={list} aktifId={aktif?.id} onPilih={setKelasId} layoutId="belum-daftar-tab" />}

      {loading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)}
        </div>
      ) : tampil.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ShieldCheck size={22} className="text-[#22A06B]" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{list.length === 0 ? "Belum ada kelas XII" : "Semua siswa kelas ini sudah daftar"}</p>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {tampil.map((s) => {
            const nama = namaSiswa(s.nama);
            return (
              <div key={s.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-slate-700">
                <Avatar src={s.fotoProfil} nama={nama} sizePx={28} fallbackBg={avatarColorFor(nama)} textClassName="text-[9px] font-extrabold" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200" title={nama}>{nama}</p>
                  <p className="truncate text-[10px] text-slate-400">{s.nis}</p>
                </div>
                {s.ditolak && <ChipDitolak />}
              </div>
            );
          })}
        </div>
      )}

      {aktif && aktif.siswa.length > 0 && (
        <button type="button" onClick={() => setModal(true)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-[#F1EDFA] px-3 py-2 text-xs font-bold text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]">
          Lihat semua {aktif.siswa.length} <ArrowRight size={12} />
        </button>
      )}

      <AnimatePresence>
        {modal && aktif && <ModalBelumDaftar list={list} aktif={aktif} onPilih={setKelasId} onClose={() => setModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
