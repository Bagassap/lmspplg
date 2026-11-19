"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Building2, ClipboardList, Wallet, ChevronLeft, ChevronRight as ChevronRightIcon, Users } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { toTitleCase } from "@/components/data-siswa/shared";
import StatsCard from "@/components/dashboard/StatsCard";
import { KelolaTempatModal } from "@/components/magang/KelolaTempatModal";
import { TetapkanGuruModal } from "@/components/magang/TetapkanGuruModal";
import { PenempatanTempatModal } from "@/components/magang/PenempatanTempatModal";
import { PengajuanPklModal } from "@/components/magang/PengajuanPklModal";
import { EditPenempatanModal } from "@/components/magang/EditPenempatanModal";
import { PenempatanFilterBar, type PenempatanStatusFilter } from "@/components/magang/PenempatanFilterBar";
import { STATUS_PENEMPATAN_CFG, type TempatMagang, type PenempatanMagang, type StatusPenempatan } from "@/components/magang/types";
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
  const [guruList, setGuruList] = useState<GuruOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKelolaTempat, setShowKelolaTempat] = useState(false);
  const [tetapkanRows, setTetapkanRows] = useState<PenempatanMagang[] | null>(null);
  const [pengajuanRows, setPengajuanRows] = useState<PenempatanMagang[] | null>(null);
  const [editTarget, setEditTarget] = useState<PenempatanMagang | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PenempatanStatusFilter>("");
  const [bukaTempat, setBukaTempat] = useState<string | null>(null);

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

  const loadGuru = useCallback(async () => {
    const res = await fetch("/api/kelas/guru-list", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setGuruList(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTempat(), loadPenempatan(), loadGuru()]).finally(() => setLoading(false));
  }, [loadTempat, loadPenempatan, loadGuru]);

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

  const jumlahMenunggu = penempatanList.filter((p) => p.status === "MENUNGGU").length;
  const jumlahAktif = penempatanList.filter((p) => p.status === "AKTIF").length;
  const jumlahSelesai = penempatanList.filter((p) => p.status === "SELESAI").length;
  const jumlahBatal = penempatanList.filter((p) => p.status === "BATAL").length;
  const totalKuota = tempatList.reduce((sum, t) => sum + t.kuota, 0);

  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const nm = (p: PenempatanMagang) => (p.siswa.nama ?? p.siswa.user?.nama ?? "").toLowerCase();
    const cmp = (a: string, b: string) => a.localeCompare(b, "id");
    return penempatanList
      .filter((p) => (statusFilter ? p.status === statusFilter : true))
      .filter((p) => {
        if (!q) return true;
        const nama = (p.siswa.nama ?? p.siswa.user?.nama ?? "").toLowerCase();
        return nama.includes(q) || p.siswa.nis.includes(q) || p.tempatMagang.namaTempat.toLowerCase().includes(q) || (p.guruPembimbing?.user.nama ?? "").toLowerCase().includes(q) || p.siswa.kelas.nama.toLowerCase().includes(q);
      })
      .sort((a, b) =>
        cmp(a.tempatMagang.namaTempat, b.tempatMagang.namaTempat)
        || cmp(a.guruPembimbing?.user.nama ?? "\uffff", b.guruPembimbing?.user.nama ?? "\uffff")
        || cmp(nm(a), nm(b)));
  }, [penempatanList, search, statusFilter]);

  const grup = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; rows: PenempatanMagang[] }>();
    displayList.forEach((p) => {
      const g = map.get(p.tempatMagang.id) ?? { id: p.tempatMagang.id, nama: p.tempatMagang.namaTempat, rows: [] };
      g.rows.push(p);
      map.set(p.tempatMagang.id, g);
    });
    const urut: Record<string, number> = { MENUNGGU: 0, AKTIF: 1, SELESAI: 2, BATAL: 3 };
    return [...map.values()]
      .map((g) => ({ ...g, rows: [...g.rows].sort((a, b) => urut[a.status] - urut[b.status]) }))
      .sort((a, b) => Number(b.rows.some((r) => r.status === "MENUNGGU")) - Number(a.rows.some((r) => r.status === "MENUNGGU"))
        || a.nama.localeCompare(b.nama, "id", { sensitivity: "base" }));
  }, [displayList]);

  const grupBuka = bukaTempat ? grup.find((g) => g.id === bukaTempat) ?? null : null;

  return (
    <div className="lg:p-1">

      <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
        <div className="app-header-row relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/admin/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white active:bg-white/25">
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
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard icon={Building2} label="Tempat Magang" value={loading ? 0 : tempatList.length} sub="Tempat PKL terdaftar" delay={0.05} />
        <StatsCard icon={Briefcase} label="Siswa PKL Aktif" value={loading ? 0 : jumlahAktif} sub="Sedang menjalani PKL" delay={0.1} />
        <StatsCard icon={Wallet} label="Total Kuota" value={loading ? 0 : totalKuota} sub="Kapasitas semua tempat" delay={0.15} />
        <StatsCard icon={ClipboardList} label="Riwayat Penempatan" value={loading ? 0 : penempatanList.length} sub="Seluruh penempatan" delay={0.2} />
      </div>
      </div>

      <PenempatanFilterBar
        search={search} onSearch={setSearch}
        statusFilter={statusFilter} onStatusFilter={setStatusFilter}
        total={penempatanList.length} aktifCount={jumlahAktif} selesaiCount={jumlahSelesai} batalCount={jumlahBatal}
        displayedCount={displayList.length}
        onKelolaTempat={() => setShowKelolaTempat(true)}
        menungguCount={jumlahMenunggu}
        mobileNative
      />

      <div className="card-pisah space-y-1.5 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)
        ) : grup.length === 0 ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Tidak ada penempatan yang ditemukan</p>
        ) : grup.map((g) => {
          const menunggu = g.rows.filter((r) => r.status === "MENUNGGU").length;
          const aktif = g.rows.filter((r) => r.status === "AKTIF").length;
          return (
            <button key={g.id} type="button" onClick={() => setBukaTempat(g.id)}
              className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "#FFE9E2", color: "#E8562B" }}><Building2 size={15} /></span>
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-white">{g.nama}</p>
              {menunggu > 0 && (
                <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: STATUS_PENEMPATAN_CFG.MENUNGGU.bg, color: STATUS_PENEMPATAN_CFG.MENUNGGU.clr }}>{menunggu} menunggu</span>
              )}
              {aktif > 0 && (
                <span className="hidden shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold sm:inline" style={{ background: "#E4F5EC", color: "#22A06B" }}>{aktif} aktif</span>
              )}
              <span className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: "#E0F2FE", color: "#0EA5E9" }}>
                <Users size={11} /> {g.rows.length}
              </span>
              <ChevronRightIcon size={16} className="shrink-0 text-[#F26A3D]" />
            </button>
          );
        })}
      </div>
      </div>

      <AnimatePresence>
        {grupBuka && (
          <PenempatanTempatModal judul={grupBuka.nama} rows={grupBuka.rows} busyId={busyId}
            onPeriksa={(p) => setPengajuanRows([p])} onTetapkanGuru={setTetapkanRows}
            onUbahStatus={ubahStatus} onEdit={setEditTarget} onHapus={hapus}
            onClose={() => setBukaTempat(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showKelolaTempat && (
          <KelolaTempatModal
            tempatList={tempatList}
            onClose={() => setShowKelolaTempat(false)}
            onSaved={loadTempat}
          />
        )}
        {pengajuanRows && (
          <PengajuanPklModal
            rows={pengajuanRows}
            guruList={guruList}
            onClose={() => setPengajuanRows(null)}
            onSaved={() => { loadPenempatan(); loadTempat(); }}
          />
        )}
        {tetapkanRows && (
          <TetapkanGuruModal
            rows={tetapkanRows}
            guruList={guruList}
            onClose={() => setTetapkanRows(null)}
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
