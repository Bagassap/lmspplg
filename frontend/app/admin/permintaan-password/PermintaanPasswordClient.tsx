"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, ChevronRight, Inbox, GraduationCap, User, CheckCircle2, AlertTriangle, MessageSquareText } from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";
import { useToast } from "@/components/shared/ToastSystem";

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

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function PermintaanPasswordClient() {
  const toast = useToast();
  const [list, setList] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"PENDING" | "SELESAI">("PENDING");
  const [resetTarget, setResetTarget] = useState<PasswordResetRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function completeRequest(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/password-reset-requests/${id}/complete`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Ditandai selesai", "");
        fetchData();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menandai selesai", "");
      }
    } finally {
      setBusyId(null);
    }
  }

  const filtered = list.filter((r) => r.status === tab);
  const pendingCount = list.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
        style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <span>Admin Panel</span><ChevronRight size={11} /><span className="text-white/90">Permintaan Password</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
                <Inbox size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">Permintaan Password</h1>
                <p className="mt-0.5 text-sm text-white/70">Permintaan reset password yang dikirim lewat halaman Lupa Password</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <LiveClock />
            <div className="flex flex-wrap justify-end gap-2">
              <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <AlertTriangle size={12} className="text-white/70" />{loading ? "—" : pendingCount} Pending
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["PENDING", "SELESAI"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
            style={t === tab
              ? { background: "linear-gradient(135deg,#6334F4,#4F46E5)", color: "#fff" }
              : { backgroundColor: "#F1F5F9", color: "#64748b" }}>
            {t === "PENDING" ? "Pending" : "Riwayat Selesai"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white py-24 text-center shadow-sm dark:border-slate-700/40 dark:bg-slate-900/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800">
            <Inbox size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {tab === "PENDING" ? "Tidak ada permintaan tertunda" : "Belum ada permintaan yang diselesaikan"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
          <div className="flex flex-col gap-2 p-3">
            {filtered.map((r, i) => {
              const sub = r.user
                ? (r.user.role === "SISWA"
                    ? [r.user.siswa?.nis, r.user.siswa?.kelas?.nama].filter(Boolean).join(" · ")
                    : (r.user.guru?.nip ? `NIP: ${r.user.guru.nip}` : "Guru"))
                : "Akun tidak ditemukan di sistem";
              return (
                <motion.div key={r.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.02 }}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: r.user
                        ? (r.user.role === "SISWA" ? "linear-gradient(135deg,#4F8EF7,#3B7CE8)" : "linear-gradient(135deg,#8B5CF6,#6D28D9)")
                        : "linear-gradient(135deg,#94a3b8,#64748b)" }}>
                      {getInitials(r.namaPengaju)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{r.namaPengaju}</p>
                      <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: r.user ? "#EEF4FF" : "#FEF2F2", color: r.user ? "#3B7CE8" : "#DC2626" }}>
                          {r.loginIdDiajukan}
                        </span>
                        <span className="ml-1.5">{sub}</span>
                      </p>
                      {r.keterangan && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <MessageSquareText size={11} className="mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{r.keterangan}</span>
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-gray-400">
                        Diajukan {formatWaktu(r.createdAt)}
                        {r.status === "SELESAI" && r.processedAt && (
                          <> · Diproses {formatWaktu(r.processedAt)}{r.processedBy ? ` oleh ${r.processedBy.nama}` : ""}</>
                        )}
                      </p>
                    </div>
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      {r.user ? (
                        <button onClick={() => setResetTarget(r)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20">
                          <KeyRound size={12} /> Proses
                        </button>
                      ) : null}
                      <button onClick={() => completeRequest(r.id)} disabled={busyId === r.id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-emerald-600 transition-all hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-900/20">
                        <CheckCircle2 size={12} /> Tandai Selesai
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {resetTarget && resetTarget.user && (
        <ResetPasswordModal
          userId={resetTarget.user.id}
          userName={resetTarget.user.nama}
          nis={resetTarget.user.role === "SISWA" ? resetTarget.user.siswa?.nis : undefined}
          mustChangePassword={true}
          onClose={() => setResetTarget(null)}
          onSuccess={async () => {
            await completeRequest(resetTarget.id);
            setResetTarget(null);
          }}
        />
      )}
    </div>
  );
}
