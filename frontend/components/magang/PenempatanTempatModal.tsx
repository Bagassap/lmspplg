"use client";

import { motion } from "framer-motion";
import { Building2, CalendarDays, FileText, Pencil, Trash2, Undo2, UserCheck, X } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { STATUS_PENEMPATAN_CFG, type PenempatanMagang, type StatusPenempatan } from "./types";
import { namaSiswa, namaOrang } from "@/lib/nama";
import { Portal } from "@/components/shared/Portal";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

export function PenempatanTempatModal({ judul, rows, busyId, onPeriksa, onTetapkanGuru, onUbahStatus, onBatalVerifikasi, onEdit, onHapus, onClose }: {
  judul: string;
  rows: PenempatanMagang[];
  busyId: string | null;
  onPeriksa: (p: PenempatanMagang) => void;
  onTetapkanGuru: (rows: PenempatanMagang[]) => void;
  onUbahStatus: (p: PenempatanMagang, s: StatusPenempatan) => void;
  onBatalVerifikasi: (p: PenempatanMagang) => void;
  onEdit: (p: PenempatanMagang) => void;
  onHapus: (p: PenempatanMagang) => void;
  onClose: () => void;
}) {
  const bisaTetapkan = rows.filter((r) => r.status === "AKTIF");

  return (
    <Portal><div data-plain className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:flex" style={{ background: "#FFE9E2", color: "#E8562B" }}><Building2 size={20} /></span>
          <h2 className="min-w-0 flex-1 truncate text-base font-extrabold text-slate-900 dark:text-white">{judul}<span className="ml-1 font-semibold text-slate-400 sm:hidden">({rows.length})</span></h2>
          <span className="hidden shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold sm:inline" style={{ background: "#E0F2FE", color: "#0EA5E9" }}>{rows.length} siswa</span>
          {bisaTetapkan.length > 0 && (
            <button type="button" onClick={() => onTetapkanGuru(bisaTetapkan)}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#3E03B3] px-3 text-xs font-bold text-white">
              <UserCheck size={13} /> <span className="hidden sm:inline">Pembimbing semua</span><span className="sm:hidden">Semua</span>
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-5 pb-5">
          {rows.map((p) => {
            const nama = namaSiswa(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
            const cfg = STATUS_PENEMPATAN_CFG[p.status];
            const busy = busyId === p.id;
            return (
              <div key={p.id} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
                <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
                  <Avatar src={p.siswa.user?.fotoProfil} nama={nama} sizePx={32} fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-white" title={nama}>
                    {nama} <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:inline">{p.siswa.kelas.nama} · NIS {p.siswa.nis}</span>
                  </p>
                  <div className="flex w-full items-center gap-1.5 sm:w-auto sm:shrink-0">
                  {p.status === "MENUNGGU" ? (
                    <button type="button" onClick={() => onPeriksa(p)} disabled={busy}
                      className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3E03B3] px-3 text-xs font-bold text-white disabled:opacity-50 sm:flex-none">
                      <FileText size={13} /> Lihat dokumen
                    </button>
                  ) : (
                    <>
                    <button type="button" onClick={() => onPeriksa(p)} title="Lihat dokumen" aria-label="Lihat dokumen"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]">
                      <FileText size={13} />
                    </button>
                    <select value={p.status} disabled={busy} onChange={(e) => onUbahStatus(p, e.target.value as StatusPenempatan)}
                      className="h-8 min-w-0 flex-1 rounded-lg border-0 px-2 sm:flex-none text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/30"
                      style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
                      <option value="AKTIF">Aktif</option>
                      <option value="SELESAI">Selesai</option>
                      <option value="BATAL">Batal</option>
                    </select>
                    </>
                  )}
                  <button type="button" onClick={() => onEdit(p)} disabled={busy} title="Edit" aria-label="Edit"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0EA5E9] disabled:opacity-50">
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => onHapus(p)} disabled={busy} title="Hapus" aria-label="Hapus"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626] disabled:opacity-50">
                    <Trash2 size={13} />
                  </button>
                  </div>
                </div>
                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:pl-[42px] text-slate-600 dark:text-slate-300">
                  {p.status === "AKTIF" ? (
                    <button type="button" onClick={() => onTetapkanGuru([p])} disabled={busy}
                      className="flex min-w-0 items-center gap-1 rounded-lg px-2 py-1 font-bold disabled:opacity-50"
                      style={p.guruPembimbing ? { background: "#F1EDFA", color: "#3E03B3" } : { background: "#3E03B3", color: "#fff" }}>
                      <UserCheck size={12} className="shrink-0" />
                      <span className="truncate">{p.guruPembimbing ? namaOrang(p.guruPembimbing.user.nama) : "Tetapkan pembimbing"}</span>
                      {p.guruPembimbing && <Pencil size={10} className="shrink-0" />}
                    </button>
                  ) : (
                    <span className="flex min-w-0 items-center gap-1"><UserCheck size={12} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />
                      <span className="truncate">{p.guruPembimbing ? namaOrang(p.guruPembimbing.user.nama) : "Belum ada pembimbing"}</span>
                    </span>
                  )}
                  <span className="flex shrink-0 items-center gap-1"><CalendarDays size={12} className="shrink-0 text-[#D97706]" />{fmt(p.status === "MENUNGGU" ? p.createdAt : p.tanggalMulai)}</span>
                  {p.suratKeteranganUrl && (
                    <button type="button" onClick={() => onPeriksa(p)}
                      className="flex shrink-0 items-center gap-1 font-semibold text-[#0EA5E9] underline">
                      <FileText size={12} className="shrink-0" /> Surat
                    </button>
                  )}
                  {p.status === "AKTIF" && (
                    <button type="button" onClick={() => onBatalVerifikasi(p)} disabled={busy}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-[#FEE2E2] px-2 py-1 font-bold text-[#DC2626] disabled:opacity-50">
                      <Undo2 size={12} className="shrink-0" /> Batalkan verifikasi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="py-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Tidak ada penempatan pada filter ini</p>
          )}
        </div>
      </motion.div>
    </div></Portal>
  );
}
