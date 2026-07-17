"use client";

import { Eye, ScanEye, KeyRound } from "lucide-react";
import {
  type SiswaCardData, getNama, getInitials, toTitleCase, kelasShort, avatarColorFor,
} from "./shared";

const COL = {
  nama: "w-45 shrink-0",
  nis: "w-27.5 shrink-0",
  kelas: "w-22.5 shrink-0",
  jurusan: "w-20 shrink-0",
  gender: "w-12.5 shrink-0",
  status: "w-25 shrink-0",
  aksi: "w-22.5 shrink-0",
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
      <span className={`${COL.status} ${LABEL}`}>Status</span>
      <span className={`${COL.aksi} ${LABEL}`}>Aksi</span>
    </div>
  );
}

export function SiswaTableRow({
  siswa, onDetail, onResetPassword, onImpersonate, showStatus,
}: {
  siswa: SiswaCardData;
  onDetail: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
  showStatus?: boolean;
}) {
  const displayNama = toTitleCase(getNama(siswa));
  const isP = siswa.jenisKelamin === "Perempuan";
  const isL = siswa.jenisKelamin === "Laki-laki";
  const accent = avatarColorFor(siswa.id || displayNama);
  const mustChange = siswa.user?.mustChangePassword;

  return (
    <div
      onClick={() => onDetail(siswa)}
      style={{ borderLeftColor: accent }}
      className="flex cursor-pointer items-center gap-3 border-b border-l-4 border-slate-100 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:border-b-slate-800 dark:hover:bg-slate-800/40"
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

      <span className={COL.status}>
        {showStatus && siswa.user ? (
          mustChange ? (
            <span className="inline-block rounded-md bg-[#ef4444] px-2 py-0.5 text-[11px] font-semibold text-white">Belum Aktif</span>
          ) : (
            <span className="inline-block rounded-md bg-[#10b981] px-2 py-0.5 text-[11px] font-semibold text-white">Aktif</span>
          )
        ) : (
          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
        )}
      </span>

      <div className={`flex items-center gap-1 ${COL.aksi}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onDetail(siswa); }}
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
  );
}
