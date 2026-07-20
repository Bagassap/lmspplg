"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, Inbox, Clock, History, CheckCircle2, XCircle,
  MessageSquareText, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";
import { useToast } from "@/components/shared/ToastSystem";
import { timeAgo } from "@/components/dashboard/ActivityList";

type PasswordResetRequest = {
  id: string;
  namaPengaju: string;
  loginIdDiajukan: string;
  keterangan: string | null;
  status: "PENDING" | "SELESAI";
  createdAt: string;
  processedAt: string | null;
  processedBy: { id: string; nama: string } | null;
  user: {
    id: string;
    nama: string;
    role: "SISWA" | "GURU" | "ADMIN";
    siswa: { nis: string; kelas: { nama: string } } | null;
    guru: { nip: string | null } | null;
  } | null;
};

const RIWAYAT_PAGE_SIZE = 10;

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

function requesterSub(r: PasswordResetRequest): string {
  if (!r.user) return "Akun tidak ditemukan di sistem";
  return r.user.role === "SISWA"
    ? [r.user.siswa?.nis, r.user.siswa?.kelas?.nama].filter(Boolean).join(" · ")
    : (r.user.guru?.nip ? `NIP: ${r.user.guru.nip}` : "Guru");
}

export default function PermintaanPasswordClient() {
  const toast = useToast();
  const [list, setList] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<PasswordResetRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [riwayatOpen, setRiwayatOpen] = useState(false);
  const [riwayatPage, setRiwayatPage] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/password-reset-requests", { cache: "no-store" });
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function completeRequest(id: string, silent = false) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/password-reset-requests/${id}/complete`, { method: "PATCH" });
      if (res.ok) {
        if (!silent) toast.success("Permintaan diabaikan", "");
        fetchData();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal memproses permintaan", "");
      }
    } finally {
      setBusyId(null);
    }
  }

  const pending = list.filter((r) => r.status === "PENDING").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const riwayat = list.filter((r) => r.status === "SELESAI").sort(
    (a, b) => new Date(b.processedAt ?? b.createdAt).getTime() - new Date(a.processedAt ?? a.createdAt).getTime(),
  );
  const selesaiHariIni = riwayat.filter((r) => r.processedAt && isToday(r.processedAt)).length;

  const riwayatPageCount = Math.max(1, Math.ceil(riwayat.length / RIWAYAT_PAGE_SIZE));
  const pagedRiwayat = riwayat.slice(riwayatPage * RIWAYAT_PAGE_SIZE, (riwayatPage + 1) * RIWAYAT_PAGE_SIZE);

  return (
    <>
      <div className="space-y-5 p-1">
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Inbox size={26} className="text-white" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Permintaan Reset Password</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Superadmin</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-white">Permintaan Lupa Password</h1>
                <p className="mt-0.5 text-sm text-white/70">Kelola permintaan reset password dari siswa dan guru</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
                <Clock size={14} className="text-white/70" />
                <div className="leading-tight">
                  <p className="text-sm font-extrabold text-white">{loading ? "—" : pending.length}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Pending</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
                <CheckCircle2 size={14} className="text-white/70" />
                <div className="leading-tight">
                  <p className="text-sm font-extrabold text-white">{loading ? "—" : selesaiHariIni}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Selesai Hari Ini</p>
                </div>
              </div>
              <LiveClock />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-24 dark:border-slate-700/40 dark:bg-slate-900/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Permintaan Pending</h2>
                {pending.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {pending.length} permintaan
                  </span>
                )}
              </div>

              {pending.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700/50 dark:bg-slate-900/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle2 size={22} className="text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tidak ada permintaan pending saat ini</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pending.map((r, i) => (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.03 }}
                      className="flex flex-col gap-3 rounded-xl border-l-4 border-amber-400 bg-white py-3.5 pl-4 pr-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: r.user
                            ? (r.user.role === "SISWA" ? "linear-gradient(135deg,#4F8EF7,#3B7CE8)" : "linear-gradient(135deg,#8B5CF6,#6D28D9)")
                            : "linear-gradient(135deg,#94a3b8,#64748b)" }}>
                          {getInitials(r.namaPengaju)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-[15px] font-semibold text-slate-800 dark:text-white">{r.namaPengaju}</p>
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: r.user ? "#EEF4FF" : "#FEF2F2", color: r.user ? "#3B7CE8" : "#DC2626" }}>
                              {r.loginIdDiajukan}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{requesterSub(r)}</p>
                          {r.keterangan && (
                            <p className="mt-1 flex items-start gap-1 text-[13px] text-slate-500 dark:text-slate-400">
                              <MessageSquareText size={12} className="mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{r.keterangan}</span>
                            </p>
                          )}
                          <p className="mt-1 text-[13px] text-slate-400 dark:text-slate-500">Diajukan {timeAgo(r.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        {r.user && (
                          <button onClick={() => setResetTarget(r)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:brightness-95"
                            style={{ background: "linear-gradient(135deg, #4338ca 0%, #2563eb 50%, #0ea5e9 100%)" }}>
                            <KeyRound size={13} /> Proses
                          </button>
                        )}
                        <button onClick={() => completeRequest(r.id)} disabled={busyId === r.id}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700">
                          <XCircle size={13} /> Abaikan
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <button type="button" onClick={() => setRiwayatOpen((v) => !v)}
                className="mb-3 flex w-full items-center gap-2 text-left">
                <History size={16} className="text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Riwayat Permintaan</h2>
                {riwayat.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    {riwayat.length}
                  </span>
                )}
                <ChevronDown size={16}
                  className={`ml-auto shrink-0 text-slate-400 transition-transform duration-200 ${riwayatOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {riwayatOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    {riwayat.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700/50 dark:bg-slate-900/40">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <History size={22} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada permintaan yang diselesaikan</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pb-1">
                        {pagedRiwayat.map((r, i) => (
                          <motion.div key={r.id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.16, delay: i * 0.02 }}
                            className="flex flex-col gap-2 rounded-xl border-l-4 border-emerald-400 bg-white py-3 pl-4 pr-4 shadow-sm dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ background: "linear-gradient(135deg,#94a3b8,#64748b)" }}>
                                {getInitials(r.namaPengaju)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="text-[15px] font-semibold text-slate-800 dark:text-white">{r.namaPengaju}</p>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                    {r.loginIdDiajukan}
                                  </span>
                                  <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    <CheckCircle2 size={9} /> Selesai
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[13px] text-slate-400 dark:text-slate-500">
                                  Diajukan {formatWaktu(r.createdAt)}
                                  {r.processedAt && <> · Diproses {formatWaktu(r.processedAt)}{r.processedBy ? ` oleh ${r.processedBy.nama}` : ""}</>}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {riwayatPageCount > 1 && (
                          <div className="flex items-center justify-between px-1 pt-2">
                            <span className="text-[13px] text-slate-400 dark:text-slate-500">
                              {riwayatPage * RIWAYAT_PAGE_SIZE + 1}–{Math.min((riwayatPage + 1) * RIWAYAT_PAGE_SIZE, riwayat.length)} dari {riwayat.length}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setRiwayatPage((p) => Math.max(0, p - 1))} disabled={riwayatPage === 0}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                                <ChevronLeft size={14} />
                              </button>
                              <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">{riwayatPage + 1}/{riwayatPageCount}</span>
                              <button onClick={() => setRiwayatPage((p) => Math.min(riwayatPageCount - 1, p + 1))} disabled={riwayatPage >= riwayatPageCount - 1}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </>
        )}
      </div>

      {resetTarget && resetTarget.user && (
        <ResetPasswordModal
          userId={resetTarget.user.id}
          userName={resetTarget.user.nama}
          nis={resetTarget.user.role === "SISWA" ? resetTarget.user.siswa?.nis : undefined}
          mustChangePassword={true}
          onClose={() => setResetTarget(null)}
          onSuccess={async () => {
            await completeRequest(resetTarget.id, true);
            setResetTarget(null);
          }}
        />
      )}
    </>
  );
}
