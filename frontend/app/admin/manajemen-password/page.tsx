"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, ChevronRight, ShieldAlert, GraduationCap, User } from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";

type PendingUser = {
  id: string;
  nama: string;
  role: "SISWA" | "GURU";
  updatedAt: string;
  siswa: { nis: string; kelas: { nama: string } } | null;
  guru: { nip: string | null } | null;
};

function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function ManajemenPasswordPage() {
  const [list, setList] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<PendingUser | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/pending-password-change", { cache: "no-store" });
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const siswaCount = list.filter((u) => u.role === "SISWA").length;
  const guruCount = list.filter((u) => u.role === "GURU").length;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
        style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <span>Admin Panel</span><ChevronRight size={11} /><span className="text-white/90">Manajemen Password</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
                <KeyRound size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">Manajemen Password</h1>
                <p className="mt-0.5 text-sm text-white/70">Pantau akun yang belum ganti password sejak login pertama / direset</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <LiveClock />
            <div className="flex flex-wrap justify-end gap-2">
              {[
                { icon: ShieldAlert, label: `${loading ? "—" : list.length} Belum Ganti` },
                { icon: GraduationCap, label: `${loading ? "—" : siswaCount} Siswa` },
                { icon: User, label: `${loading ? "—" : guruCount} Guru` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  <Icon size={12} className="text-white/70" />{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white py-24 text-center shadow-sm dark:border-slate-700/40 dark:bg-slate-900/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800">
            <KeyRound size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Semua akun sudah mengganti password</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Tidak ada akun yang tertunda saat ini</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
          <div className="flex flex-col gap-2 p-3">
            {list.map((u, i) => {
              const displayNama = toTitleCase(u.nama);
              const sub = u.role === "SISWA"
                ? [u.siswa?.nis, u.siswa?.kelas?.nama].filter(Boolean).join(" · ")
                : (u.guru?.nip ? `NIP: ${u.guru.nip}` : "Guru");
              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.02 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: u.role === "SISWA" ? "linear-gradient(135deg,#4F8EF7,#3B7CE8)" : "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                      {getInitials(displayNama)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{displayNama}</p>
                      <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: u.role === "SISWA" ? "#EEF4FF" : "#F5F0FF", color: u.role === "SISWA" ? "#3B7CE8" : "#6D28D9" }}>
                          {u.role === "SISWA" ? "Siswa" : "Guru"}
                        </span>
                        {sub && <span className="ml-1.5">{sub}</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setResetTarget(u)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <KeyRound size={12} /> Reset Password
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {resetTarget && (
        <ResetPasswordModal
          userId={resetTarget.id}
          userName={toTitleCase(resetTarget.nama)}
          onClose={() => setResetTarget(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
