"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileBarChart, FileUp, BarChart3, ChevronLeft } from "lucide-react";
import { SiswaLaporDiriPanel } from "@/components/magang/SiswaLaporDiriPanel";
import { SiswaLaporanPanel } from "@/components/magang/SiswaLaporanPanel";
import type { LaporDiriStatusSaya } from "@/components/magang/lapor-diri-types";
import type { LaporanAkhirStatusSaya } from "@/components/magang/laporan-akhir-types";
import { AppTabs } from "@/components/app/AppUI";
import { useIsAppMode } from "@/lib/pwaInstall";

type Category = "lapor-diri" | "laporan";

const LAPORAN_AKHIR_LABEL: Record<string, string> = {
  TERKIRIM: "Menunggu review",
  DITERIMA: "Laporan diterima",
  REVISI: "Perlu direvisi",
};

export default function SiswaMagangRekapPage() {
  const router = useRouter();
  const appMode = useIsAppMode();
  const [category, setCategory] = useState<Category>("lapor-diri");
  const [status, setStatus] = useState<LaporDiriStatusSaya | null>(null);
  const [laporanAkhir, setLaporanAkhir] = useState<LaporanAkhirStatusSaya | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/magang/lapor-diri/saya").then((r) => r.json()).catch(() => null),
      fetch("/api/magang/laporan-akhir/saya").then((r) => r.json()).catch(() => null),
    ]).then(([lapor, laporan]) => {
      setStatus(lapor);
      setLaporanAkhir(laporan);
    }).finally(() => setLoading(false));
  }, []);

  const sudahLapor = status?.hasPenempatan ? status.sudahLapor : false;
  const laporanAkhirSubtitle = laporanAkhir?.hasPenempatan
    ? laporanAkhir.laporan ? LAPORAN_AKHIR_LABEL[laporanAkhir.laporan.status] : "Belum kirim laporan akhir"
    : "Kirim laporan akhir PKL-mu";

  return (
    <div className="space-y-6">
      <div className="relative hidden overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
            style={{ background: "linear-gradient(145deg, #0EA5E9 0%, #3E03B3 55%, #2D0281 100%)" }}>
            <FileBarChart size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden" />
            <FileBarChart size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">PKL</span>
            <h1 className="text-xl font-extrabold leading-tight text-slate-800 dark:text-white sm:text-2xl">Rekap PKL</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800 lg:block">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</p>
            <div className="flex flex-col gap-4">
              <button type="button" onClick={() => setCategory("lapor-diri")}
                className="relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-left text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "#3E03B3",
                  boxShadow: category === "lapor-diri" ? "0 8px 24px rgba(62,3,179,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                  outline: category === "lapor-diri" ? "2px solid #3E03B3" : "none",
                  outlineOffset: "3px",
                }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                  <FileUp size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-xl font-black leading-tight">Lapor Diri</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">
                    {status?.hasPenempatan ? (sudahLapor ? "Sudah lapor bulan ini" : "Belum lapor bulan ini") : "Unggah laporan bulananmu"}
                  </p>
                </div>
              </button>

              <button type="button" onClick={() => setCategory("laporan")}
                className="relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "#F26A3D", color: "#FFFFFF",
                  boxShadow: category === "laporan" ? "0 8px 24px rgba(242,106,61,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                  outline: category === "laporan" ? "2px solid #F26A3D" : "none",
                  outlineOffset: "3px",
                }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                  <BarChart3 size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-xl font-black leading-tight">Laporan</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">{loading ? "…" : laporanAkhirSubtitle}</p>
                </div>
              </button>
            </div>
          </div>

          {appMode ? (
            <div className="space-y-5 lg:hidden">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">PKL</p>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Rekap PKL</h1>
              </div>
              <AppTabs tabs={[["lapor-diri", "Lapor Diri"], ["laporan", "Laporan"]] as const} value={category} onChange={setCategory} layoutId="app-rekap-tab" />
            </div>
          ) : (
          <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
            <div className="relative flex items-center px-4 pb-3 pt-4">
              <button type="button" onClick={() => router.push("/siswa/dashboard")}
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
                <ChevronLeft size={18} />
              </button>
              <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Rekap PKL</h1>
            </div>
            <div className="rounded-t-[28px] bg-[#FFFFFF] px-4 py-3 dark:bg-[#1E293B]">
            <div className="isolate flex gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/60">
              <button type="button" onClick={() => setCategory("lapor-diri")}
                className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors"
                style={{ color: category === "lapor-diri" ? "#fff" : "#94a3b8" }}>
                {category === "lapor-diri" && (
                  <motion.span layoutId="rekapPklTabPill" className="absolute inset-0 rounded-xl"
                    style={{ background: "#3E03B3" }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5"><FileUp size={15} /> Lapor Diri</span>
              </button>
              <button type="button" onClick={() => setCategory("laporan")}
                className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors"
                style={{ color: category === "laporan" ? "#0F172A" : "#94a3b8" }}>
                {category === "laporan" && (
                  <motion.span layoutId="rekapPklTabPill" className="absolute inset-0 rounded-xl"
                    style={{ background: "#F26A3D" }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5"><BarChart3 size={15} /> Laporan</span>
              </button>
            </div>
            </div>
          </div>
          )}
        </div>

        {category === "lapor-diri" ? <SiswaLaporDiriPanel /> : <SiswaLaporanPanel />}
      </div>
    </div>
  );
}
