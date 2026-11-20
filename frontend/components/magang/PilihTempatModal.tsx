"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Search, X } from "lucide-react";
import { tempatCocokJenisKelamin, type Instansi } from "./types";

export function PilihTempatModal({ list, nilai, jenisKelamin, onPilih, onClose }: {
  list: Instansi[];
  nilai: string;
  jenisKelamin?: string | null;
  onPilih: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const tampil = useMemo(() => {
    const k = q.trim().toLowerCase();
    return list
      .filter((i) => i.id === nilai || i.sisa === null || i.sisa > 0)
      .filter((i) => !k || i.namaTempat.toLowerCase().includes(k));
  }, [list, q, nilai]);

  function pilih(id: string) {
    onPilih(id);
    onClose();
  }

  const KOLOM = "2rem minmax(0,1fr) 3.25rem 4.75rem";

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#FFE9E2", color: "#E8562B" }}><Building2 size={20} /></span>
          <h2 className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Pilih Tempat PKL</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>

        <div className="shrink-0 px-5 pb-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari instansi…" autoFocus
              className="h-10 w-full rounded-xl border-0 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="sticky top-0 z-10 grid items-center gap-2 px-3 py-2.5" style={{ gridTemplateColumns: KOLOM, backgroundColor: "#0F172A" }}>
              <span className="text-center text-[10px] font-bold uppercase tracking-wider text-white">No</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Nama Instansi</span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wider text-white">Kuota</span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wider text-white">Gender</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              <button type="button" onClick={() => pilih("")}
                className={`grid w-full items-center gap-2 px-3 py-2.5 text-left transition-colors ${nilai === "" ? "bg-[#E4F5EC] dark:bg-[#22A06B]/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                style={{ gridTemplateColumns: KOLOM }}>
                <span className="flex justify-center">{nilai === "" ? <CheckCircle2 size={14} className="text-[#22A06B]" /> : <span className="text-xs text-slate-400">–</span>}</span>
                <span className="col-span-3 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">Belum ada / instansi lain</span>
              </button>
              {tampil.map((i, idx) => {
                const aktif = nilai === i.id;
                const terkunci = !aktif && !tempatCocokJenisKelamin(i, jenisKelamin);
                const gender = i.jenisKelamin === "Perempuan" ? "Putri" : i.jenisKelamin === "Laki-laki" ? "Putra" : "Putra/Putri";
                return (
                  <button key={i.id} type="button" onClick={() => !terkunci && pilih(i.id)} disabled={terkunci}
                    title={terkunci ? `Khusus ${gender.toLowerCase()}` : i.namaTempat}
                    className={`grid w-full items-center gap-2 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${aktif ? "bg-[#E4F5EC] dark:bg-[#22A06B]/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    style={{ gridTemplateColumns: KOLOM }}>
                    <span className="flex justify-center text-xs font-bold text-slate-400">
                      {aktif ? <CheckCircle2 size={14} className="text-[#22A06B]" /> : idx + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-white">{i.namaTempat}</span>
                    <span className="text-center text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">
                      {i.sisa !== null ? `${i.sisa}/${i.kuota}` : i.kuota}
                    </span>
                    <span className="flex justify-center">
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        style={i.jenisKelamin === "Perempuan" ? { background: "#FEE2E2", color: "#DB2777" } : i.jenisKelamin === "Laki-laki" ? { background: "#E0F2FE", color: "#0EA5E9" } : { background: "#F1EDFA", color: "#3E03B3" }}>
                        {gender}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {tampil.length === 0 && q && (
            <p className="py-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Tidak ada instansi yang cocok</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
