"use client";

import { AppFold } from "@/components/app/AppUI";
import { icon3dStyle } from "@/components/shared/Icon3D";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, FileSpreadsheet, UserPlus, ChevronLeft, ShieldCheck, Users, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { StatusFilterCard } from "@/components/magang/StatusFilterCard";
import { Avatar } from "@/components/shared/Avatar";
import { PasswordSiswaModal } from "@/components/shared/PasswordSiswaModal";
import { KelolaAdminModal } from "./KelolaAdminModal";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";
import { useToast } from "@/components/shared/ToastSystem";
import { FilterBarPassword, type StatusFilter } from "./FilterBarPassword";
import { SiswaPasswordTable, type SiswaPasswordItem } from "./SiswaPasswordTable";
import { CreateAccountModal } from "./CreateAccountModal";
import { ImportSiswaModal } from "./ImportSiswaModal";
import { KelolaGuruModal } from "./KelolaGuruModal";
import { namaSiswa, namaOrang } from "@/lib/nama";

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
  fotoProfil?: string | null;
  siswa: { nis: string; kelas: { nama: string } } | null;
  guru: { nip: string | null } | null;
};

type SiswaPageResponse = { items: SiswaPasswordItem[]; total: number };

type ResetTarget = { id: string; nama: string; nis?: string; loginId?: string; mustChangePassword: boolean; sourceRequestId?: string };

