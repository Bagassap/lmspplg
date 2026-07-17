"use client";

import { useState } from "react";
import { Eye, ScanEye, KeyRound } from "lucide-react";
import {
  type SiswaCardData, getInitials, toTitleCase, getNama, kelasShort, avatarColorFor,
} from "./shared";
import { SiswaDetailPanel } from "./SiswaDetailPanel";

const COL = {
  nama: "flex-[2] min-w-0",
  nis: "flex-1 min-w-0",
  kelas: "flex-1 min-w-0",
  jurusan: "flex-1 min-w-0",
  gender: "w-[60px] shrink-0",
  angkatan: "w-[80px] shrink-0",
  aksi: "w-[90px] shrink-0",
};

export function SiswaTableHead() {
  const LABEL = "text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500";
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
      <span className={`${COL.nama} ${LABEL}`}>Nama Siswa</span>
      <span className={`${COL.nis} ${LABEL}`}>NIS</span>
      <span className={`${COL.kelas} ${LABEL}`}>Kelas</span>
      <span className={`${COL.jurusan} ${LABEL}`}>Jurusan</span>
      <span className={`${COL.gender} ${LABEL}`}>Gender</span>
      <span className={`${COL.angkatan} ${LABEL}`}>Angkatan</span>
      <span className={`${COL.aksi} ${LABEL}`}>Aksi</span>
    </div>
  );
}

export function SiswaTableRow({
  siswa, onEdit, onResetPassword, onImpersonate,
}: {
  siswa: SiswaCardData;
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayNama = toTitleCase(getNama(siswa));
  const isP = siswa.jenisKelamin === "Perempuan";
  const isL = siswa.jenisKelamin === "Laki-laki";
  const accent = avatarColorFor(siswa.id || displayNama);

  return (
    <div className="border-b border-slate-100 dark:border-slate-800">
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ borderLeftColor: accent }}
        className="flex cursor-pointer items-center gap-3 border-l-4 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
      >
        <div className={`flex min-w-0 items-center gap-2.5 ${COL.nama}`}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {getInitials(displayNama)}
          </div>
          <span className="truncate text-[13px] font-semibold text-slate-800 dark:text-white" title={displayNama}>
            {displayNama}
          </span>
        </div>

        <span className={`truncate text-[13px] text-slate-500 dark:text-slate-400 ${COL.nis}`} title={`Password Default: ${siswa.nis}`}>
          {siswa.nis}
        </span>

        <span className={COL.kelas}>
          <span className="inline-block truncate rounded-md bg-[#6366f1] px-2 py-0.5 text-[11px] font-semibold text-white">
            {kelasShort(siswa.kelas.nama)}
          </span>
        </span>

        <span className={COL.jurusan}>
          {siswa.jurusan && (
            <span className="inline-block truncate rounded-md bg-[#0d9488] px-2 py-0.5 text-[11px] font-semibold text-white">
              {kelasShort(siswa.jurusan)}
            </span>
          )}
        </span>

        <span className={COL.gender}>
          {isP ? (
            <span className="inline-block rounded-md bg-[#ec4899] px-2 py-0.5 text-[11px] font-bold text-white">P</span>
          ) : isL ? (
            <span className="inline-block rounded-md bg-[#3b82f6] px-2 py-0.5 text-[11px] font-bold text-white">L</span>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
          )}
        </span>

        <span className={`text-[13px] text-slate-500 dark:text-slate-400 ${COL.angkatan}`}>
          {siswa.angkatan}
        </span>

        <div className={`flex items-center gap-1 ${COL.aksi}`}>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-all hover:bg-slate-100 hover:text-primary dark:border-slate-700 dark:hover:bg-white/10"
            title="Lihat Detail"
          >
            <Eye size={13} />
          </button>
          {onImpersonate && siswa.user && (
            <button
              onClick={(e) => { e.stopPropagation(); onImpersonate(siswa); }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600 dark:border-slate-700 dark:hover:bg-amber-900/20"
              title="Pantau (masuk sebagai siswa ini)"
            >
              <ScanEye size={13} />
            </button>
          )}
          {onResetPassword && siswa.user && (
            <button
              onClick={(e) => { e.stopPropagation(); onResetPassword(siswa); }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:hover:bg-red-900/20"
              title="Reset Password"
            >
              <KeyRound size={13} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <SiswaDetailPanel
          siswa={siswa}
          onEdit={onEdit ? () => onEdit(siswa) : undefined}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );
}
