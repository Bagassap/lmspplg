"use client";

import { motion } from "framer-motion";
import { Clock, FileText, X } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { STATUS_PENEMPATAN_CFG, type PendaftaranMagang, type PenempatanMagang } from "./types";
import { namaSiswa } from "@/lib/nama";
import { Portal } from "@/components/shared/Portal";

export function FormSiswaModal({ judul, terkirim, belum, onLihat, onClose }: {
  judul: string;
  terkirim: PenempatanMagang[];
  belum: PendaftaranMagang[];
  onLihat: (p: PenempatanMagang) => void;
  onClose: () => void;
}) {
  const kosong = terkirim.length === 0 && belum.length === 0;
  return (
    <Portal><div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#E0F2FE", color: "#0EA5E9" }}><FileText size={20} /></span>
          <h2 className="min-w-0 flex-1 truncate text-base font-extrabold text-slate-900 dark:text-white">Form Penempatan · {judul}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-5 pb-5">
          {kosong && (
            <p className="py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Belum ada siswa di instansi ini</p>
          )}
          {terkirim.map((p) => {
            const nama = namaSiswa(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
            const cfg = STATUS_PENEMPATAN_CFG[p.status];
            return (
              <div key={p.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
                <Avatar src={p.siswa.user?.fotoProfil} nama={nama} sizePx={32} fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-white">
                  {nama} <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{p.siswa.kelas.nama}</span>
                </p>
                <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.clr }}>{cfg.label}</span>
                <button type="button" onClick={() => onLihat(p)}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#3E03B3] px-3 text-xs font-bold text-white">
                  <FileText size={13} /> Lihat dokumen
                </button>
              </div>
            );
          })}
          {belum.map((d) => {
            const nama = namaSiswa(d.siswa?.user?.nama ?? d.siswa?.nama ?? "—");
            return (
              <div key={d.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
                <Avatar src={d.siswa?.user?.fotoProfil} nama={nama} sizePx={32} fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-white">
                  {nama} <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.siswa?.kelas?.nama ?? "-"}</span>
                </p>
                <span className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: "#FFF4E0", color: "#D97706" }}>
                  <Clock size={11} /> Belum mengirim form
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div></Portal>
  );
}
