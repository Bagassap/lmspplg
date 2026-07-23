"use client";

import { motion } from "framer-motion";
import { Eye, ScanEye, KeyRound } from "lucide-react";
import {
  type SiswaCardData, toTitleCase, getNama, avatarColorFor, formatTempatTanggalLahir,
} from "./shared";
import { Avatar } from "@/components/shared/Avatar";

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
  siswa, index, onEdit, onResetPassword, onImpersonate, onViewDetail,
}: {
  siswa: SiswaCardData;
  index: number;
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
  onViewDetail: (s: SiswaCardData) => void;
}) {
  const displayNama = toTitleCase(getNama(siswa));
  const accent = avatarColorFor(siswa.id || displayNama);
  const tempatTanggal = formatTempatTanggalLahir(siswa.tempatLahir, siswa.tanggalLahir);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (index % 15) * 0.02 }}
        className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
      >
        <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{index + 1}</span>

        <div className="relative shrink-0">
          <Avatar
            src={siswa.user?.fotoProfil}
            nama={displayNama}
            sizePx={36}
            fallbackBg={accent}
            textClassName="text-[10px] font-extrabold"
          />
          {siswa.user && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-800"
              style={{ backgroundColor: siswa.user.mustChangePassword ? "#f59e0b" : "#10b981" }}
              title={siswa.user.mustChangePassword ? "Belum ganti password (masih NIS)" : "Sudah ganti password sendiri"}
            />
          )}
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
          <button
            onClick={() => onViewDetail(siswa)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10"
            title="Lihat Detail"
          >
            <Eye size={14} />
          </button>
          {onImpersonate && siswa.user && (
            <button
              onClick={() => onImpersonate(siswa)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
              title="Pantau (masuk sebagai siswa ini)"
            >
              <ScanEye size={14} className="text-amber-500" />
            </button>
          )}
          {onResetPassword && siswa.user && (
            <button
              onClick={() => onResetPassword(siswa)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Reset Password"
            >
              <KeyRound size={14} className="text-red-500" />
            </button>
          )}
        </div>
    </motion.div>
  );
}
