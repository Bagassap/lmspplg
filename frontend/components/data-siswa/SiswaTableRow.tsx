"use client";

import { motion } from "framer-motion";
import { Eye, ScanEye, KeyRound, Pencil, GraduationCap, MessageCircle, Trash2 } from "lucide-react";
import {
  type SiswaCardData, toTitleCase, getNama, avatarColorFor, formatTempatTanggalLahir, completeness, waLink,
} from "./shared";
import { Avatar } from "@/components/shared/Avatar";
import { ProgressRing } from "./ProgressRing";

// Warna persis dari referensi Nasabah - lihat catatan yang sama di FilterBar.tsx.
const REF_PRIMARY = "#0082FB";
const REF_DANGER = "#EF4444";

export const GRID_COLS = "28px 40px 2.1fr 1.5fr 1.15fr 1.35fr 2.1fr";

export function SiswaTableHead() {
  return (
    <div className="grid items-center gap-3 px-5 py-3" style={{ gridTemplateColumns: GRID_COLS, backgroundColor: "#1C2B33" }}>
      <span />
      <span />
      <span className="text-[10px] font-bold uppercase tracking-wider text-white">Nama Siswa</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white">Tempat &amp; Tgl Lahir</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white">No. HP</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white">Kelengkapan Data</span>
      <span className="text-right text-[10px] font-bold uppercase tracking-wider text-white">Aksi</span>
    </div>
  );
}

export function SiswaTableRow({
  siswa, index, onEdit, onResetPassword, onImpersonate, onViewDetail, onKeluarkan,
}: {
  siswa: SiswaCardData;
  index: number;
  onEdit?: (s: SiswaCardData) => void;
  onResetPassword?: (s: SiswaCardData) => void;
  onImpersonate?: (s: SiswaCardData) => void;
  onViewDetail: (s: SiswaCardData) => void;
  onKeluarkan?: (s: SiswaCardData) => void;
}) {
  const displayNama = toTitleCase(getNama(siswa));
  const accent = avatarColorFor(siswa.id || displayNama);
  const tempatTanggal = formatTempatTanggalLahir(siswa.tempatLahir, siswa.tanggalLahir);
  const pct = completeness(siswa);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index % 15) * 0.02 }}
      className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{index + 1}</span>

      <Avatar src={siswa.user?.fotoProfil} nama={displayNama} sizePx={36} fallbackBg={accent} textClassName="text-[10px] font-extrabold" />

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100" title={displayNama}>{displayNama}</p>
        <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <GraduationCap size={11} />
          Siswa &middot; <span className="font-mono">{siswa.nis}</span>
        </p>
      </div>

      <p className="truncate text-sm font-medium text-slate-800 dark:text-white" title={tempatTanggal}>{tempatTanggal}</p>

      <div>
        {siswa.noHp ? (
          <a
            href={waLink(siswa.noHp)!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Kirim pesan WhatsApp"
            className="inline-flex items-center gap-1.5 truncate text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <MessageCircle size={13} className="shrink-0" />
            {siswa.noHp}
          </a>
        ) : (
          <span className="text-sm font-medium text-slate-800 dark:text-white">—</span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <ProgressRing percent={pct} />
          <span className="text-xs text-slate-400 dark:text-slate-500">{pct}%</span>
        </div>
        <button
          onClick={() => onViewDetail(siswa)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:brightness-95"
          style={{ backgroundColor: `${REF_PRIMARY}1a`, color: REF_PRIMARY }}
        >
          <Eye size={12} />
          Lihat
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onEdit && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onEdit(siswa)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-95"
            style={{ backgroundColor: REF_PRIMARY }}
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
            className="flex items-center gap-1 rounded-lg bg-[#C3F84A] px-2.5 py-1.5 text-xs font-bold text-[#1C2B33] shadow-sm transition-colors hover:brightness-95"
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
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-95"
            style={{ backgroundColor: REF_DANGER }}
          >
            <KeyRound size={12} />
            Reset
          </motion.button>
        )}
        {onKeluarkan && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onKeluarkan(siswa)}
            title="Hapus permanen (siswa keluar/pindah sekolah)"
            className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-500 shadow-sm transition-colors hover:bg-red-100 dark:bg-red-900/20"
          >
            <Trash2 size={12} />
            Hapus
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
