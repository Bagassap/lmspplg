"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, X, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 transition-all hover:border-slate-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:bg-slate-800";

export function ResetPasswordModal({
  userId, userName, nis, onClose, onSuccess,
}: {
  userId: string; userName: string; nis?: string; onClose: () => void; onSuccess?: () => void;
}) {
  const toast = useToast();
  const resetToNis = !!nis;
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!resetToNis && newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetToNis ? {} : { newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
      toast.success("Password berhasil direset!", `${userName} wajib mengganti password saat login berikutnya.`);
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal mereset password. Coba lagi.";
      setError(msg);
      toast.error("Gagal mereset password", msg);
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-999 flex items-end justify-center p-4 sm:items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          initial={{ scale: 0.95, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 24 }} transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}>
          <div className="relative overflow-hidden px-6 py-5"
            style={{ background: "linear-gradient(135deg, #DC2626 0%, #F87171 100%)" }}>
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <KeyRound size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Reset Password</p>
                  <h2 className="text-base font-extrabold leading-tight text-white">{userName}</h2>
                </div>
              </div>
              <button onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white/80 transition-all hover:bg-white/25 hover:text-white">
                <X size={15} />
              </button>
            </div>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 dark:border-amber-900/30 dark:bg-amber-900/10">
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                {resetToNis
                  ? <>Password akan direset ke <strong>NIS siswa ({nis})</strong>. {userName} akan diwajibkan mengganti password tersebut saat login berikutnya.</>
                  : <>Password akan diganti ke nilai baru di bawah ini. {userName} akan diwajibkan mengganti password tersebut saat login berikutnya.</>}
              </p>
            </div>
            {resetToNis ? (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  <KeyRound size={10} className="text-primary/70" />
                  Password Default Baru
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                  <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{nis}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">(NIS siswa)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  <KeyRound size={10} className="text-primary/70" />
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className={INPUT}
                  />
                  <button type="button" onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-slate-800">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              Batal
            </button>
            <motion.button type="button" onClick={handleReset} disabled={saving}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px #DC262655" }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-md transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "#DC2626" }}>
              {saving
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Mereset…</>
                : <><KeyRound size={14} />Reset Password</>}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
