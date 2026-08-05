"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, GraduationCap, BookOpen,
  ArrowRight, ChevronLeft, ChevronRight,
  Users, TrendingUp, LogOut, FileText, Download,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { DokumenModal } from "@/components/absensi-harian/DokumenModal";
import { ExportButtons } from "@/components/absensi-harian/ExportButtons";
import { useExportRange } from "@/components/absensi-harian/useExportRange";
import { AbsensiHarianTable } from "@/components/absensi-harian/AbsensiHarianTable";
import { BelumAbsenPanel } from "@/components/absensi-harian/BelumAbsenPanel";
import { LaporanSeringTidakHadir } from "@/components/absensi-harian/LaporanSeringTidakHadir";
import { paginate } from "@/components/shared/PageSizeToggle";
import { STATUS_CFG, PULANG_CFG, WALLET_GRADIENTS, MONTH_NAMES, RANGE_MODE_CARDS, todayJakarta, formatTgl } from "@/components/absensi-harian/shared";
import type { Kelas, RekapKelas, SiswaAbsensi, FilterAbsensi } from "@/components/absensi-harian/types";

// Guru is usually wali kelas of a single class, so the responsive Kelas grid
// (grid-cols-2 for exactly 1 card) leaves an empty second slot — this donut
// fills it with the selected kelas's own status breakdown instead of dead
// space, reusing the same rekap/hadirPct/total already fetched for the page.
function DonutRingkasan({ rekap, hadirPct, total }: { rekap: RekapKelas["rekap"]; hadirPct: number; total: number }) {
  const segments = [
    { key: "HADIR", value: rekap.HADIR, color: STATUS_CFG.HADIR.clr, label: STATUS_CFG.HADIR.label },
    { key: "IZIN", value: rekap.IZIN, color: STATUS_CFG.IZIN.clr, label: STATUS_CFG.IZIN.label },
    { key: "SAKIT", value: rekap.SAKIT, color: STATUS_CFG.SAKIT.clr, label: STATUS_CFG.SAKIT.label },
    { key: "ALPA", value: rekap.ALPA, color: STATUS_CFG.ALPA.clr, label: STATUS_CFG.ALPA.label },
  ];
  const r = 40;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Ringkasan Kehadiran</p>
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle cx="50" cy="50" r={r} stroke="#F1F5F9" strokeWidth="12" fill="none" />
          {total > 0 && segments.filter((s) => s.value > 0).map((s) => {
            const pct = s.value / total;
            const dash = pct * circumference;
            const offset = circumference * (1 - cumulative);
            cumulative += pct;
            return (
              <circle key={s.key} cx="50" cy="50" r={r} stroke={s.color} strokeWidth="12" fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} strokeLinecap="round" />
            );
          })}
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-extrabold text-slate-800 dark:text-white">{hadirPct}%</span>
          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">Hadir</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-left">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{s.label} {s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [kelasPage, setKelasPage] = useState(0);
  const KELAS_PER_PAGE = 4;

  useEffect(() => {
    fetch("/api/kelas/saya")
      .then((r) => r.json())
      .then((list: Kelas[]) => {
        setKelasList(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(kelasList.length / KELAS_PER_PAGE) - 1);
    setKelasPage((p) => Math.min(p, maxPage));
  }, [kelasList.length]);

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
  const kelasPageSlice = kelasList.slice(kelasPage * KELAS_PER_PAGE, kelasPage * KELAS_PER_PAGE + KELAS_PER_PAGE);
  const kelasPageCount = Math.ceil(kelasList.length / KELAS_PER_PAGE);

  const filteredSiswa = !activeFilter
    ? siswaList
    : activeFilter === "PULANG"
      ? siswaList.filter((s) => !!s.waktuPulang)
      : siswaList.filter((s) => s.status === activeFilter);
  const { pageItems: pagedSiswa, pageCount: tablePageCount, start: tableStart, end: tableEnd } = paginate(filteredSiswa, tablePage, tablePageSize);

  function toggleFilter(key: FilterAbsensi) {
    setActiveFilter((prev) => (prev === key ? null : key));
  }

  const filterOptions: { key: FilterAbsensi | null; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { key: null, label: "Semua", icon: Users, count: total, color: "#334155" },
    { key: "HADIR", label: "Hadir", icon: STATUS_CFG.HADIR.icon, count: rekap.HADIR, color: STATUS_CFG.HADIR.clr },
    { key: "IZIN", label: "Izin", icon: STATUS_CFG.IZIN.icon, count: rekap.IZIN, color: STATUS_CFG.IZIN.clr },
    { key: "SAKIT", label: "Sakit", icon: STATUS_CFG.SAKIT.icon, count: rekap.SAKIT, color: STATUS_CFG.SAKIT.clr },
    { key: "ALPA", label: "Alpa", icon: STATUS_CFG.ALPA.icon, count: rekap.ALPA, color: STATUS_CFG.ALPA.clr },
    { key: "PULANG", label: "Pulang", icon: PULANG_CFG.icon, count: pulangCount, color: PULANG_CFG.clr },
  ];

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

        <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kelas</p>
                <div className="flex items-center gap-2">
                  {kelasPageCount > 1 && (
                    <span className="text-xs font-semibold text-slate-400">{kelasPage + 1} / {kelasPageCount}</span>
                  )}
                  <button type="button" onClick={() => setKelasPage((p) => Math.max(0, p - 1))} disabled={kelasPage === 0}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                    <ChevronLeft size={13} />
                  </button>
                  <button type="button" onClick={() => setKelasPage((p) => (p + 1 < kelasPageCount ? p + 1 : p))} disabled={kelasPage + 1 >= kelasPageCount}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              <div className={`grid gap-4 ${
                kelasPageSlice.length === 1 ? "grid-cols-1 sm:grid-cols-2"
                  : kelasPageSlice.length === 2 ? "grid-cols-2"
                  : kelasPageSlice.length === 3 ? "grid-cols-2 sm:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-4"
              }`}>
                {kelasPageSlice.map((k) => {
                  const idx = kelasList.findIndex((x) => x.id === k.id);
                  const isSelected = k.id === selectedId;
                  const gradient = WALLET_GRADIENTS[(idx < 0 ? 0 : idx) % WALLET_GRADIENTS.length];
                  return (
                    <button type="button" key={k.id} onClick={() => setSelectedId(k.id)}
                      className={`relative flex h-72 flex-col overflow-hidden rounded-3xl p-4 text-left text-white transition-all ${isSelected ? "justify-between" : "justify-start gap-3"}`}
                      style={{
                        background: gradient,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                        outline: isSelected ? "3px solid white" : "3px solid transparent",
                        outlineOffset: isSelected ? "2px" : "0",
                      }}>
                      <div className="relative flex items-start justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
                          <BookOpen size={16} />
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          Kelas Wali
                        </span>
                      </div>

                      <div className="relative">
                        <p className="truncate text-base font-bold">{k.nama}</p>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-white/70">{k._count?.siswa ?? 0} siswa terdaftar</p>
                      </div>

                      {isSelected ? (
                        <>
                          <div className="relative">
                            <p className="text-2xl font-extrabold tabular-nums">{sudahAbsen}/{total}</p>
                            <p className="text-[11px] font-semibold text-white/80">Siswa Hadir Hari Ini</p>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-white/25">
                              <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${hadirPct}%` }} />
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-white/70">{hadirPct}% kehadiran</p>
                          </div>

                          <div className="relative flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">Izin {rekap.IZIN}</span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">Sakit {rekap.SAKIT}</span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">Alpa {rekap.ALPA}</span>
                          </div>
                        </>
                      ) : (
                        <div className="relative">
                          <p className="text-[11px] font-semibold text-white/80">Klik untuk lihat detail kehadiran hari ini</p>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Guru is usually wali kelas of just one class, leaving the
                    second grid-cols-2 slot empty — fill it with a donut
                    breakdown of the selected kelas's status today instead of
                    leaving dead space. */}
                {kelasPageSlice.length === 1 && (
                  <DonutRingkasan rekap={rekap} hadirPct={hadirPct} total={total} />
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Keterangan Absensi</p>
                <a href="#status-kehadiran-hari-ini"
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  More <ArrowRight size={12} />
                </a>
              </div>
              <BelumAbsenPanel siswaList={siswaList} />
            </div>
          </div>
        </div>

        <div id="status-kehadiran-hari-ini" className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Status Kehadiran Hari Ini <span className="font-medium text-slate-400">({total})</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatTgl(tanggal)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50 sm:w-full sm:max-w-xs">
                <CalendarDays size={14} className="shrink-0 text-slate-400" />
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none dark:text-slate-200" />
              </div>
            </div>

            <div className="mt-6 mb-2 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-6 pb-2 dark:border-slate-700">
              <span className="mr-1 text-xs font-semibold text-slate-400">Status:</span>
              {filterOptions.map((opt) => {
                const active = activeFilter === opt.key;
                return (
                  <button key={String(opt.key)} type="button"
                    onClick={() => (opt.key === null ? setActiveFilter(null) : toggleFilter(opt.key))}
                    className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={active ? { backgroundColor: opt.color, color: "#fff" } : {}}>
                    <span className={`flex items-center gap-2 ${active ? "text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"}`}>
                      <opt.icon size={16} />
                      {opt.label}
                      <span className={`rounded-md px-2 py-0.5 text-xs ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                        {opt.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[11px] dark:border-slate-700">
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <Users size={12} className="text-violet-500" />
                Total {total} siswa
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <TrendingUp size={12} className="text-violet-500" />
                Kehadiran {hadirPct}%
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <LogOut size={12} className="text-violet-500" />
                Sudah pulang {pulangCount} siswa
              </span>
            </div>

            <div className="mt-4 -mx-5 -mb-5 overflow-hidden rounded-b-3xl border-t border-slate-100 dark:border-slate-700">
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

          <div className="flex h-full flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#6334F4,#4F46E5)" }}>
                  <FileText size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Unduh Laporan</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Ekspor rekap absensi ke PDF/Excel</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {RANGE_MODE_CARDS.map((opt) => {
                  const active = exportRange.rangeMode === opt.key;
                  return (
                    <button key={opt.key} type="button" onClick={() => exportRange.setRangeMode(opt.key)}
                      className="flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center text-white shadow-sm transition-all"
                      style={{ background: opt.gradient, opacity: active ? 1 : 0.55, outline: active ? "2px solid white" : "2px solid transparent", outlineOffset: active ? "2px" : "0" }}>
                      <opt.icon size={16} />
                      <span className="text-[11px] font-bold">{opt.label}</span>
                      <span className="text-[9px] leading-tight text-white/75">{opt.caption}</span>
                    </button>
                  );
                })}
              </div>

              {exportRange.rangeMode === "mingguan" && (
                <input type="date" value={exportRange.weekAnchor} onChange={(e) => exportRange.setWeekAnchor(e.target.value)}
                  title={`Minggu: ${formatTgl(exportRange.weekRange.start)} – ${formatTgl(exportRange.weekRange.end)}`}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200" />
              )}

              {exportRange.rangeMode === "bulanan" && (
                <div className="mt-2 flex items-center gap-1.5">
                  <select value={exportRange.bulan} onChange={(e) => exportRange.setBulan(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={exportRange.tahun} onChange={(e) => exportRange.setTahun(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              <div className="mt-3">
                <ExportButtons kelasId={selectedId} kelasNama={selectedKelas?.nama ?? "Kelas"} range={exportRange.range} siswaList={siswaList} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                <Download size={11} className="shrink-0 text-violet-500" />
                Pilih rentang waktu, lalu klik salah satu tombol ekspor
              </p>
            </div>

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
