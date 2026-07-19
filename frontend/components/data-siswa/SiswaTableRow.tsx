"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScanEye, KeyRound } from "lucide-react";
import {
  type SiswaCardData, getInitials, toTitleCase, getNama, avatarColorFor, formatTempatTanggalLahir,
} from "./shared";
import { SiswaDetailPanel } from "./SiswaDetailPanel";

const GRID_TEMPLATE = "32px 40px 2fr 1fr 1.3fr 1fr 1fr 90px";
const LABEL = "text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500";
const TEXT = "text-sm font-medium text-slate-800 dark:text-white";

export function SiswaTableHead() {
  return (
    <div
      className="grid items-center gap-3 border-b border-slate-100 px-5 py-2.5 dark:border-slate-700/40"
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
    >
      <span />
      <span />
      <span className={LABEL}>Nama Siswa</span>
      <span className={LABEL}>NIS</span>
      <span className={LABEL}>Tempat & Tgl Lahir</span>
      <span className={LABEL}>No. HP</span>
      <span className={LABEL}>Jurusan</span>
      <span className={`text-right ${LABEL}`}>Aksi</span>
    </div>
  );
}

export function SiswaTableRow({
  siswa, index, onEdit, onResetPassword, onImpersonate,
}: {
  siswa: SiswaCardData;
  index: number;
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayNama = toTitleCase(getNama(siswa));
  const accent = avatarColorFor(siswa.id || displayNama);
  const tempatTanggal = formatTempatTanggalLahir(siswa.tempatLahir, siswa.tanggalLahir);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (index % 15) * 0.02 }}
        onClick={() => setExpanded((v) => !v)}
        className="grid cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
      >
        <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{index + 1}</span>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
          style={{ backgroundColor: accent }}
        >
          {getInitials(displayNama)}
        </div>

        <p className={`truncate ${TEXT}`} title={displayNama}>{displayNama}</p>

        <p className={`truncate font-mono ${TEXT}`} title={`Password Default: ${siswa.nis}`}>
          {siswa.nis}
        </p>

        <p className={`truncate ${TEXT}`} title={tempatTanggal}>{tempatTanggal}</p>

        <p className={`truncate ${TEXT}`}>{siswa.noHp || "—"}</p>

        <div className="min-w-0">
          {siswa.jurusan && (
            <span
              className="inline-block max-w-full truncate rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ backgroundColor: "#0d9488" }}
            >
              {siswa.jurusan}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1">
          {onImpersonate && siswa.user && (
            <button
              onClick={(e) => { e.stopPropagation(); onImpersonate(siswa); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
              title="Pantau (masuk sebagai siswa ini)"
            >
              <ScanEye size={14} className="text-amber-500" />
            </button>
          )}
          {onResetPassword && siswa.user && (
            <button
              onClick={(e) => { e.stopPropagation(); onResetPassword(siswa); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Reset Password"
            >
              <KeyRound size={14} className="text-red-500" />
            </button>
          )}
        </div>
      </motion.div>

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
