"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X, CalendarDays, User, GraduationCap, BookOpen,
  Phone, MapPin, UserCheck, Sparkles, KeyRound,
} from "lucide-react";


type KelasAc = { main: string; light: string; text: string; dark: string };

export type SiswaDetail = {
  id: string;
  nis: string;
  nama: string | null;
  kelas: { id: string; nama: string; waliKelasGuru?: { user: { id: string; nama: string } } | null };
  jurusan: string | null;
  angkatan: number;
  jenisKelamin: string | null;
  noHp: string | null;
  alamat: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  user: { id: string; nama: string; email: string | null; mustChangePassword?: boolean } | null;
};


function getNama(s: SiswaDetail): string {
  return s.nama ?? s.user?.nama ?? "—";
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function kelasShort(kelas: string): string {
  return kelas
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Pengembangan Gim", "Gim")
    .replace("Rekayasa Perangkat Lunak", "RPL");
}

function formatTanggal(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}


function InfoItem({
  icon: Icon, label, value, className = "",
}: {
  icon: React.ElementType; label: string; value: string; className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={10} className="text-[#6334F4]/60 dark:text-[#977DFF]/50" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-slate-500">{label}</p>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{value || "—"}</p>
    </div>
  );
}


export default function SiswaDetailModal({
  siswa, ac, onClose, onEdit,
}: {
  siswa: SiswaDetail;
  ac: KelasAc;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const displayNama = toTitleCase(getNama(siswa));
  const isP         = siswa.jenisKelamin === "Perempuan";

  const tempatTanggal = [
    siswa.tempatLahir ?? null,
    formatTanggal(siswa.tanggalLahir),
  ].filter(Boolean).join(", ");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          initial={{ scale: 0.95, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 24 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="relative overflow-hidden px-6 py-5"
            style={{ background: `linear-gradient(135deg, ${ac.main} 0%, ${ac.dark} 100%)` }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-6 right-14 h-20 w-20 rounded-full bg-white/8" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold text-white ring-2 ring-white/20"
                  style={
                    isP
                      ? { background: "linear-gradient(135deg, #EC4899, #9D174D)" }
                      : { background: "linear-gradient(135deg, #977DFF, #6334F4)" }
                  }
                >
                  {getInitials(displayNama)}
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Detail Siswa</p>
                  <h2 className="text-base font-extrabold leading-tight text-white">{displayNama}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-white/70">NIS {siswa.nis}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
                    >
                      {kelasShort(siswa.kelas.nama)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white/80 transition-all hover:bg-white/25 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <div className="px-5 py-4">
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <InfoItem
                  icon={CalendarDays}
                  label="Tempat & Tanggal Lahir"
                  value={tempatTanggal || "—"}
                  className="sm:col-span-2"
                />
                <InfoItem
                  icon={User}
                  label="Jenis Kelamin"
                  value={isP ? "Perempuan" : siswa.jenisKelamin === "Laki-laki" ? "Laki-Laki" : "—"}
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Angkatan"
                  value={String(siswa.angkatan)}
                />
                <InfoItem
                  icon={GraduationCap}
                  label="Kelas"
                  value={kelasShort(siswa.kelas.nama)}
                />
                <InfoItem
                  icon={BookOpen}
                  label="Jurusan"
                  value={siswa.jurusan ?? "—"}
                />
                <InfoItem
                  icon={Phone}
                  label="No. HP"
                  value={siswa.noHp ?? "—"}
                />
                <InfoItem
                  icon={UserCheck}
                  label="Wali Kelas"
                  value={siswa.kelas.waliKelasGuru?.user.nama ?? "—"}
                />
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-slate-800">
                <InfoItem
                  icon={MapPin}
                  label="Alamat"
                  value={siswa.alamat ?? "Belum diisi"}
                />
              </div>

              {siswa.user && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <KeyRound size={13} className="text-gray-400 dark:text-slate-500" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Password Default</p>
                      <p className="font-mono text-sm font-semibold text-gray-700 dark:text-slate-200">{siswa.nis}</p>
                    </div>
                  </div>
                  {siswa.user.mustChangePassword ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">Belum Aktif</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600 dark:bg-green-900/20 dark:text-green-400">Aktif</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-slate-800">
            <div />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Tutup
              </button>

              {onEdit && (
                <motion.button
                  type="button"
                  onClick={onEdit}
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 24px #6334F455" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: "#6334F4" }}
                >
                  <Sparkles size={14} />
                  Edit Data
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
