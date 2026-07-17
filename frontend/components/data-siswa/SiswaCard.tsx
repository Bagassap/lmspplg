"use client";

import { motion } from "framer-motion";
import { Eye, Pencil, KeyRound, ScanEye, Phone } from "lucide-react";
import {
  type SiswaCardData, getNama, getInitials, toTitleCase, kelasShort,
  avatarPaletteFor, KELAS_BADGE, JURUSAN_BADGE, GENDER_BADGE, STATUS_BADGE,
} from "./shared";

export function SiswaCard({
  siswa, index, onDetail, onEdit, onResetPassword, onImpersonate, showStatus,
}: {
  siswa: SiswaCardData;
  index: number;
  onDetail: (s: SiswaCardData) => void;
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
  showStatus?: boolean;
}) {
  const displayNama = toTitleCase(getNama(siswa));
  const isP = siswa.jenisKelamin === "Perempuan";
  const isL = siswa.jenisKelamin === "Laki-laki";
  const genderAc = isP ? GENDER_BADGE.Perempuan : isL ? GENDER_BADGE["Laki-laki"] : null;
  const avatar = avatarPaletteFor(siswa.id || displayNama);
  const mustChange = siswa.user?.mustChangePassword;
  const hasActions = !!(onEdit || onResetPassword || onImpersonate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      onClick={() => onDetail(siswa)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-slate-700/50 dark:bg-[#1c2434]"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${avatar.from}, ${avatar.to})` }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-800"
            style={{ background: `linear-gradient(135deg, ${avatar.from}, ${avatar.to})` }}
          >
            {getInitials(displayNama)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{displayNama}</p>
            <p className="truncate font-mono text-[11px] text-slate-400 dark:text-slate-500" title={`Password Default: ${siswa.nis}`}>
              NIS {siswa.nis}
            </p>
          </div>
        </div>
        {showStatus && siswa.user && (
          mustChange ? (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: STATUS_BADGE.belumAktif.light, color: STATUS_BADGE.belumAktif.text }}>
              Belum Aktif
            </span>
          ) : (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: STATUS_BADGE.aktif.light, color: STATUS_BADGE.aktif.text }}>
              Aktif
            </span>
          )
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: KELAS_BADGE.light, color: KELAS_BADGE.text }}>
          {kelasShort(siswa.kelas.nama)}
        </span>
        {siswa.jurusan && (
          <span className="truncate rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: JURUSAN_BADGE.light, color: JURUSAN_BADGE.text }}>
            {kelasShort(siswa.jurusan)}
          </span>
        )}
        {genderAc && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: genderAc.light, color: genderAc.text }}>
            {isP ? "Perempuan" : "Laki-laki"}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-50 pt-3 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <Phone size={11} className="shrink-0" />
          <span className="truncate">{siswa.noHp ?? "—"}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDetail(siswa); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10"
            title="Lihat Detail"
          >
            <Eye size={13} />
          </button>
          {onImpersonate && (
            <button
              onClick={(e) => { e.stopPropagation(); onImpersonate(siswa); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
              title="Pantau (masuk sebagai siswa ini)"
            >
              <ScanEye size={13} />
            </button>
          )}
          {onResetPassword && (
            <button
              onClick={(e) => { e.stopPropagation(); onResetPassword(siswa); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              title="Reset Password"
            >
              <KeyRound size={13} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(siswa); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-primary transition-all hover:bg-primary/10"
              title="Edit Data"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      {!hasActions && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-primary/0 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/15" />
      )}
    </motion.div>
  );
}
