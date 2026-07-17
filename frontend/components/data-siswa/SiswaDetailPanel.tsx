"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, User, GraduationCap, BookOpen, Phone, UserCheck, Users, Sparkles, X,
} from "lucide-react";
import { type SiswaCardData, kelasShort } from "./shared";

function formatTanggal(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-primary/60" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value || "—"}</p>
    </div>
  );
}

export function SiswaDetailPanel({ siswa, onEdit, onClose }: {
  siswa: SiswaCardData; onEdit?: () => void; onClose: () => void;
}) {
  const tempatTanggal = [siswa.tempatLahir, formatTanggal(siswa.tanggalLahir)].filter(Boolean).join(", ") || "—";
  const waliKelas = siswa.kelas.waliKelasGuru?.user.nama ?? null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30"
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field icon={CalendarDays} label="Tempat & Tanggal Lahir" value={tempatTanggal} />
            <Field icon={User} label="Jenis Kelamin" value={siswa.jenisKelamin} />
            <Field icon={CalendarDays} label="Angkatan" value={String(siswa.angkatan)} />
            <Field icon={GraduationCap} label="Kelas" value={kelasShort(siswa.kelas.nama)} />
            <Field icon={BookOpen} label="Jurusan" value={siswa.jurusan} />
            <Field icon={Phone} label="No. HP" value={siswa.noHp} />
            <Field icon={UserCheck} label="Wali Kelas" value={waliKelas} />
            <Field icon={Users} label="Nama Orang Tua" value={siswa.namaOrtu} />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3.5 dark:border-slate-700/50">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <X size={12} className="mr-1 inline" /> Tutup
            </button>
            {onEdit && (
              <button type="button" onClick={onEdit}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#4F8EF7" }}>
                <Sparkles size={12} /> Edit Data
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
