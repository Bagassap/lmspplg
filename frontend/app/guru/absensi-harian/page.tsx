"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, GraduationCap, Download,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { DokumenModal } from "@/components/absensi-harian/DokumenModal";
import { ExportButtons } from "@/components/absensi-harian/ExportButtons";
import { AbsensiHarianTable } from "@/components/absensi-harian/AbsensiHarianTable";
import { paginate } from "@/components/shared/PageSizeToggle";
import { STATUS_CFG, PULANG_CFG, CARD_GRADIENTS, todayJakarta } from "@/components/absensi-harian/shared";
import type { Kelas, RekapKelas, SiswaAbsensi, FilterAbsensi } from "@/components/absensi-harian/types";

export default function GuruAbsensiHarianPage() {
  const toast = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tanggal, setTanggal] = useState(() => todayJakarta());
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

        {kelasList.length > 1 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kelasList.map((k, i) => (
              <motion.div key={k.id} onClick={() => setSelectedId(k.id)}
                whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="relative flex h-32 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all"
                style={{
                  background: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                  outline: selectedId === k.id ? "3px solid white" : "3px solid transparent",
                }}>
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Kelas</p>
                <p className="text-sm font-bold text-white">{k.nama}</p>
                <p className="text-[11px] text-white/70">{k._count?.siswa ?? 0} siswa</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</span>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span title="Unduh Rekap Absensi" className="shrink-0">
                <Download size={14} className="text-slate-300 dark:text-slate-600" />
              </span>
              <ExportButtons kelasId={selectedId} kelasNama={selectedKelas?.nama ?? "Kelas"} tanggal={tanggal} siswaList={siswaList} />
            </div>

            <span className="shrink-0 text-xs text-slate-400">{sudahAbsen}/{total} sudah absen</span>
          </div>
        </div>

        {selectedKelas && (
          <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ background: CARD_GRADIENTS[0] }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 shadow-sm">
                  <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">Kelas Wali</p>
                  <p className="text-lg font-extrabold leading-tight text-white">{selectedKelas.nama}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-xl bg-white/20 px-3 py-1 text-lg font-extrabold text-white backdrop-blur-sm">{hadirPct}%</span>
                <span className="text-[10px] text-white/60">{sudahAbsen}/{total} hadir</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {(["HADIR", "PULANG", "IZIN", "SAKIT", "ALPA"] as FilterAbsensi[]).map((key, i) => {
            const cfg = key === "PULANG" ? PULANG_CFG : STATUS_CFG[key];
            const Icon = cfg.icon;
            const count = key === "PULANG" ? pulangCount : rekap[key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const active = activeFilter === key;
            return (
              <button key={key} type="button" onClick={() => toggleFilter(key)}
                className={`flex min-w-0 items-center gap-2 rounded-2xl px-3 py-3 text-left shadow-sm transition-all sm:gap-3 sm:px-4 sm:py-3.5 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
                style={{
                  backgroundColor: cfg.bg,
                  outline: active ? `2px solid ${cfg.clr}` : "2px solid transparent",
                  outlineOffset: active ? "2px" : "0",
                }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11" style={{ backgroundColor: cfg.darkBg }}>
                  <Icon size={18} className="sm:hidden" style={{ color: cfg.clr }} />
                  <Icon size={20} className="hidden sm:block" style={{ color: cfg.clr }} />
                </div>
                <div className="flex min-w-0 flex-1 items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl font-black leading-none sm:text-2xl" style={{ color: cfg.clr }}>{count}</span>
                  <span className="truncate text-xs font-bold sm:text-sm" style={{ color: cfg.clr }}>{cfg.label}</span>
                </div>
                <div className="shrink-0 rounded-lg px-1.5 py-1 text-[9px] font-extrabold sm:px-2 sm:text-[10px]" style={{ backgroundColor: cfg.darkBg, color: cfg.clr }}>
                  {pct}%
                </div>
              </button>
            );
          })}
        </div>
        {activeFilter && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Menampilkan siswa dengan status</span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
              style={{ backgroundColor: (activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).darkBg, color: (activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).clr }}>
              {(activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).label}
            </span>
            <button onClick={() => setActiveFilter(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              (tampilkan semua)
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
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
          <DokumenModal siswa={dokumenSiswa} tanggal={tanggal} kelas={selectedKelas?.nama ?? ""} source={dokumenSource} onClose={() => setDokumenSiswa(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
