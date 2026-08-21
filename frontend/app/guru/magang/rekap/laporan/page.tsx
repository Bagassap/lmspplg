"use client";

import { useState, useEffect, useCallback } from "react";
import { FileBarChart, Briefcase, FileText } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { RangeModeToggle } from "@/components/absensi-harian/ExportButtons";
import { useExportRange } from "@/components/absensi-harian/useExportRange";
import { WALLET_GRADIENTS, WALLET_ON_TEXT, todayJakarta, formatTgl } from "@/components/absensi-harian/shared";
import { ExportButtons } from "@/components/absensi-magang/ExportButtons";
import { RekapMagangHarianTable, RekapMagangRangeTable } from "@/components/absensi-magang/RekapMagangTable";
import { BackToHubLink } from "@/components/magang/BackToHubLink";
import type { SiswaAbsensi, RekapTempat, RekapRangeData, TempatMagang } from "@/components/absensi-magang/types";

export default function GuruMagangRekapPage() {
  const toast = useToast();
  const [tempatList, setTempatList] = useState<TempatMagang[]>([]);
  const [rosterByTempat, setRosterByTempat] = useState<Record<string, SiswaAbsensi[]>>({});
  const [selectedId, setSelectedId] = useState("");
  const [loadingTempat, setLoadingTempat] = useState(true);
  const tanggal = todayJakarta();
  const exportRange = useExportRange(tanggal);

  const [rekapHarian, setRekapHarian] = useState<RekapTempat | null>(null);
  const [rekapRange, setRekapRange] = useState<RekapRangeData | null>(null);
  const [loading, setLoading] = useState(false);

  // Guru pembimbing tidak punya endpoint "tempat saya" terpisah — daftar
  // tempat & roster siswa diturunkan dari rekap hari ini (sudah di-scope
  // server-side ke bimbingan sendiri), sama seperti halaman Absensi PKL guru.
  useEffect(() => {
    setLoadingTempat(true);
    fetch(`/api/magang/absensi?tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d: RekapTempat[]) => {
        const list = Array.isArray(d) ? d : [];
        setTempatList(list.map((r) => r.tempatMagang));
        setRosterByTempat(Object.fromEntries(list.map((r) => [r.tempatMagangId, r.siswa])));
        if (list.length > 0) setSelectedId((prev) => prev || list[0].tempatMagangId);
      })
      .catch(() => toast.error("Gagal memuat daftar tempat PKL bimbingan", ""))
      .finally(() => setLoadingTempat(false));
  }, [tanggal]);

  const loadRekap = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ tempatMagangId: selectedId, mode: exportRange.range.mode });
      if (exportRange.range.mode === "harian") qs.set("tanggal", exportRange.range.tanggal);
      else if (exportRange.range.mode === "mingguan") {
        qs.set("tanggalMulai", exportRange.range.tanggalMulai);
        qs.set("tanggalSelesai", exportRange.range.tanggalSelesai);
      } else {
        qs.set("bulan", String(exportRange.range.bulan));
        qs.set("tahun", String(exportRange.range.tahun));
      }
      const res = await fetch(`/api/magang/absensi/rekap?${qs}`);
      const json = await res.json().catch(() => null);
      if (exportRange.range.mode === "harian") { setRekapHarian(json); setRekapRange(null); }
      else { setRekapRange(json); setRekapHarian(null); }
    } catch {
      toast.error("Gagal memuat rekap PKL", "");
    } finally {
      setLoading(false);
    }
  }, [selectedId, exportRange.range]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  const selectedTempat = tempatList.find((t) => t.id === selectedId);
  const roster = rosterByTempat[selectedId] ?? [];

  if (!loadingTempat && tempatList.length === 0) {
    return (
      <div className="space-y-5 p-1">
        <BackToHubLink href="/guru/magang/rekap" />
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
              <FileBarChart size={22} className="text-white sm:hidden" />
              <FileBarChart size={26} className="hidden text-white sm:block" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Rekap &amp; Laporan PKL</h1>
              <p className="mt-0.5 text-sm text-white/70">Rekap kehadiran siswa PKL bimbingan Anda</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
            <Briefcase size={24} className="text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Anda belum menjadi guru pembimbing PKL siswa manapun</p>
          <p className="max-w-sm text-xs text-slate-400">Hubungi admin untuk ditetapkan sebagai pembimbing saat siswa ditempatkan PKL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">
      <BackToHubLink href="/guru/magang/rekap" />
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <FileBarChart size={22} className="text-white sm:hidden" />
            <FileBarChart size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Laporan PKL</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Guru Pembimbing</span>
            </div>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Rekap &amp; Laporan PKL</h1>
            <p className="mt-0.5 text-sm text-white/70">Lihat rekap kehadiran siswa bimbingan Anda dan unduh laporannya</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tempat PKL</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tempatList.map((t, idx) => {
            const isSelected = t.id === selectedId;
            const bg = WALLET_GRADIENTS[idx % WALLET_GRADIENTS.length];
            const onText = WALLET_ON_TEXT[idx % WALLET_ON_TEXT.length];
            return (
              <button type="button" key={t.id} onClick={() => setSelectedId(t.id)}
                className="relative flex items-center gap-2.5 overflow-hidden rounded-2xl p-3.5 text-left transition-all"
                style={{
                  background: bg, color: onText, boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  outline: isSelected ? `3px solid ${onText}` : "3px solid transparent", outlineOffset: isSelected ? "2px" : "0",
                }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${onText}40` }}>
                  <Briefcase size={14} />
                </span>
                <p className="truncate text-sm font-bold">{t.namaTempat}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Rekap {selectedTempat?.namaTempat ?? ""}
              </p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {exportRange.range.mode === "harian" ? formatTgl(exportRange.range.tanggal)
                  : exportRange.range.mode === "mingguan" ? `${formatTgl(exportRange.weekRange.start)} – ${formatTgl(exportRange.weekRange.end)}`
                  : `Bulan ${exportRange.bulan}/${exportRange.tahun}`}
              </p>
            </div>
            <RangeModeToggle {...exportRange} />
          </div>

          <div className="mt-4">
            {exportRange.range.mode === "harian" ? (
              <RekapMagangHarianTable loading={loading} siswa={rekapHarian?.siswa ?? []} />
            ) : (
              <RekapMagangRangeTable loading={loading} siswa={rekapRange?.siswa ?? []} />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#0082FB" }}>
              <FileText size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Unduh Laporan</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Ekspor rekap ke PDF/Excel</p>
            </div>
          </div>
          <ExportButtons tempatMagangId={selectedId} tempatNama={selectedTempat?.namaTempat ?? "Tempat"} range={exportRange.range} siswaList={roster} />
        </div>
      </div>
    </div>
  );
}
