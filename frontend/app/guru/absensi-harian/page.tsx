"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, GraduationCap,
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

export default function GuruAbsensiHarianPage() {
  const toast = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tanggal, setTanggal] = useState(() => todayJakarta());
  const exportRange = useExportRange(tanggal);
  const [data, setData] = useState<RekapKelas | null>(null);
  const [loading, setLoading] = useState(false);
  const [dokumenSiswa, setDokumenSiswa] = useState<SiswaAbsensi | null>(null);
  const [dokumenSource, setDokumenSource] = useState<"hadir" | "pulang">("hadir");
  const [activeFilter, setActiveFilter] = useState<FilterAbsensi | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState<number>(10);

  useEffect(() => {
    fetch("/api/kelas/saya")
      .then((r) => r.json())
      .then((list: Kelas[]) => {
        setKelasList(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadRekap = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi-harian?kelasId=${selectedId}&tanggal=${tanggal}`);
      const list = await res.json().catch(() => []);
      const d: RekapKelas | undefined = Array.isArray(list) ? list[0] : undefined;
      setData(d ?? null);
    } catch {
      toast.error("Gagal memuat data absensi", "");
    } finally {
      setLoading(false);
    }
  }, [selectedId, tanggal]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  useEffect(() => { setTablePage(0); }, [selectedId, tanggal, activeFilter, tablePageSize]);

  const selectedKelas = kelasList.find((k) => k.id === selectedId);
  const siswaList = data?.siswa ?? [];
  const rekap = data?.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
  const pulangCount = data?.pulangCount ?? 0;
  const total = siswaList.length;
  const sudahAbsen = siswaList.filter((s) => s.status !== null).length;
  const hadirPct = total > 0 ? Math.round((rekap.HADIR / total) * 100) : 0;

  const filteredSiswa = !activeFilter
    ? siswaList
    : activeFilter === "PULANG"
      ? siswaList.filter((s) => !!s.waktuPulang)
      : siswaList.filter((s) => s.status === activeFilter);
  const { pageItems: pagedSiswa, pageCount: tablePageCount, start: tableStart, end: tableEnd } = paginate(filteredSiswa, tablePage, tablePageSize);

  function toggleFilter(key: FilterAbsensi) {
    setActiveFilter((prev) => (prev === key ? null : key));
  }

  if (kelasList.length === 0) {
    return (
      <div className="space-y-5 p-1">
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ClipboardCheck size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi Harian</h1>
              <p className="mt-0.5 text-sm text-white/70">Presensi kehadiran harian siswa</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
            <GraduationCap size={24} className="text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Anda belum menjadi wali kelas manapun</p>
          <p className="max-w-sm text-xs text-slate-400">Hubungi admin untuk ditetapkan sebagai wali kelas agar dapat mengelola absensi harian.</p>
        </div>
      </div>
    );
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
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Wali Kelas</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi Harian</h1>
                <p className="mt-0.5 text-sm text-white/70">Catat kehadiran siswa di kelas yang Anda wali-i</p>
              </div>
            </div>
            <LiveClock />
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
              <LaporanSeringTidakHadir kelasId={selectedId} kelasNama={selectedKelas?.nama} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-extrabold text-slate-800 dark:text-white">Kelas</p>
          <div className={`grid grid-cols-2 gap-3.5 ${kelasList.length > 2 ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-2"}`}>
            {kelasList.map((k, i) => {
              const isSelected = k.id === selectedId;
              return (
                <button type="button" key={k.id} onClick={() => setSelectedId(k.id)}
                  className="relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl p-5 text-left text-white transition-all"
                  style={{
                    background: DASHBOARD_GRADIENTS[i % DASHBOARD_GRADIENTS.length],
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    outline: isSelected ? "3px solid white" : "3px solid transparent",
                    outlineOffset: isSelected ? "2px" : "0",
                  }}>
                  <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                  <div className="pointer-events-none absolute -bottom-4 right-12 h-20 w-20 rounded-full bg-white/8" />

                  <div className="relative flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">Kelas Wali</p>
                      <p className="mt-0.5 truncate text-sm font-bold">{k.nama}</p>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <GraduationCap size={17} />
                    </div>
                  </div>

                  <div className="relative">
                    <p className="text-3xl font-bold tabular-nums">
                      {isSelected ? `${sudahAbsen} hadir` : `${k._count?.siswa ?? 0} siswa`}
                    </p>
                  </div>

                  <div className="relative flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">Total Siswa</p>
                      <p className="text-[11px] font-semibold">{isSelected ? total : (k._count?.siswa ?? 0)} siswa</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">Kehadiran</p>
                      <p className="text-[11px] font-semibold">{isSelected ? `${hadirPct}%` : "—"}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <p className="text-sm font-extrabold text-slate-800 dark:text-white">Rekap Kehadiran</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Ringkasan hari ini</p>

            <div className="mt-4 space-y-3">
              {(() => {
                const activeHadir = activeFilter === "HADIR";
                const pctHadir = total > 0 ? Math.round((rekap.HADIR / total) * 100) : 0;
                return (
                  <button type="button" onClick={() => toggleFilter("HADIR")}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left transition-all"
                    style={{ backgroundColor: STATUS_CFG.HADIR.bg, outline: activeHadir ? `2px solid ${STATUS_CFG.HADIR.clr}` : "2px solid transparent" }}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: STATUS_CFG.HADIR.clr }}>
                        <STATUS_CFG.HADIR.icon size={20} className="text-white" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-2xl font-black leading-none" style={{ color: STATUS_CFG.HADIR.clr }}>{rekap.HADIR}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">Siswa {STATUS_CFG.HADIR.label}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold dark:bg-slate-900" style={{ color: STATUS_CFG.HADIR.clr }}>
                      {pctHadir}%
                    </span>
                  </button>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                {(["PULANG", "IZIN", "SAKIT", "ALPA"] as FilterAbsensi[]).map((key) => {
                  const cfg = key === "PULANG" ? PULANG_CFG : STATUS_CFG[key as keyof typeof STATUS_CFG];
                  const Icon = cfg.icon;
                  const count = key === "PULANG" ? pulangCount : rekap[key as keyof typeof rekap];
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const active = activeFilter === key;
                  return (
                    <button key={key} type="button" onClick={() => toggleFilter(key)}
                      className="flex flex-col items-start gap-2 rounded-2xl p-3 text-left transition-all"
                      style={{ backgroundColor: cfg.bg, outline: active ? `2px solid ${cfg.clr}` : "2px solid transparent" }}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.clr }}>
                        <Icon size={14} className="text-white" />
                      </span>
                      <div>
                        <p className="text-lg font-black leading-none" style={{ color: cfg.clr }}>{count}</p>
                        <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">{cfg.label} &middot; {pct}%</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
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
                  <ExportButtons kelasId={selectedId} kelasNama={selectedKelas?.nama ?? "Kelas"} range={exportRange.range} siswaList={siswaList} />
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
        </div>
      </div>

      <AnimatePresence>
        {dokumenSiswa && (
          <DokumenModal siswa={dokumenSiswa} tanggal={tanggal} kelas={selectedKelas?.nama ?? ""} source={dokumenSource} onClose={() => setDokumenSiswa(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
