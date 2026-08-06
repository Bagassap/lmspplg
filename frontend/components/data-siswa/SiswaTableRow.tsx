"use client";

import { motion } from "framer-motion";
import { Eye, ScanEye, KeyRound, Pencil, CheckCircle2, XCircle, GraduationCap } from "lucide-react";
import {
  type SiswaCardData, toTitleCase, getNama, avatarColorFor, formatTempatTanggalLahir, completeness,
} from "./shared";
import { Avatar } from "@/components/shared/Avatar";
import { ProgressRing } from "./ProgressRing";

const TH = "px-4 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500";
const TEXT = "text-sm font-medium text-slate-800 dark:text-white";

export function SiswaTableHead() {
  return (
    <tr>
      <th className={TH}>Nama Siswa</th>
      <th className={TH}>Status Password</th>
      <th className={TH}>Tempat & Tgl Lahir</th>
      <th className={TH}>No. HP</th>
      <th className={TH}>Jurusan</th>
      <th className={TH}>Kelengkapan Data</th>
      <th className={TH}>Aksi</th>
    </tr>
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
  const pct = completeness(siswa);
  const sudahGanti = siswa.user ? siswa.user.mustChangePassword === false : null;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index % 15) * 0.02 }}
      className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <Avatar src={siswa.user?.fotoProfil} nama={displayNama} sizePx={36} fallbackBg={accent} textClassName="text-[10px] font-extrabold" />
          </div>
          <div className="min-w-0">
            <p className={`truncate ${TEXT}`} title={displayNama}>{displayNama}</p>
            <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <GraduationCap size={11} />
              Siswa &middot; <span className="font-mono">{siswa.nis}</span>
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        {sudahGanti === null ? (
          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
        ) : (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              sudahGanti ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            {sudahGanti ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {sudahGanti ? "Sudah Ganti" : "Masih NIS"}
          </span>
        )}
      </td>

      <td className={`px-4 py-3 truncate ${TEXT}`} title={tempatTanggal}>{tempatTanggal}</td>

      <td className={`px-4 py-3 truncate ${TEXT}`}>{siswa.noHp || "—"}</td>

      <td className="px-4 py-3">
        {siswa.jurusan && (
          <span className="inline-block max-w-full truncate rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: "#0d9488" }}>
            {siswa.jurusan}
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <ProgressRing percent={pct} />
            <span className="text-xs text-slate-400 dark:text-slate-500">{pct}%</span>
          </div>
          <button
            onClick={() => onViewDetail(siswa)}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Eye size={12} />
            Lihat Data
          </button>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onEdit(siswa)}
              className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-95"
            >
              <Pencil size={12} />
              Edit
            </motion.button>
          )}
          {onImpersonate && siswa.user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onImpersonate(siswa)}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-95"
            >
              <ScanEye size={12} />
              Pantau
            </motion.button>
          )}
          {onResetPassword && siswa.user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onResetPassword(siswa)}
              className="flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-95"
            >
              <KeyRound size={12} />
              Reset
            </motion.button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
