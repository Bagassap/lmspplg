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

type Category = "pribadi" | "akademik" | "kontak";

const CATEGORY_STYLE: Record<Category, { border: string; iconBg: string; icon: string; label: string }> = {
  pribadi:  { border: "#8b5cf6", iconBg: "#8b5cf61a", icon: "#7c3aed", label: "#7c3aed" }, // violet
  akademik: { border: "#3b82f6", iconBg: "#3b82f61a", icon: "#2563eb", label: "#2563eb" }, // blue
  kontak:   { border: "#14b8a6", iconBg: "#14b8a61a", icon: "#0d9488", label: "#0d9488" }, // teal
};

function FieldCard({ icon: Icon, label, value, category }: {
  icon: React.ElementType; label: string; value: string | null | undefined; category: Category;
}) {
  const c = CATEGORY_STYLE[category];
  return (
    <div
      className="rounded-xl border-l-[3px] bg-white px-3.5 py-3 shadow-sm dark:bg-slate-800/80"
      style={{ borderLeftColor: c.border }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: c.iconBg, color: c.icon }}
        >
          <Icon size={13} />
        </div>
        <p className="truncate text-[10px] font-bold uppercase tracking-wider" style={{ color: c.label }}>
          {label}
        </p>
      </div>
      <p className="mt-1.5 truncate text-[15px] font-bold text-slate-800 dark:text-white" title={value || "—"}>
        {value || "—"}
      </p>
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
        className="overflow-hidden border-b border-slate-100 bg-linear-to-br from-slate-50 to-white dark:border-slate-800 dark:from-slate-800/40 dark:to-slate-800/10"
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FieldCard icon={CalendarDays} label="Tempat & Tanggal Lahir" value={tempatTanggal} category="pribadi" />
            <FieldCard icon={User} label="Jenis Kelamin" value={siswa.jenisKelamin} category="pribadi" />
            <FieldCard icon={Users} label="Nama Orang Tua" value={siswa.namaOrtu} category="pribadi" />

            <FieldCard icon={CalendarDays} label="Angkatan" value={String(siswa.angkatan)} category="akademik" />
            <FieldCard icon={GraduationCap} label="Kelas" value={kelasShort(siswa.kelas.nama)} category="akademik" />
            <FieldCard icon={BookOpen} label="Jurusan" value={siswa.jurusan} category="akademik" />
            <FieldCard icon={UserCheck} label="Wali Kelas" value={waliKelas} category="akademik" />

            <FieldCard icon={Phone} label="No. HP" value={siswa.noHp} category="kontak" />
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
                style={{ background: "linear-gradient(135deg, #6366f1, #4F8EF7)" }}
              >
                <Sparkles size={12} /> Edit Data
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
