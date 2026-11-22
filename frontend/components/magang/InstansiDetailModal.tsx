"use client";

import { motion } from "framer-motion";
import { Building2, CheckCircle2, MapPin, Phone, User, Users, X } from "lucide-react";
import { waLink } from "@/components/data-siswa/shared";
import { formatAlamat, labelJenisKelaminTempat, tempatCocokJenisKelamin, type Instansi } from "./types";
import { namaSiswa } from "@/lib/nama";
import { Portal } from "@/components/shared/Portal";

export function InstansiDetailModal({ instansi: i, dipilih, jenisKelaminSiswa, onPilih, onClose }: {
  instansi: Instansi;
  dipilih: boolean;
  jenisKelaminSiswa?: string | null;
  onPilih?: (i: Instansi) => void;
  onClose: () => void;
}) {
  const wa = waLink(i.noWaUsaha);
  const penuh = i.sisa !== null && i.sisa <= 0;
  const cocok = tempatCocokJenisKelamin(i, jenisKelaminSiswa);
  const info = [
    { icon: User, label: "Kepala instansi", value: i.namaPimpinan, bg: "#E0F2FE", fg: "#0EA5E9" },
    { icon: Users, label: "Menerima", value: labelJenisKelaminTempat(i.jenisKelamin), bg: "#F1EDFA", fg: "#3E03B3" },
    { icon: MapPin, label: "Alamat", value: formatAlamat(i), bg: "#FFE9E2", fg: "#E8562B" },
    {
      icon: Phone, label: "WA instansi", bg: "#E4F5EC", fg: "#22A06B",
      value: i.noWaUsaha ? (wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="underline">{i.noWaUsaha}</a> : i.noWaUsaha) : null,
    },
  ].filter((x) => x.value && x.value !== "-");

  return (
    <Portal><div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#FFE9E2", color: "#E8562B" }}><Building2 size={20} /></span>
          <h2 className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">{i.namaTempat}</h2>
          {i.sisa !== null && (
            <span className="shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-bold"
              style={penuh ? { background: "#FEE2E2", color: "#DC2626" } : { background: "#E0F2FE", color: "#0EA5E9" }}>
              {penuh ? "Kuota terpenuhi" : `Sisa kuota ${i.sisa}`}
            </span>
          )}
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-5">
          {info.length > 0 && (
            <div className="space-y-2">
              {info.map((x) => (
                <div key={x.label} className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: x.bg, color: x.fg }}><x.icon size={15} /></span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{x.label}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{x.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
              <Users size={15} className="text-[#22A06B]" /> Siswa PKL di sini
              <span className="rounded-lg px-1.5 text-[11px]" style={{ background: "#E4F5EC", color: "#22A06B" }}>{i.siswa.length}</span>
            </p>
            {i.siswa.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Belum ada siswa</p>
            ) : (
              <div className="space-y-1.5">
                {i.siswa.map((s, n) => (
                  <div key={s.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <span className="w-5 shrink-0 text-xs font-bold text-[#F26A3D]">{n + 1}.</span>
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-100">{namaSiswa(s.nama)}</p>
                    {s.kelas && <span className="shrink-0 text-xs text-slate-400">{s.kelas}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {onPilih && (!penuh || dipilih) && cocok && (
            <button type="button" onClick={() => { onPilih(i); onClose(); }}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white ${dipilih ? "bg-[#22A06B]" : "bg-[#F26A3D]"}`}>
              {dipilih ? <><CheckCircle2 size={16} /> Instansi dipilih</> : "Pilih instansi ini"}
            </button>
          )}
        </div>
      </motion.div>
    </div></Portal>
  );
}
