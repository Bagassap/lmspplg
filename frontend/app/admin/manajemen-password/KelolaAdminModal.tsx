"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, KeyRound } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColor } from "@/components/absensi-harian/shared";

type AdminRow = { id: string; nama: string; loginId: string | null; isActive: boolean; mustChangePassword: boolean; fotoProfil?: string | null };

function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Superadmin: daftar akun admin + reset password. */
export function KelolaAdminModal({ open, onClose, onResetPassword }: {
  open: boolean;
  onClose: () => void;
  onResetPassword: (target: { id: string; nama: string; loginId?: string; mustChangePassword: boolean }) => void;
}) {
  const [list, setList] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/users/admin", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
            <div className="app-sheet-header flex shrink-0 items-center gap-3 bg-[#3E03B3] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={18} className="text-white" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Superadmin</p>
                <h2 className="truncate text-base font-extrabold text-white">Kelola Admin</h2>
              </div>
              <button onClick={onClose} aria-label="Tutup" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white"><X size={15} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div>
              ) : list.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400">Belum ada akun admin.</p>
              ) : (
                <div className="space-y-2.5">
                  {list.map((a) => {
                    const nama = toTitleCase(a.nama);
                    return (
                      <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-100 p-3 dark:border-slate-700/50">
                        <Avatar src={a.fotoProfil} nama={nama} sizePx={36} fallbackBg={avatarColor(nama)} textClassName="text-[11px] font-extrabold" />
                        <div className="min-w-0 flex-1 basis-32">
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{nama}</p>
                          <p className="truncate text-[11px] text-slate-400">{a.loginId ?? "—"} · {a.isActive ? "Aktif" : "Nonaktif"} · {a.mustChangePassword ? "Belum ganti password" : "Sudah ganti password"}</p>
                        </div>
                        <button type="button" disabled={!a.loginId}
                          onClick={() => onResetPassword({ id: a.id, nama, loginId: a.loginId ?? undefined, mustChangePassword: a.mustChangePassword })}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F1EDFA] px-3 py-1.5 text-[11px] font-bold text-[#3E03B3] disabled:opacity-40">
                          <KeyRound size={11} /> Reset Password
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
