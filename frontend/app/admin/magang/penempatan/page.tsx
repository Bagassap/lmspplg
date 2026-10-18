"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Building2, ClipboardList, Wallet, ChevronLeft } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { toTitleCase } from "@/components/data-siswa/shared";
import type { SiswaCardData } from "@/components/data-siswa/shared";
import { GradientStatCard } from "@/components/shared/GradientStatCard";
import { KelolaTempatModal } from "@/components/magang/KelolaTempatModal";
import { TempatkanSiswaModal } from "@/components/magang/TempatkanSiswaModal";
import { EditPenempatanModal } from "@/components/magang/EditPenempatanModal";
import { PenempatanFilterBar, type PenempatanStatusFilter } from "@/components/magang/PenempatanFilterBar";
import { PenempatanTable } from "@/components/magang/PenempatanTable";
import type { TempatMagang, PenempatanMagang, StatusPenempatan } from "@/components/magang/types";
import { icon3dStyle } from "@/components/shared/Icon3D";
import { useIsAppMode } from "@/lib/pwaInstall";

type GuruOption = { id: string; user: { id: string; nama: string } };

const statGridVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function AdminMagangPenempatanPage() {
  const router = useRouter();
  const appMode = useIsAppMode();
  const toast = useToast();
  const [tempatList, setTempatList] = useState<TempatMagang[]>([]);
  const [penempatanList, setPenempatanList] = useState<PenempatanMagang[]>([]);
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [guruList, setGuruList] = useState<GuruOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKelolaTempat, setShowKelolaTempat] = useState(false);
  const [showTempatkan, setShowTempatkan] = useState(false);
  const [editTarget, setEditTarget] = useState<PenempatanMagang | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PenempatanStatusFilter>("");

  const loadTempat = useCallback(async () => {
    const res = await fetch("/api/magang/tempat", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setTempatList(Array.isArray(list) ? list : []);
  }, []);

  const loadPenempatan = useCallback(async () => {
    const res = await fetch("/api/magang/penempatan", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setPenempatanList(Array.isArray(list) ? list : []);
  }, []);

  const loadSiswa = useCallback(async () => {
    const res = await fetch("/api/siswa", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setSiswaList(Array.isArray(list) ? list : []);
  }, []);

  const loadGuru = useCallback(async () => {
    const res = await fetch("/api/kelas/guru-list", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setGuruList(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTempat(), loadPenempatan(), loadSiswa(), loadGuru()]).finally(() => setLoading(false));
  }, [loadTempat, loadPenempatan, loadSiswa, loadGuru]);

  async function ubahStatus(p: PenempatanMagang, status: StatusPenempatan) {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/magang/penempatan/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success("Status penempatan diperbarui", ""); loadPenempatan(); loadTempat(); }
      else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal mengubah status", "");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function hapus(p: PenempatanMagang) {
    const namaSiswa = toTitleCase(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
    const ok = await toast.confirm(
      "Hapus penempatan ini?",
      `Penempatan ${namaSiswa} di "${p.tempatMagang.namaTempat}" akan dihapus.`,
    );
    if (!ok) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/magang/penempatan/${p.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Penempatan dihapus", ""); loadPenempatan(); loadTempat(); }
      else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menghapus penempatan", "");
      }
    } finally {
      setBusyId(null);
    }
  }

  const jumlahAktif = penempatanList.filter((p) => p.status === "AKTIF").length;
  const jumlahSelesai = penempatanList.filter((p) => p.status === "SELESAI").length;
  const jumlahBatal = penempatanList.filter((p) => p.status === "BATAL").length;
  const totalKuota = tempatList.reduce((sum, t) => sum + t.kuota, 0);

  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return penempatanList
      .filter((p) => (statusFilter ? p.status === statusFilter : true))
      .filter((p) => {
        if (!q) return true;
        const nama = (p.siswa.nama ?? p.siswa.user?.nama ?? "").toLowerCase();
        return nama.includes(q) || p.siswa.nis.includes(q) || p.tempatMagang.namaTempat.toLowerCase().includes(q);
      });
  }, [penempatanList, search, statusFilter]);

  return (
    <div className="lg:p-1">
      <div className="relative hidden overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
            style={{ background: "linear-gradient(145deg, #0EA5E9 0%, #3E03B3 55%, #2D0281 100%)" }}>
            <Briefcase size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden" />
            <Briefcase size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">PKL</span>
            <h1 className="text-xl font-extrabold leading-tight text-slate-800 dark:text-white sm:text-2xl">Penempatan PKL</h1>
          </div>
        </div>
      </div>

      <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
        <div className="app-header-row relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/admin/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Penempatan PKL</h1>
        </div>
        <div className="h-7 rounded-t-[28px] bg-surface dark:bg-[#0F172A]" />
      </div>

      <div className="mt-0 space-y-5 lg:mt-5">
      {appMode && (
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {[
            { label: "Tempat Magang", value: loading ? "—" : tempatList.length, icon: Building2, tone: "indigo" as const },
            { label: "Siswa PKL Aktif", value: loading ? "—" : jumlahAktif, icon: Briefcase, tone: "emerald" as const },
            { label: "Total Kuota", value: loading ? "—" : totalKuota, icon: Wallet, tone: "amber" as const },
            { label: "Riwayat Penempatan", value: loading ? "—" : penempatanList.length, icon: ClipboardList, tone: "sky" as const },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px]" style={icon3dStyle(t.tone)}>
                <t.icon size={24} color="#fff" />
              </span>
              <span className="text-xl font-extrabold leading-none text-slate-900 dark:text-white">{t.value}</span>
              <span className="-mt-1 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.label}</span>
            </div>
          ))}
        </div>
      )}
      <div className={appMode ? "hidden lg:block" : "contents"}>
      <motion.div initial="hidden" animate="visible" variants={statGridVariants}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <GradientStatCard
            tone="navy"
            label="Tempat Magang"
            value={loading ? "—" : tempatList.length}
            icon={Building2}
          />
        </div>
        <div className="lg:col-span-4">
          <GradientStatCard
            tone="lime"
            label="Siswa PKL Aktif"
            value={loading ? "—" : jumlahAktif}
            icon={Briefcase}
          />
        </div>
        <div className="lg:col-span-2">
          <GradientStatCard
            tone="red"
            label="Total Kuota"
            value={loading ? "—" : totalKuota}
            icon={Wallet}
          />
        </div>
        <div className="lg:col-span-3">
          <GradientStatCard
            tone="blue"
            label="Total Riwayat Penempatan"
            value={loading ? "—" : penempatanList.length}
            icon={ClipboardList}
          />
        </div>
      </motion.div>
      </div>

      <PenempatanFilterBar
        search={search} onSearch={setSearch}
        statusFilter={statusFilter} onStatusFilter={setStatusFilter}
        total={penempatanList.length} aktifCount={jumlahAktif} selesaiCount={jumlahSelesai} batalCount={jumlahBatal}
        displayedCount={displayList.length}
        onKelolaTempat={() => setShowKelolaTempat(true)}
        onTempatkan={() => setShowTempatkan(true)}
        mobileNative
      />

      <PenempatanTable
        loading={loading}
        list={displayList}
        busyId={busyId}
        onUbahStatus={ubahStatus}
        onEdit={setEditTarget}
        onHapus={hapus}
        mobileNative
      />
      </div>

      <AnimatePresence>
        {showKelolaTempat && (
          <KelolaTempatModal
            tempatList={tempatList}
            onClose={() => setShowKelolaTempat(false)}
            onSaved={loadTempat}
          />
        )}
        {showTempatkan && (
          <TempatkanSiswaModal
            siswaList={siswaList}
            tempatList={tempatList}
            guruList={guruList}
            penempatanList={penempatanList}
            onClose={() => setShowTempatkan(false)}
            onSaved={() => { loadPenempatan(); loadTempat(); }}
          />
        )}
        {editTarget && (
          <EditPenempatanModal
            penempatan={editTarget}
            tempatList={tempatList}
            guruList={guruList}
            onClose={() => setEditTarget(null)}
            onSaved={() => { loadPenempatan(); loadTempat(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
