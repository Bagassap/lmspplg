"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, GraduationCap,
  Settings2, X, Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { DokumenModal } from "@/components/absensi-harian/DokumenModal";
import { ExportButtons, RangeModeToggle } from "@/components/absensi-harian/ExportButtons";
import { useExportRange } from "@/components/absensi-harian/useExportRange";
import { AbsensiHarianTable } from "@/components/absensi-harian/AbsensiHarianTable";
import { BelumAbsenPanel } from "@/components/absensi-harian/BelumAbsenPanel";
import { LaporanSeringTidakHadir } from "@/components/absensi-harian/LaporanSeringTidakHadir";
import { paginate } from "@/components/shared/PageSizeToggle";
import { STATUS_CFG, PULANG_CFG, DASHBOARD_GRADIENTS, todayJakarta, formatTgl } from "@/components/absensi-harian/shared";
import type { Kelas, RekapKelas, SiswaAbsensi, FilterAbsensi } from "@/components/absensi-harian/types";

type Guru = { id: string; user: { id: string; nama: string } };

function KelolaKelasModal({ kelasList, guruList, onClose, onSaved }: {
  kelasList: Kelas[]; guruList: Guru[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<Kelas | null>(null);
  const [nama, setNama] = useState("");
  const [waliId, setWaliId] = useState("");
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing({ id: "", nama: "" });
    setNama("");
    setWaliId("");
  }
  function startEdit(k: Kelas) {
    setEditing(k);
    setNama(k.nama);
    setWaliId(k.waliKelasGuru?.user.id ?? "");
  }

  async function save() {
    if (!nama.trim()) { toast.error("Nama kelas wajib diisi", ""); return; }
    setSaving(true);
    try {
      const isNew = !editing?.id;
      const guruEntry = guruList.find((g) => g.user.id === waliId);
      const res = await fetch(isNew ? "/api/kelas" : `/api/kelas/${editing!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, waliKelasGuruId: guruEntry?.id || undefined }),
      });
      if (res.ok) {
        toast.success(isNew ? "Kelas ditambahkan" : "Kelas diperbarui", "");
        setEditing(null);
        onSaved();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menyimpan kelas", "");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(k: Kelas) {
    const res = await fetch(`/api/kelas/${k.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Kelas dihapus", ""); onSaved(); }
    else {
      const d = await res.json().catch(() => null);
      toast.error(d?.message ?? "Gagal menghapus kelas", "");
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Settings2 size={16} className="text-violet-500" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">Kelola Kelas</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {editing ? (
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/40">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Nama Kelas</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: XII RPL 1"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Wali Kelas</label>
                <select value={waliId} onChange={(e) => setWaliId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                  <option value="">— Belum ditentukan —</option>
                  {guruList.map((g) => (
                    <option key={g.id} value={g.user.id}>{g.user.nama}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(null)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                  Batal
                </button>
                <button onClick={save} disabled={saving}
                  className="rounded-xl px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#6334F4,#4F46E5)" }}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={startCreate}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 hover:border-violet-400 hover:text-violet-500 dark:border-slate-600">
              <Plus size={14} /> Tambah Kelas
            </button>
          )}

          <div className="mt-3 space-y-2">
            {kelasList.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 dark:border-slate-700/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{k.nama}</p>
                  <p className="truncate text-[11px] text-slate-400">
                    {k.waliKelasGuru?.user.nama ?? "Belum ada wali kelas"} · {k._count?.siswa ?? 0} siswa
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => startEdit(k)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(k)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {kelasList.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">Belum ada kelas</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminAbsensiHarianPage() {
  const toast = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tanggal, setTanggal] = useState(() => todayJakarta());
  const exportRange = useExportRange(tanggal);
  const [rekapAll, setRekapAll] = useState<RekapKelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [dokumenSiswa, setDokumenSiswa] = useState<SiswaAbsensi | null>(null);
  const [dokumenSource, setDokumenSource] = useState<"hadir" | "pulang">("hadir");
  const [showKelola, setShowKelola] = useState(false);
  const [kelasPage, setKelasPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterAbsensi | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState<number>(10);
  const KELAS_PER_PAGE = 5;

  const loadKelasList = useCallback(async () => {
    const res = await fetch("/api/kelas");
    const list = await res.json().catch(() => []);
    setKelasList(Array.isArray(list) ? list : []);
  }, []);

  const loadGuruList = useCallback(async () => {
    const res = await fetch("/api/kelas/guru-list");
    const list = await res.json().catch(() => []);
    setGuruList(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => { loadKelasList(); loadGuruList(); }, [loadKelasList, loadGuruList]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(kelasList.length / KELAS_PER_PAGE) - 1);
    setKelasPage((p) => Math.min(p, maxPage));
  }, [kelasList.length]);

  const loadRekap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi-harian?tanggal=${tanggal}`);
      const data = await res.json().catch(() => []);
      const list: RekapKelas[] = Array.isArray(data) ? data : [];
      setRekapAll(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].kelasId);
    } catch {
      toast.error("Gagal memuat data absensi", "");
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  useEffect(() => { setTablePage(0); }, [selectedId, tanggal, activeFilter, tablePageSize]);

  const selected = rekapAll.find((r) => r.kelasId === selectedId) ?? null;
  const siswaList = selected?.siswa ?? [];
  const rekap = selected?.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
  const pulangCount = selected?.pulangCount ?? 0;
  const total = siswaList.length;

  function kelasStat(k: Kelas) {
    const idx = kelasList.findIndex((x) => x.id === k.id);
    const r = rekapAll.find((x) => x.kelasId === k.id);
    const hd = r?.rekap.HADIR ?? 0;
    const tt = r?.siswa.length ?? k._count?.siswa ?? 0;
    return { idx: idx < 0 ? 0 : idx, hd, tt, pct: tt > 0 ? Math.round((hd / tt) * 100) : 0 };
  }
  const kelasPageSlice = kelasList.slice(kelasPage * KELAS_PER_PAGE, kelasPage * KELAS_PER_PAGE + KELAS_PER_PAGE);

  const filteredSiswa = !activeFilter
    ? siswaList
    : activeFilter === "PULANG"
      ? siswaList.filter((s) => !!s.waktuPulang)
      : siswaList.filter((s) => s.status === activeFilter);
  const { pageItems: pagedSiswa, pageCount: tablePageCount, start: tableStart, end: tableEnd } = paginate(filteredSiswa, tablePage, tablePageSize);

  function toggleFilter(key: FilterAbsensi) {
    setActiveFilter((prev) => (prev === key ? null : key));
  }

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
                <ClipboardCheck size={26} className="text-white" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Presensi Wajib Harian</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Admin</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi Harian</h1>
                <p className="mt-0.5 text-sm text-white/70">Pantau kehadiran seluruh siswa setiap kelas</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setShowKelola(true)}
                className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25">
                <Settings2 size={14} /> Kelola Kelas
              </button>
              <LiveClock />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="lg:w-64 lg:shrink-0">
              <p className="text-xl font-extrabold leading-snug text-slate-800 dark:text-white">
                Siswa yang perlu perhatian.
              </p>
              <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                Klik salah satu kartu untuk melihat daftar siswa dan menyalinnya untuk pesan pengingat.
              </p>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
              <BelumAbsenPanel siswaList={siswaList} />
              <LaporanSeringTidakHadir kelasId={selectedId} kelasNama={selected?.kelas.nama} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-slate-800 dark:text-white">Kelas</p>
            {kelasList.length > KELAS_PER_PAGE && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKelasPage((p) => Math.max(0, p - 1))}
                  disabled={kelasPage === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-slate-400">
                  {kelasPage + 1} / {Math.ceil(kelasList.length / KELAS_PER_PAGE)}
                </span>
                <button
                  onClick={() =>
                    setKelasPage((p) =>
                      (p + 1) * KELAS_PER_PAGE < kelasList.length ? p + 1 : p,
                    )
                  }
                  disabled={(kelasPage + 1) * KELAS_PER_PAGE >= kelasList.length}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {kelasList.length === 0 ? (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
              {kelasPageSlice.map((k) => {
                const s = kelasStat(k);
                const isSelected = k.id === selectedId;
                return (
                  <button type="button" key={k.id} onClick={() => setSelectedId(k.id)}
                    className="relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl p-5 text-left text-white transition-all"
                    style={{
                      background: DASHBOARD_GRADIENTS[s.idx % DASHBOARD_GRADIENTS.length],
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      outline: isSelected ? "3px solid white" : "3px solid transparent",
                      outlineOffset: isSelected ? "2px" : "0",
                    }}>
                    <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-4 right-12 h-20 w-20 rounded-full bg-white/8" />

                    <div className="relative flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">Kelas</p>
                        <p className="mt-0.5 truncate text-sm font-bold">{k.nama}</p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <GraduationCap size={17} />
                      </div>
                    </div>

                    <div className="relative">
                      <p className="text-3xl font-bold tabular-nums">{s.hd} hadir</p>
                    </div>

                    <div className="relative flex items-end justify-between">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">Total Siswa</p>
                        <p className="text-[11px] font-semibold">{s.tt} siswa</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">Kehadiran</p>
                        <p className="text-[11px] font-semibold">{s.pct}%</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="px-5 pt-5">
            <p className="text-base font-extrabold text-slate-800 dark:text-white">Status Kehadiran Hari Ini</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatTgl(tanggal)}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex shrink-0 items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RangeModeToggle {...exportRange} />
              <ExportButtons kelasId={selectedId} kelasNama={selected?.kelas.nama ?? "Kelas"} range={exportRange.range} siswaList={siswaList} />
            </div>
          </div>

          {activeFilter && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:border-slate-700/40 dark:text-slate-400">
              <span>Menampilkan siswa dengan status</span>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                style={{ backgroundColor: (activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).bg, color: (activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).clr }}>
                {(activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).label}
              </span>
              <button onClick={() => setActiveFilter(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                (tampilkan semua)
              </button>
            </div>
          )}

          <AbsensiHarianTable
            loading={loading}
            hasSiswa={siswaList.length > 0}
            filteredSiswa={filteredSiswa}
            pagedSiswa={pagedSiswa}
            tableStart={tableStart}
            tableEnd={tableEnd}
            activeFilter={activeFilter}
            tablePage={tablePage}
            setTablePage={setTablePage}
            tablePageCount={tablePageCount}
            tablePageSize={tablePageSize}
            setTablePageSize={setTablePageSize}
            onOpenDokumen={(s, source) => { setDokumenSiswa(s); setDokumenSource(source); }}
          />
        </div>
      </div>

      <AnimatePresence>
        {dokumenSiswa && (
          <DokumenModal siswa={dokumenSiswa} tanggal={tanggal} kelas={selected?.kelas.nama ?? ""} source={dokumenSource} onClose={() => setDokumenSiswa(null)} />
        )}
        {showKelola && (
          <KelolaKelasModal kelasList={kelasList} guruList={guruList} onClose={() => setShowKelola(false)} onSaved={() => { loadKelasList(); loadRekap(); }} />
        )}
      </AnimatePresence>
    </>
  );
}
