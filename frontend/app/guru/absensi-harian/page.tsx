"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { STATUS_CFG, PULANG_CFG, CARD_GRADIENTS, CARD_ACCENT, todayJakarta } from "@/components/absensi-harian/shared";
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

        {kelasList.length > 1 ? (
          <div className="flex flex-col gap-4 sm:flex-row">
            {(() => {
              const idx = Math.max(0, kelasList.findIndex((k) => k.id === selectedKelas?.id));
              return (
                <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-lg sm:w-2/5"
                  style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length] }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white">Kelas Wali</p>
                      <p className="mt-1 truncate text-xl font-extrabold text-white">{selectedKelas?.nama}</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white">
                      <GraduationCap size={20} style={{ color: CARD_ACCENT[idx % CARD_ACCENT.length] }} />
                    </span>
                  </div>
                  <div className="mt-6">
                    <p className="text-4xl font-black text-white">
                      {sudahAbsen}<span className="ml-1 text-base font-bold text-white">/ {total}</span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-white">siswa sudah absen · {hadirPct}%</p>
                  </div>
                </motion.button>
              );
            })()}

            <div className="grid flex-1 grid-cols-2 gap-4">
              {kelasList.filter((k) => k.id !== selectedKelas?.id).map((k) => {
                const idx = kelasList.findIndex((x) => x.id === k.id);
                return (
                  <motion.button type="button" key={k.id} onClick={() => setSelectedId(k.id)}
                    whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl p-3.5 text-left shadow-sm transition-all"
                    style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length] }}>
                    <p className="truncate text-xs font-bold text-white">{k.nama}</p>
                    <p className="mt-2 text-lg font-black text-white">
                      {k._count?.siswa ?? 0}<span className="ml-1 text-[10px] font-bold text-white">siswa</span>
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : selectedKelas ? (
          <div className="relative overflow-hidden rounded-2xl p-5 shadow-lg" style={{ background: CARD_GRADIENTS[0] }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white">
                  <GraduationCap size={22} style={{ color: CARD_ACCENT[0] }} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white">Kelas Wali</p>
                  <p className="text-lg font-extrabold leading-tight text-white">{selectedKelas.nama}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-xl bg-white px-3 py-1 text-lg font-extrabold" style={{ color: CARD_ACCENT[0] }}>{hadirPct}%</span>
                <span className="text-[10px] font-semibold text-white">{sudahAbsen}/{total} hadir</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</span>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <RangeModeToggle {...exportRange} />
              <ExportButtons kelasId={selectedId} kelasNama={selectedKelas?.nama ?? "Kelas"} range={exportRange.range} siswaList={siswaList} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          <div className="space-y-5 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => toggleFilter("HADIR")}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 text-left shadow-md transition-all sm:w-2/5"
                style={{
                  background: CARD_GRADIENTS[3],
                  outline: activeFilter === "HADIR" ? "3px solid white" : "3px solid transparent",
                }}>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                    <STATUS_CFG.HADIR.icon size={20} style={{ color: STATUS_CFG.HADIR.clr }} />
                  </span>
                  <span className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold" style={{ color: STATUS_CFG.HADIR.clr }}>
                    {hadirPct}%
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-black text-white">{rekap.HADIR}</p>
                  <p className="text-xs font-bold text-white">{STATUS_CFG.HADIR.label}</p>
                </div>
              </button>

              <div className="grid flex-1 grid-cols-2 gap-3">
                {(["PULANG", "IZIN", "SAKIT", "ALPA"] as FilterAbsensi[]).map((key) => {
                  const cfg = key === "PULANG" ? PULANG_CFG : STATUS_CFG[key as keyof typeof STATUS_CFG];
                  const Icon = cfg.icon;
                  const count = key === "PULANG" ? pulangCount : rekap[key as keyof typeof rekap];
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const active = activeFilter === key;
                  return (
                    <button key={key} type="button" onClick={() => toggleFilter(key)}
                      className="flex min-w-0 items-center gap-2 rounded-2xl p-3 text-left shadow-sm transition-all"
                      style={{
                        backgroundColor: cfg.bg,
                        outline: active ? `2px solid ${cfg.clr}` : "2px solid transparent",
                        outlineOffset: active ? "2px" : "0",
                      }}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                        <Icon size={15} style={{ color: cfg.clr }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black leading-none" style={{ color: cfg.clr }}>{count}</p>
                        <p className="truncate text-[10px] font-bold" style={{ color: cfg.clr }}>{cfg.label}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[9px] font-extrabold" style={{ color: cfg.clr }}>
                        {pct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFilter && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
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

            <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-sky-50 px-4 py-3 dark:from-emerald-950 dark:to-sky-950">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800">
                  <ClipboardCheck size={15} className="text-emerald-500" />
                </span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Status Kehadiran Hari Ini</p>
              </div>
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

          <div className="space-y-3 lg:col-span-1">
            <BelumAbsenPanel siswaList={siswaList} />
            <LaporanSeringTidakHadir kelasId={selectedId} kelasNama={selectedKelas?.nama} />
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
