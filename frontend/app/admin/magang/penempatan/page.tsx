"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Briefcase, Building2, Plus, Trash2, Users } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor, toTitleCase } from "@/components/data-siswa/shared";
import type { SiswaCardData } from "@/components/data-siswa/shared";
import { KelolaTempatModal } from "@/components/magang/KelolaTempatModal";
import { TempatkanSiswaModal } from "@/components/magang/TempatkanSiswaModal";
import { STATUS_PENEMPATAN_CFG } from "@/components/magang/types";
import type { TempatMagang, PenempatanMagang, StatusPenempatan } from "@/components/magang/types";

type GuruOption = { id: string; user: { id: string; nama: string } };

export default function AdminMagangPenempatanPage() {
  const toast = useToast();
  const [tempatList, setTempatList] = useState<TempatMagang[]>([]);
  const [penempatanList, setPenempatanList] = useState<PenempatanMagang[]>([]);
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [guruList, setGuruList] = useState<GuruOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKelolaTempat, setShowKelolaTempat] = useState(false);
  const [showTempatkan, setShowTempatkan] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  return (
    <div className="space-y-5 p-1">
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0033FF" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
              <Briefcase size={22} className="text-white sm:hidden" />
              <Briefcase size={26} className="hidden text-white sm:block" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">PKL</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Admin</span>
              </div>
              <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Penempatan PKL</h1>
              <p className="mt-0.5 text-sm text-white/70">Kelola tempat magang & tempatkan siswa beserta guru pembimbing</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowKelolaTempat(true)}
              className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25">
              <Building2 size={14} /> Kelola Tempat
            </button>
            <button onClick={() => setShowTempatkan(true)}
              className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold shadow-lg" style={{ color: "#0033FF" }}>
              <Plus size={14} /> Tempatkan Siswa
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{loading ? "—" : tempatList.length}</p>
          <p className="text-[11px] font-semibold text-slate-400">Tempat Magang</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{loading ? "—" : jumlahAktif}</p>
          <p className="text-[11px] font-semibold text-slate-400">Siswa PKL Aktif</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
            {loading ? "—" : tempatList.reduce((sum, t) => sum + t.kuota, 0)}
          </p>
          <p className="text-[11px] font-semibold text-slate-400">Total Kuota</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{loading ? "—" : penempatanList.length}</p>
          <p className="text-[11px] font-semibold text-slate-400">Total Riwayat Penempatan</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <p className="text-sm font-bold text-slate-800 dark:text-white">Daftar Penempatan Siswa</p>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        ) : penempatanList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <Users size={24} className="text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Belum ada siswa yang ditempatkan PKL</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 overflow-x-auto dark:divide-slate-700/30">
            {penempatanList.map((p) => {
              const nama = toTitleCase(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
              const cfg = STATUS_PENEMPATAN_CFG[p.status];
              const busy = busyId === p.id;
              return (
                <div key={p.id} className="flex min-w-175 items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  <Avatar src={p.siswa.user?.fotoProfil} nama={nama} sizePx={34} fallbackBg={avatarColorFor(nama)} textClassName="text-[10px] font-extrabold" />
                  <div className="min-w-0 flex-[1.4]">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{nama}</p>
                    <p className="truncate text-[11px] text-slate-400">{p.siswa.nis} · {p.siswa.kelas.nama}</p>
                  </div>
                  <div className="min-w-0 flex-[1.6]">
                    <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{p.tempatMagang.namaTempat}</p>
                    <p className="truncate text-[11px] text-slate-400">Pembimbing: {toTitleCase(p.guruPembimbing.user.nama)}</p>
                  </div>
                  <div className="w-40 shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(p.tanggalMulai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    {p.tanggalSelesai ? ` – ${new Date(p.tanggalSelesai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                  </div>
                  <select value={p.status} disabled={busy} onChange={(e) => ubahStatus(p, e.target.value as StatusPenempatan)}
                    className="w-28 shrink-0 rounded-lg border-0 px-2 py-1 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-violet-400"
                    style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
                    <option value="AKTIF">Aktif</option>
                    <option value="SELESAI">Selesai</option>
                    <option value="BATAL">Batal</option>
                  </select>
                  <button onClick={() => hapus(p)} disabled={busy}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40 dark:bg-red-900/20">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
      </AnimatePresence>
    </div>
  );
}
