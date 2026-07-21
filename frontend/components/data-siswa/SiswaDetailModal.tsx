"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, User, GraduationCap, BookOpen, Phone, UserCheck, Users, Pencil, X, MapPin,
} from "lucide-react";
import { type SiswaCardData, getInitials, toTitleCase, getNama, kelasShort, formatTempatTanggalLahir, formatAlamatLengkap } from "./shared";

const HEADER_GRADIENT = "linear-gradient(135deg, #4338ca 0%, #2563eb 50%, #0ea5e9 100%)";

function FieldItem({ icon: Icon, label, value, full }: {
  icon: React.ElementType; label: string; value: string | null | undefined; full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
        <Icon size={12} />
        <p className="truncate text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p
        className={`mt-1.5 text-[15px] font-bold text-slate-800 dark:text-white ${full ? "" : "truncate"}`}
        title={value || "—"}
      >
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
  const alamatLengkap = formatAlamatLengkap(siswa);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-800 sm:mx-0">

          {/* Bagian 1 — header profil (~30%) */}
          <div className="relative shrink-0 overflow-hidden px-6 py-5" style={{ background: HEADER_GRADIENT }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/8" />

            <button onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
              <X size={15} />
            </button>

            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/40 text-lg font-extrabold text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.22)", boxShadow: "0 0 0 3px rgba(255,255,255,0.18)" }}>
                {getInitials(displayNama)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[19px] font-extrabold leading-tight text-white">{displayNama}</h2>
                <p className="mt-1 font-mono text-xs text-white/70">NIS: {siswa.nis}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  {kelasShort(siswa.kelas.nama)}
                </span>
              </div>
            </div>
          </div>

          {/* Bagian 2 — detail informasi (~70%) */}
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <FieldItem icon={CalendarDays} label="Tempat & Tanggal Lahir" value={tempatTanggal} />
              <FieldItem icon={User} label="Jenis Kelamin" value={siswa.jenisKelamin} />
              <FieldItem icon={BookOpen} label="Jurusan" value={siswa.jurusan} />
              <FieldItem icon={GraduationCap} label="Angkatan" value={String(siswa.angkatan)} />
              <FieldItem icon={Phone} label="No. HP" value={siswa.noHp} />
              <FieldItem icon={UserCheck} label="Wali Kelas" value={waliKelas} />
              <FieldItem icon={Users} label="Nama Orang Tua" value={siswa.namaOrtu} />
              <FieldItem icon={MapPin} label="Alamat" value={alamatLengkap} full />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3.5 dark:border-slate-700/50">
              <button
                type="button" onClick={onClose}
                className="rounded-lg border-2 border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X size={12} className="mr-1 inline" /> Tutup
              </button>
              {onEdit && (
                <motion.button
                  type="button" onClick={onEdit}
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(37,99,235,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                  style={{ background: HEADER_GRADIENT }}
                >
                  <Pencil size={12} /> Edit Data
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