function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function ManajemenPasswordClient() {
  const router = useRouter();
  const toast = useToast();
  const [kelasList, setKelasList] = useState<KelasWithWali[]>([]);
  const [accountList, setAccountList] = useState<AccountStatus[]>([]);
  const [, setLoadingHeader] = useState(true);

  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [siswaPage, setSiswaPage] = useState<SiswaPageResponse | null>(null);
  const [loadingSiswa, setLoadingSiswa] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const [busyId, setBusyId] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [importSiswaOpen, setImportSiswaOpen] = useState(false);
  const [kelolaGuruOpen, setKelolaGuruOpen] = useState(false);
  const [kelolaAdminOpen, setKelolaAdminOpen] = useState(false);
  const [lihatTarget, setLihatTarget] = useState<{ id: string; nama: string; nis: string; mustChangePassword: boolean } | null>(null);

  const fetchHeader = useCallback(async () => {
    setLoadingHeader(true);
    try {
      const [kelasRes, statusRes] = await Promise.all([
        fetch("/api/kelas", { cache: "no-store" }),
        fetch("/api/users/password-status", { cache: "no-store" }),
      ]);
      if (kelasRes.ok) setKelasList(await kelasRes.json());
      if (statusRes.ok) setAccountList(await statusRes.json());
    } finally {
      setLoadingHeader(false);
    }
  }, []);

  useEffect(() => { fetchHeader(); }, [fetchHeader]);

  useEffect(() => {
    if (!selectedKelasId && kelasList.length > 0) setSelectedKelasId(kelasList[0].id);
  }, [kelasList, selectedKelasId]);

  const fetchSiswaPage = useCallback(async (kelasId: string) => {
    if (!kelasId) return;
    setLoadingSiswa(true);
    try {
      const qs = new URLSearchParams({ kelasId, page: "1", limit: "1000" });
      const res = await fetch(`/api/users/manajemen-password/siswa?${qs}`, { cache: "no-store" });
      if (res.ok) setSiswaPage(await res.json());
    } finally {
      setLoadingSiswa(false);
    }
  }, []);

  useEffect(() => {
    if (selectedKelasId) fetchSiswaPage(selectedKelasId);
    setSearch("");
    setStatusFilter("");
  }, [selectedKelasId, fetchSiswaPage]);

  function refetchAll() {
    fetchHeader();
    if (selectedKelasId) fetchSiswaPage(selectedKelasId);
  }

  const accountById = useMemo(() => {
    const map: Record<string, AccountStatus> = {};
    for (const a of accountList) map[a.id] = a;
    return map;
  }, [accountList]);

  const selectedKelas = kelasList.find((k) => k.id === selectedKelasId) ?? null;
  const waliAccount = selectedKelas?.waliKelasGuru ? accountById[selectedKelas.waliKelasGuru.user.id] : undefined;

  const siswaItems = siswaPage?.items ?? [];
  const sudahCount = siswaItems.filter((s) => s.user && !s.user.mustChangePassword).length;
  const belumCount = siswaItems.filter((s) => s.user && s.user.mustChangePassword).length;

  const displayed = siswaItems
    .filter((s) => (statusFilter === "sudah" ? s.user && !s.user.mustChangePassword : statusFilter === "belum" ? s.user && s.user.mustChangePassword : true))
    .filter((s) => (search ? (toTitleCase(s.nama).toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search)) : true));

  return (
    <div>

      <div className="app-hide relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
        <div className="app-header-row relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/admin/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Manajemen Password</h1>
        </div>
        <div className="h-7 rounded-t-[28px] bg-surface dark:bg-[#0F172A]" />
      </div>

      <div className="mt-0 grid grid-cols-1 items-start gap-4 lg:mt-5 lg:grid-cols-[13rem_minmax(0,1fr)_17rem] lg:gap-5 xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
        <div className="hidden lg:block">
          <StatusFilterCard<StatusFilter>
            items={[
              { value: "", label: "Semua", bg: "#E0F2FE", clr: "#0EA5E9", icon: Users, count: siswaItems.length },
              { value: "sudah", label: "Sudah Ganti", bg: "#E4F5EC", clr: "#22A06B", icon: CheckCircle2, count: sudahCount },
              { value: "belum", label: "Belum Ganti", bg: "#FEE2E2", clr: "#DC2626", icon: XCircle, count: belumCount },
            ]}
            value={statusFilter} onChange={setStatusFilter} />
        </div>

        <div className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-slate-800">
          <FilterBarPassword
            kelasList={kelasList}
            selectedKelasId={selectedKelasId}
            onSelectKelas={setSelectedKelasId}
            kelasNama={selectedKelas?.nama}
            wali={waliAccount ? { id: waliAccount.id, nama: namaOrang(waliAccount.nama), fotoProfil: waliAccount.fotoProfil, mustChangePassword: waliAccount.mustChangePassword } : null}
            onResetWali={() => waliAccount && setResetTarget({ id: waliAccount.id, nama: namaOrang(waliAccount.nama), loginId: waliAccount.loginId ?? undefined, mustChangePassword: waliAccount.mustChangePassword })}
            search={search} onSearch={setSearch}
            statusFilter={statusFilter} onStatusFilter={setStatusFilter}
            total={siswaItems.length} sudahCount={sudahCount} belumCount={belumCount} displayedCount={displayed.length}
            ringkas
          />
          <div className="border-t border-slate-100 dark:border-slate-700/50">
            <SiswaPasswordTable
              loading={loadingSiswa}
              siswas={displayed}
              onReset={(s) => s.user && setResetTarget({ id: s.user.id, nama: namaSiswa(s.nama), nis: s.nis, mustChangePassword: s.user.mustChangePassword })}
              onLihat={(s) => s.user && setLihatTarget({ id: s.user.id, nama: namaSiswa(s.nama), nis: s.nis, mustChangePassword: s.user.mustChangePassword })}
              mobileNative
            />
          </div>
        </div>

        <div className="hidden space-y-5 lg:block">
          <div className="card-pisah rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <p className="mb-3 px-1 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Aksi Akun</p>
            <div className="grid grid-cols-1 gap-2.5">
              {([
                { label: "Kelola Guru", icon: GraduationCap, tone: "sky" as const, onClick: () => setKelolaGuruOpen(true) },
                { label: "Kelola Admin", icon: ShieldCheck, tone: "violet" as const, onClick: () => setKelolaAdminOpen(true) },
                { label: "Impor Massal", icon: FileSpreadsheet, tone: "emerald" as const, onClick: () => setImportSiswaOpen(true) },
                { label: "Buat Akun", icon: UserPlus, tone: "amber" as const, onClick: () => setCreateAccountOpen(true) },
              ]).map((b) => (
                <button key={b.label} type="button" onClick={b.onClick}
                  className="flex h-12 w-full items-center gap-2.5 rounded-xl bg-slate-50 pl-1.5 pr-4 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5 dark:bg-slate-700 dark:text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={icon3dStyle(b.tone)}>
                    <b.icon size={16} color="#fff" />
                  </span>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {waliAccount && (
            <div className="card-pisah rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <p className="mb-3 px-1 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Wali Kelas</p>
              <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-700">
                <Avatar src={waliAccount.fotoProfil} nama={namaOrang(waliAccount.nama)} sizePx={36} fallbackBg="#3E03B3" textClassName="text-xs font-bold" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{namaOrang(waliAccount.nama)}</p>
                  <span className="mt-0.5 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold"
                    style={waliAccount.mustChangePassword ? { background: "#FEE2E2", color: "#DC2626" } : { background: "#E4F5EC", color: "#22A06B" }}>
                    {waliAccount.mustChangePassword ? "Belum Ganti" : "Sudah Ganti"}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setResetTarget({ id: waliAccount.id, nama: namaOrang(waliAccount.nama), loginId: waliAccount.loginId ?? undefined, mustChangePassword: waliAccount.mustChangePassword })}
                className="mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#3E03B3] text-xs font-bold text-white">
                <KeyRound size={13} /> Reset Password Wali
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:hidden">
          <AppFold title="Aksi akun" hint="Kelola guru, impor massal, buat akun">
          <div className="grid grid-cols-4 gap-2 p-5">
            <motion.button
              onClick={() => setKelolaGuruOpen(true)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              title="Kelola Guru"
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-white shadow-sm transition-all hover:brightness-105"
              style={{ background: "#3E03B3" }}>
              <GraduationCap size={18} />
              <span className="text-[10px] font-bold leading-tight">Kelola Guru</span>
            </motion.button>
            <motion.button
              onClick={() => setKelolaAdminOpen(true)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              title="Kelola Admin"
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-white shadow-sm transition-all hover:brightness-105"
              style={{ background: "#3E03B3" }}>
              <ShieldCheck size={18} />
              <span className="text-[10px] font-bold leading-tight">Kelola Admin</span>
            </motion.button>
            <motion.button
              onClick={() => setImportSiswaOpen(true)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              title="Impor Massal"
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-white shadow-sm transition-all hover:brightness-105"
              style={{ background: "#3E03B3" }}>
              <FileSpreadsheet size={18} />
              <span className="text-[10px] font-bold leading-tight">Impor Massal</span>
            </motion.button>
            <motion.button
              onClick={() => setCreateAccountOpen(true)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              title="Buat Akun"
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-white shadow-sm transition-all hover:brightness-105"
              style={{ background: "#3E03B3" }}>
              <UserPlus size={18} />
              <span className="text-[10px] font-bold leading-tight">Buat Akun</span>
            </motion.button>
          </div>

          </AppFold>
        </div>
      </div>

      {resetTarget && (
        <ResetPasswordModal
          userId={resetTarget.id}
          userName={resetTarget.nama}
          nis={resetTarget.nis}
          loginId={resetTarget.loginId}
          mustChangePassword={resetTarget.mustChangePassword}
          onClose={() => setResetTarget(null)}
          onSuccess={async () => {
            refetchAll();
          }}
        />
      )}

      {lihatTarget && (
        <PasswordSiswaModal
          userId={lihatTarget.id}
          nama={lihatTarget.nama}
          onClose={() => setLihatTarget(null)}
          onReset={() => { setResetTarget({ id: lihatTarget.id, nama: lihatTarget.nama, nis: lihatTarget.nis, mustChangePassword: lihatTarget.mustChangePassword }); setLihatTarget(null); }}
        />
      )}

      <KelolaAdminModal
        open={kelolaAdminOpen}
        onClose={() => setKelolaAdminOpen(false)}
        onResetPassword={(t) => setResetTarget(t)}
      />

      <CreateAccountModal
        open={createAccountOpen}
        kelasList={kelasList.map((k) => ({ id: k.id, nama: k.nama }))}
        onClose={() => setCreateAccountOpen(false)}
        onCreated={refetchAll}
      />

      <ImportSiswaModal
        open={importSiswaOpen}
        onClose={() => setImportSiswaOpen(false)}
        onImported={refetchAll}
      />

      <KelolaGuruModal
        open={kelolaGuruOpen}
        kelasList={kelasList}
        onClose={() => setKelolaGuruOpen(false)}
        onResetPassword={(t) => setResetTarget(t)}
        onChanged={refetchAll}
      />
    </div>
  );
}
