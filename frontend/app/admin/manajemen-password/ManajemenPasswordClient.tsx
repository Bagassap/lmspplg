"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  KeyRound, Search, ChevronDown, Users, GraduationCap,
  CheckCircle2, AlertTriangle, X,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";

type AccountStatus = {
  id: string;
  nama: string;
  role: "SISWA" | "GURU";
  loginId: string | null;
  mustChangePassword: boolean;
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
function loginIdentifier(u: AccountStatus): string {
  return u.role === "SISWA" ? (u.siswa?.nis ?? "-") : (u.loginId ?? u.guru?.nip ?? "-");
}
function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}
function belumGantiLabel(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return "Belum ganti hari ini";
  if (d === 1) return "Belum ganti 1 hari";
  return `Belum ganti ${d} hari`;
}

const SELECT =
  "h-10.5 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-600 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

export default function ManajemenPasswordClient() {
  const [list, setList] = useState<AccountStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<AccountStatus | null>(null);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"" | "SISWA" | "GURU">("");
  const [filterStatus, setFilterStatus] = useState<"" | "SUDAH" | "BELUM">("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/password-status", { cache: "no-store" });
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCount = list.length;
  const sudahGantiCount = list.filter((u) => !u.mustChangePassword).length;
  const belumGantiCount = list.filter((u) => u.mustChangePassword).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatus === "SUDAH" && u.mustChangePassword) return false;
      if (filterStatus === "BELUM" && !u.mustChangePassword) return false;
      if (q) {
        const haystack = [u.nama, u.siswa?.nis, u.loginId, u.guru?.nip].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [list, search, filterRole, filterStatus]);

  const isFiltered = !!(search || filterRole || filterStatus);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <KeyRound size={26} className="text-white" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Manajemen Password</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Admin</span>
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Manajemen Password</h1>
              <p className="mt-0.5 text-sm text-white/70">Kelola status dan reset password akun</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
              <Users size={14} className="text-white/70" />
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-white">{loading ? "—" : totalCount}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Total Akun</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
              <CheckCircle2 size={14} className="text-emerald-300" />
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-white">{loading ? "—" : sudahGantiCount}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Sudah Ganti</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
              <AlertTriangle size={14} className="text-amber-300" />
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-white">{loading ? "—" : belumGantiCount}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Belum Ganti</p>
              </div>
            </div>
            <LiveClock />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white px-4 py-3.5 shadow-md dark:border-slate-700 dark:from-slate-800/60 dark:to-slate-800/30">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIS, atau kode login…"
              className="h-10.5 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative shrink-0 sm:w-40">
            <GraduationCap size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as typeof filterRole)} className={SELECT}>
              <option value="">Semua Role</option>
              <option value="SISWA">Siswa</option>
              <option value="GURU">Guru</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative shrink-0 sm:w-44">
            <KeyRound size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} className={SELECT}>
              <option value="">Semua Status</option>
              <option value="SUDAH">Sudah Ganti</option>
              <option value="BELUM">Belum Ganti</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {isFiltered && (
            <button onClick={() => { setSearch(""); setFilterRole(""); setFilterStatus(""); }}
              className="flex h-10.5 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3.5 text-sm font-medium text-red-500 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10">
              <X size={13} /> Reset
            </button>
          )}
        </div>

        {!loading && (
          <div className="mt-3.5 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/40">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Search size={11} /> {filtered.length} akun ditampilkan
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-24 dark:border-slate-700/40 dark:bg-slate-900/60">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white py-24 text-center shadow-sm dark:border-slate-700/40 dark:bg-slate-900/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800">
            <KeyRound size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {isFiltered ? "Tidak ada akun yang cocok dengan filter" : "Belum ada akun terdaftar"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {filtered.map((u, i) => {
              const displayNama = toTitleCase(u.nama);
              const sub = u.role === "SISWA" ? (u.siswa?.kelas?.nama ?? "") : (u.guru?.nip ? `NIP: ${u.guru.nip}` : "Guru");
              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: Math.min(i, 20) * 0.015 }}
                  className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: u.role === "SISWA" ? "linear-gradient(135deg,#4F8EF7,#3B7CE8)" : "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                      {getInitials(displayNama)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[15px] font-semibold text-slate-800 dark:text-white">{displayNama}</p>
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: u.role === "SISWA" ? "#EEF4FF" : "#F5F0FF", color: u.role === "SISWA" ? "#3B7CE8" : "#6D28D9" }}>
                          {u.role === "SISWA" ? "Siswa" : "Guru"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{loginIdentifier(u)}</span>
                        {sub && <span className="ml-1.5">· {sub}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3 self-end sm:self-center">
                    {u.mustChangePassword ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                          <AlertTriangle size={11} /> Belum Ganti
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{belumGantiLabel(u.updatedAt)}</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                        <CheckCircle2 size={11} /> Sudah Ganti
                      </span>
                    )}
                    <button onClick={() => setResetTarget(u)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:brightness-95"
                      style={{ background: "linear-gradient(135deg, #4338ca 0%, #2563eb 50%, #0ea5e9 100%)" }}>
                      <KeyRound size={13} /> Reset Password
                    </button>
                  </div>
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
          nis={resetTarget.role === "SISWA" ? resetTarget.siswa?.nis : undefined}
          mustChangePassword={resetTarget.mustChangePassword}
          onClose={() => setResetTarget(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
