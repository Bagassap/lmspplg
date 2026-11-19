"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Search, Users, X } from "lucide-react";
import type { Instansi } from "./types";

export function PilihTempatModal({ list, nilai, onPilih, onClose }: {
  list: Instansi[];
  nilai: string;
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

  const opsi = (id: string, nama: string, aktif: boolean, kanan?: React.ReactNode, redup?: boolean) => (
    <button key={id || "lain"} type="button" onClick={() => pilih(id)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${aktif ? "bg-[#E4F5EC] ring-2 ring-[#22A06B]" : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={redup ? { background: "#FFF4E0", color: "#D97706" } : { background: "#FFE9E2", color: "#E8562B" }}>
        <Building2 size={15} />
      </span>
      <p className={`min-w-0 flex-1 truncate text-sm font-bold ${redup ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-white"}`}>{nama}</p>
      {kanan}
      {aktif && <CheckCircle2 size={16} className="shrink-0 text-[#22A06B]" />}
    </button>
  );

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

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-5 pb-5">
          {opsi("", "Belum ada / instansi lain", nilai === "", undefined, true)}
          {tampil.map((i) => opsi(i.id, i.namaTempat, nilai === i.id, (
            <span className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: "#E4F5EC", color: "#22A06B" }}>
                <Users size={11} /> {i.siswa.length}
              </span>
              {i.sisa !== null && (
                <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: "#E0F2FE", color: "#0EA5E9" }}>Sisa {i.sisa}</span>
              )}
            </span>
          )))}
          {tampil.length === 0 && q && (
            <p className="py-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Tidak ada instansi yang cocok</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
