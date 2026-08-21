"use client";

import { useState, useEffect, useCallback } from "react";
import { FileBarChart, Briefcase, MapPin, FileText, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { RangeModeToggle } from "@/components/absensi-harian/ExportButtons";
import { useExportRange } from "@/components/absensi-harian/useExportRange";
import { STATUS_CFG, todayJakarta, formatTgl } from "@/components/absensi-harian/shared";
import { downloadAbsensiMagangPdfSiswa, downloadAbsensiMagangExcelSiswa } from "@/components/absensi-magang/downloadAbsensiMagang";
import { BackToHubLink } from "@/components/magang/BackToHubLink";
import type { RekapTempat, RekapRangeData } from "@/components/absensi-magang/types";

type StatusSaya = { hasPenempatan: boolean; tempatMagang?: { namaTempat: string; alamat: string } | null };

export default function SiswaMagangRekapPage() {
  const toast = useToast();
  const tanggal = todayJakarta();
  const exportRange = useExportRange(tanggal);

  const [status, setStatus] = useState<StatusSaya | null>(null);
  const [rekapHarian, setRekapHarian] = useState<RekapTempat | null>(null);
  const [rekapRange, setRekapRange] = useState<RekapRangeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  useEffect(() => {
    fetch(`/api/magang/absensi/saya?tanggal=${tanggal}`).then((r) => r.json()).then(setStatus).catch(() => {});
  }, [tanggal]);

  const loadRekap = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ mode: exportRange.range.mode });
      if (exportRange.range.mode === "harian") qs.set("tanggal", exportRange.range.tanggal);
      else if (exportRange.range.mode === "mingguan") {
        qs.set("tanggalMulai", exportRange.range.tanggalMulai);
        qs.set("tanggalSelesai", exportRange.range.tanggalSelesai);
      } else {
        qs.set("bulan", String(exportRange.range.bulan));
        qs.set("tahun", String(exportRange.range.tahun));
      }
      const res = await fetch(`/api/magang/absensi/saya/rekap?${qs}`);
      const json = await res.json().catch(() => null);
      if (exportRange.range.mode === "harian") { setRekapHarian(json); setRekapRange(null); }
      else { setRekapRange(json); setRekapHarian(null); }
    } catch {
      toast.error("Gagal memuat rekap PKL", "");
    } finally {
      setLoading(false);
    }
  }, [exportRange.range]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  async function handleExport(kind: "pdf" | "excel") {
    setExporting(kind);
    try {
      const result = kind === "pdf"
        ? await downloadAbsensiMagangPdfSiswa({ siswaId: "", range: exportRange.range, siswaNama: "Rekap-PKL" })
        : await downloadAbsensiMagangExcelSiswa({ siswaId: "", range: exportRange.range, siswaNama: "Rekap-PKL" });
      if (!result.ok) toast.error(kind === "pdf" ? "Gagal membuat PDF" : "Gagal membuat Excel", result.message);
    } finally {
      setExporting(null);
    }
  }

  const own = rekapHarian?.siswa?.[0];
  const ownRange = rekapRange?.siswa?.[0];

  return (
    <div className="space-y-5 p-1">
      <BackToHubLink href="/siswa/magang/rekap" />
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <FileBarChart size={22} className="text-white sm:hidden" />
            <FileBarChart size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Laporan PKL</span>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Rekap PKL</h1>
            <p className="mt-0.5 text-sm text-white/70">Rekap kehadiran PKL-mu sendiri</p>
          </div>
        </div>
      </div>

      {status && !status.hasPenempatan ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <AlertCircle size={26} className="text-red-500" />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-white">Belum Ada Penempatan PKL</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400 dark:text-slate-500">
            Anda belum memiliki penempatan PKL yang aktif, jadi belum ada rekap yang bisa ditampilkan.
          </p>
        </div>
      ) : (
        <>
          {status?.tempatMagang && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                <Briefcase size={15} className="text-[#0082FB]" /> {status.tempatMagang.namaTempat}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <MapPin size={12} className="mt-0.5 shrink-0" /> {status.tempatMagang.alamat}
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Rekap Kehadiran</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {exportRange.range.mode === "harian" ? formatTgl(exportRange.range.tanggal)
                    : exportRange.range.mode === "mingguan" ? `${formatTgl(exportRange.weekRange.start)} – ${formatTgl(exportRange.weekRange.end)}`
                    : `Bulan ${exportRange.bulan}/${exportRange.tahun}`}
                </p>
              </div>
              <RangeModeToggle {...exportRange} />
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 size={22} className="animate-spin text-[#0082FB]" />
                </div>
              ) : exportRange.range.mode === "harian" ? (
                own ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/40">
                    <span className="rounded-full px-3 py-1.5 text-sm font-bold" style={{
                      backgroundColor: own.status ? STATUS_CFG[own.status].bg : "#F1F5F8",
                      color: own.status ? STATUS_CFG[own.status].clr : "#94a3b8",
                    }}>
                      {own.status ? STATUS_CFG[own.status].label : "Belum Absen"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Hadir: {own.waktuAbsen ?? "—"}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Pulang: {own.waktuPulang ?? "—"}</span>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">Tidak ada data untuk tanggal ini</p>
                )
              ) : ownRange ? (
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-extrabold" style={{ color: ownRange.summary.persentaseKehadiran >= 70 ? STATUS_CFG.HADIR.clr : STATUS_CFG.ALPA.clr }}>
                      {ownRange.summary.persentaseKehadiran}%
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className="h-2 rounded-full transition-all" style={{
                        width: `${Math.min(100, ownRange.summary.persentaseKehadiran)}%`,
                        backgroundColor: ownRange.summary.persentaseKehadiran >= 70 ? STATUS_CFG.HADIR.clr : STATUS_CFG.ALPA.clr,
                      }} />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Hadir {ownRange.summary.HADIR} · Izin {ownRange.summary.IZIN} · Sakit {ownRange.summary.SAKIT} · Alpa {ownRange.summary.ALPA} · dari {ownRange.summary.totalHariEfektif} hari efektif
                  </p>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">Tidak ada data untuk periode ini</p>
              )}
            </div>

            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
              <button type="button" onClick={() => handleExport("pdf")} disabled={!!exporting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: "#FEE9EA", color: "#EF4444", borderColor: "#EF444430" }}>
                {exporting === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Unduh PDF
              </button>
              <button type="button" onClick={() => handleExport("excel")} disabled={!!exporting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: "#E3FBF0", color: "#00D67F", borderColor: "#00D67F30" }}>
                {exporting === "excel" ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />} Unduh Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
