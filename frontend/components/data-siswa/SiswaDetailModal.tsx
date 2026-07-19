"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, User, GraduationCap, BookOpen, Phone, UserCheck, Users, Sparkles, X,
} from "lucide-react";
import { type SiswaCardData, getInitials, toTitleCase, getNama, kelasShort, formatTempatTanggalLahir } from "./shared";

const BRAND_GRADIENT = "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)";

function formatTanggal(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function FieldItem({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: string | null | undefined;
}) {
  return (
    <div className="border-r border-b border-slate-100 py-3 pl-3.5 pr-4 dark:border-slate-700/60"
      style={{ borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: "#4F8EF7" }}>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#4F8EF71a] text-[#0033FF]">
          <Icon size={13} />
        </div>
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#3B5FE0]">{label}</p>
      </div>
      <p className="mt-1.5 truncate text-[15px] font-bold text-slate-800 dark:text-white" title={value || "—"}>
        {value || "—"}
      </p>
    </div>
  );
}

export function SiswaDetailModal({ siswa, onEdit, onClose }: {
  siswa: SiswaCardData; onEdit?: () => void; onClose: () => void;
}) {
  const displayNama = toTitleCase(getNama(siswa));
  const tempatTanggal = formatTempatTanggalLahir(siswa.tempatLahir, siswa.tanggalLahir);
  const waliKelas = siswa.kelas.waliKelasGuru?.user.nama ?? null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-800 sm:mx-0">

          <div className="relative shrink-0 overflow-hidden px-6 py-6" style={{ background: BRAND_GRADIENT }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/8" />

            <button onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
              <X size={15} />
            </button>

            <div className="relative flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.22)", boxShadow: "0 0 0 3px rgba(255,255,255,0.25)" }}>
                {getInitials(displayNama)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-extrabold leading-tight text-white">{displayNama}</h2>
                <p className="mt-1 font-mono text-xs font-semibold text-white/75">NIS: {siswa.nis}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={CalendarDays} label="Tempat & Tanggal Lahir" value={tempatTanggal} />
              <FieldItem icon={User} label="Jenis Kelamin" value={siswa.jenisKelamin} />
              <FieldItem icon={Users} label="Nama Orang Tua" value={siswa.namaOrtu} />
              <FieldItem icon={CalendarDays} label="Angkatan" value={String(siswa.angkatan)} />
              <FieldItem icon={GraduationCap} label="Kelas" value={kelasShort(siswa.kelas.nama)} />
              <FieldItem icon={BookOpen} label="Jurusan" value={siswa.jurusan} />
              <FieldItem icon={UserCheck} label="Wali Kelas" value={waliKelas} />
              <FieldItem icon={Phone} label="No. HP" value={siswa.noHp} />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3.5 dark:border-slate-700/50">
              <button
                type="button" onClick={onClose}
                className="rounded-lg border-2 border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X size={12} className="mr-1 inline" /> Tutup
              </button>
              {onEdit && (
                <motion.button
                  type="button" onClick={onEdit}
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(79,142,247,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                  style={{ background: BRAND_GRADIENT }}
                >
                  <Sparkles size={12} /> Edit Data
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
