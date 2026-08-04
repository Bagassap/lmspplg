"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, GraduationCap, BookOpen,
  ArrowRight, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { DokumenModal } from "@/components/absensi-harian/DokumenModal";
import { ExportButtons, RangeModeToggle } from "@/components/absensi-harian/ExportButtons";
import { useExportRange } from "@/components/absensi-harian/useExportRange";
import { AbsensiHarianTable } from "@/components/absensi-harian/AbsensiHarianTable";
import { BelumAbsenPanel } from "@/components/absensi-harian/BelumAbsenPanel";
import { paginate } from "@/components/shared/PageSizeToggle";
import { STATUS_CFG, PULANG_CFG, WALLET_GRADIENTS, WALLET_WAVE_PATTERN, todayJakarta, formatTgl } from "@/components/absensi-harian/shared";
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
                      <div className="pointer-events-none absolute inset-0"
                        style={{ backgroundImage: WALLET_WAVE_PATTERN, backgroundSize: "140px 70px", backgroundRepeat: "repeat", opacity: 0.5 }} />

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
              <div className="flex-1">
                <BelumAbsenPanel siswaList={siswaList} />
              </div>
            </div>
          </div>
        </div>

        <div id="status-kehadiran-hari-ini" className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-slate-800 dark:text-white">Status Kehadiran Hari Ini</p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatTgl(tanggal)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
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

      <AnimatePresence>
        {dokumenSiswa && (
          <DokumenModal siswa={dokumenSiswa} tanggal={tanggal} kelas={selectedKelas?.nama ?? ""} source={dokumenSource} onClose={() => setDokumenSiswa(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
