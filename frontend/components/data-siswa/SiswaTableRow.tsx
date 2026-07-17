"use client";

import { useState } from "react";
import { ScanEye, KeyRound } from "lucide-react";
import {
  type SiswaCardData, getInitials, toTitleCase, getNama, avatarColorFor, formatTempatTanggalLahir,
} from "./shared";
import { SiswaDetailPanel } from "./SiswaDetailPanel";

const GRID = "grid grid-cols-6 w-full items-center px-4 py-3";
const TEXT = "text-sm font-medium text-slate-800 dark:text-white";

export function SiswaTableHead() {
  const LABEL = "text-xs font-semibold uppercase text-slate-400 dark:text-slate-500";
  return (
    <div className={`${GRID} border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60`}>
      <span className={LABEL}>Nama Siswa</span>
      <span className={LABEL}>NIS</span>
      <span className={LABEL}>Tempat & Tgl Lahir</span>
      <span className={LABEL}>No. HP</span>
      <span className={LABEL}>Jurusan</span>
      <span className={LABEL}>Aksi</span>
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
  const accent = avatarColorFor(siswa.id || displayNama);
  const tempatTanggal = formatTempatTanggalLahir(siswa.tempatLahir, siswa.tanggalLahir);

  return (
    <div className="border-b border-slate-100 dark:border-slate-800">
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ borderLeftColor: accent }}
        className={`${GRID} cursor-pointer border-l-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {getInitials(displayNama)}
          </div>
          <span className={`truncate ${TEXT}`} title={displayNama}>
            {displayNama}
          </span>
        </div>

        <span className={`truncate ${TEXT}`} title={`Password Default: ${siswa.nis}`}>
          {siswa.nis}
        </span>

        <span className={`truncate ${TEXT}`} title={tempatTanggal}>
          {tempatTanggal}
        </span>

        <span className={`truncate ${TEXT}`}>
          {siswa.noHp || "—"}
        </span>

        <span className="min-w-0">
          {siswa.jurusan && (
            <span className="block w-fit max-w-full truncate rounded-md bg-[#0d9488] px-2 py-0.5 text-[11px] font-semibold text-white">
              {siswa.jurusan}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1">
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
