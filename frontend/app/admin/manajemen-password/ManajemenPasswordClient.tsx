"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  KeyRound, Users, School, UserCheck,
  CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";

type KelasWithWali = {
  id: string;
  nama: string;
  waliKelasGuru: { id: string; user: { id: string; nama: string } } | null;
  _count?: { siswa: number };
};

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

type SiswaPageItem = {
  id: string;
  nis: string;
  nama: string;
  user: { id: string; mustChangePassword: boolean; updatedAt: string } | null;
};

type SiswaPageResponse = {
  items: SiswaPageItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ResetTarget = { id: string; nama: string; nis?: string; mustChangePassword: boolean };

const PAGE_SIZE = 10;

function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
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

function StatusBadge({ mustChangePassword, updatedAt }: { mustChangePassword: boolean; updatedAt: string }) {
  return mustChangePassword ? (
    <div className="flex flex-col items-end gap-0.5">
      <span className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white">
        <AlertTriangle size={11} /> Belum Ganti
      </span>
      <span className="text-[11px] text-slate-400 dark:text-slate-500">{belumGantiLabel(updatedAt)}</span>
    </div>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
      <CheckCircle2 size={11} /> Sudah Ganti
    </span>
  );
}

export default function ManajemenPasswordClient() {
  const [kelasList, setKelasList] = useState<KelasWithWali[]>([]);
  const [accountList, setAccountList] = useState<AccountStatus[]>([]);
  const [loadingLeft, setLoadingLeft] = useState(true);

  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [siswaPage, setSiswaPage] = useState<SiswaPageResponse | null>(null);
  const [loadingRight, setLoadingRight] = useState(false);

  const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);

  const fetchLeft = useCallback(async () => {
    setLoadingLeft(true);
    try {
      const [kelasRes, statusRes] = await Promise.all([
        fetch("/api/kelas", { cache: "no-store" }),
        fetch("/api/users/password-status", { cache: "no-store" }),
      ]);
      if (kelasRes.ok) setKelasList(await kelasRes.json());
      if (statusRes.ok) setAccountList(await statusRes.json());
    } finally {
      setLoadingLeft(false);
    }
  }, []);

  useEffect(() => { fetchLeft(); }, [fetchLeft]);

  const waliKelasList = useMemo(
    () => kelasList.filter((k) => !!k.waliKelasGuru).sort((a, b) => a.nama.localeCompare(b.nama)),
    [kelasList],
  );

  useEffect(() => {
    if (!selectedKelasId && waliKelasList.length > 0) {
      setSelectedKelasId(waliKelasList[0].id);
    }
  }, [waliKelasList, selectedKelasId]);

  const fetchSiswaPage = useCallback(async (kelasId: string, page: number) => {
    if (!kelasId) return;
    setLoadingRight(true);
    try {
      const qs = new URLSearchParams({ kelasId, page: String(page), limit: String(PAGE_SIZE) });
      const res = await fetch(`/api/users/manajemen-password/siswa?${qs}`, { cache: "no-store" });
      if (res.ok) setSiswaPage(await res.json());
    } finally {
      setLoadingRight(false);
    }
  }, []);

  useEffect(() => {
    if (selectedKelasId) fetchSiswaPage(selectedKelasId, currentPage);
  }, [selectedKelasId, currentPage, fetchSiswaPage]);

  function selectKelas(kelasId: string) {
    if (kelasId === selectedKelasId) return;
    setSelectedKelasId(kelasId);
    setCurrentPage(1);
  }

  function refetchAll() {
    fetchLeft();
    if (selectedKelasId) fetchSiswaPage(selectedKelasId, currentPage);
  }

  const totalCount = accountList.length;
  const sudahGantiCount = accountList.filter((u) => !u.mustChangePassword).length;
  const belumGantiCount = accountList.filter((u) => u.mustChangePassword).length;

  const accountById = useMemo(() => {
    const map: Record<string, AccountStatus> = {};
    for (const a of accountList) map[a.id] = a;
    return map;
  }, [accountList]);

  const selectedKelas = waliKelasList.find((k) => k.id === selectedKelasId) ?? null;

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
                <p className="text-sm font-extrabold text-white">{loadingLeft ? "—" : totalCount}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Total Akun</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
              <CheckCircle2 size={14} className="text-emerald-300" />
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-white">{loadingLeft ? "—" : sudahGantiCount}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Sudah Ganti</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
              <AlertTriangle size={14} className="text-amber-300" />
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-white">{loadingLeft ? "—" : belumGantiCount}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Belum Ganti</p>
              </div>
            </div>
            <LiveClock />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        {/* Kolom kiri — wali kelas */}
        <section className="min-w-0">
          <div className="mb-3 flex items-center gap-2 px-1">
            <UserCheck size={16} className="text-violet-500" />
            <h2 className="text-[15px] font-semibold text-slate-800 dark:text-white">Wali Kelas</h2>
            {waliKelasList.length > 0 && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                {waliKelasList.length}
              </span>
            )}
          </div>

          {loadingLeft ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 dark:border-slate-700/40 dark:bg-slate-900/60">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : waliKelasList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700/50 dark:bg-slate-900/40">
              <School size={22} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada kelas dengan wali kelas</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434] lg:max-h-[640px] lg:overflow-y-auto">
              <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {waliKelasList.map((k) => {
                  const guru = k.waliKelasGuru!;
                  const account = accountById[guru.user.id];
                  const active = k.id === selectedKelasId;
                  const displayNama = toTitleCase(guru.user.nama);
                  return (
                    <motion.div
                      key={k.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectKelas(k.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectKelas(k.id); } }}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex w-full cursor-pointer flex-col gap-3 border-l-4 px-4 py-3.5 text-left transition-colors sm:flex-row sm:items-center"
                      style={{
                        borderLeftColor: active ? "#4338ca" : "transparent",
                        backgroundColor: active ? "rgba(67,56,202,0.06)" : "transparent",
                      }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                          {getInitials(displayNama)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-slate-800 dark:text-white">{displayNama}</p>
                          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{account?.loginId ?? "-"}</span>
                            <span className="ml-1.5">· Wali {k.nama}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                        {account && <StatusBadge mustChangePassword={account.mustChangePassword} updatedAt={account.updatedAt} />}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (account) setResetTarget({ id: account.id, nama: displayNama, mustChangePassword: account.mustChangePassword });
                          }}
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
        </section>

        {/* Kolom kanan — siswa dari kelas yang dipilih */}
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <Users size={16} className="text-blue-500" />
              <h2 className="truncate text-[15px] font-semibold text-slate-800 dark:text-white">
                {selectedKelas ? `Siswa Kelas ${selectedKelas.nama}` : "Siswa"}
              </h2>
            </div>
            {siswaPage && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {siswaPage.total} siswa
              </span>
            )}
          </div>

          {!selectedKelasId ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700/50 dark:bg-slate-900/40">
              <Users size={22} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pilih wali kelas di sebelah kiri</p>
            </div>
          ) : loadingRight || !siswaPage ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 dark:border-slate-700/40 dark:bg-slate-900/60">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : siswaPage.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700/50 dark:bg-slate-900/40">
              <Users size={22} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada siswa di kelas ini</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434] lg:max-h-[640px] lg:overflow-y-auto">
                <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {siswaPage.items.map((s) => {
                    const displayNama = toTitleCase(s.nama);
                    return (
                      <div key={s.id}
                        className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#4F8EF7,#3B7CE8)" }}>
                            {getInitials(displayNama)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-slate-800 dark:text-white">{displayNama}</p>
                            <p className="mt-0.5 font-mono text-[13px] text-slate-500 dark:text-slate-400">{s.nis}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                          {s.user ? (
                            <>
                              <StatusBadge mustChangePassword={s.user.mustChangePassword} updatedAt={s.user.updatedAt} />
                              <button
                                onClick={() => setResetTarget({ id: s.user!.id, nama: displayNama, nis: s.nis, mustChangePassword: s.user!.mustChangePassword })}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:brightness-95"
                                style={{ background: "linear-gradient(135deg, #4338ca 0%, #2563eb 50%, #0ea5e9 100%)" }}>
                                <KeyRound size={13} /> Reset Password
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400">Belum ada akun</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {siswaPage.totalPages > 1 && (
                <div className="flex items-center justify-between px-1 pt-3">
                  <span className="text-[13px] text-slate-400 dark:text-slate-500">
                    Halaman {siswaPage.page} dari {siswaPage.totalPages} &middot; {siswaPage.total} siswa
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                      {currentPage}/{siswaPage.totalPages}
                    </span>
                    <button onClick={() => setCurrentPage((p) => Math.min(siswaPage.totalPages, p + 1))} disabled={currentPage >= siswaPage.totalPages}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {resetTarget && (
        <ResetPasswordModal
          userId={resetTarget.id}
          userName={resetTarget.nama}
          nis={resetTarget.nis}
          mustChangePassword={resetTarget.mustChangePassword}
          onClose={() => setResetTarget(null)}
          onSuccess={refetchAll}
        />
      )}
    </div>
  );
}
