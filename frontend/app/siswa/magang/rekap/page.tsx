"use client";

import { useState, useEffect } from "react";
import { FileBarChart, FileUp, BarChart3 } from "lucide-react";
import { SiswaLaporDiriPanel } from "@/components/magang/SiswaLaporDiriPanel";
import { SiswaLaporanPanel } from "@/components/magang/SiswaLaporanPanel";
import type { LaporDiriStatusSaya } from "@/components/magang/lapor-diri-types";
import type { LaporanAkhirStatusSaya } from "@/components/magang/laporan-akhir-types";

type Category = "lapor-diri" | "laporan";

const LAPORAN_AKHIR_LABEL: Record<string, string> = {
  TERKIRIM: "Menunggu review",
  DITERIMA: "Laporan diterima",
  REVISI: "Perlu direvisi",
};

export default function SiswaMagangRekapPage() {
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
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <FileBarChart size={22} className="text-white sm:hidden" />
            <FileBarChart size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">PKL</span>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Rekap PKL</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_2.3fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</p>
          <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
            <button type="button" onClick={() => setCategory("lapor-diri")}
              className="relative flex h-24 flex-col justify-between overflow-hidden rounded-xl px-3 py-3 text-left text-white transition-all hover:scale-[1.01] active:scale-[0.99] sm:rounded-2xl lg:h-32 lg:px-5 lg:py-5"
              style={{
                background: "#0082FB",
                boxShadow: category === "lapor-diri" ? "0 8px 24px rgba(0,130,251,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                outline: category === "lapor-diri" ? "2px solid #0082FB" : "none",
                outlineOffset: "3px",
              }}>
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 lg:-right-6 lg:-top-6 lg:h-28 lg:w-28" />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 lg:h-9 lg:w-9 lg:rounded-2xl">
                <FileUp size={14} className="lg:hidden" />
                <FileUp size={16} className="hidden lg:block" />
              </div>
              <div className="relative min-w-0">
                <p className="truncate text-sm font-black leading-tight sm:text-base lg:text-xl">Lapor Diri</p>
                <p className="mt-0.5 truncate text-[9px] font-medium text-white/75 sm:text-[10px] lg:text-[11px]">
                  {status?.hasPenempatan ? (sudahLapor ? "Sudah lapor bulan ini" : "Belum lapor bulan ini") : "Unggah laporan bulananmu"}
                </p>
              </div>
            </button>

            <button type="button" onClick={() => setCategory("laporan")}
              className="relative flex h-24 flex-col justify-between overflow-hidden rounded-xl px-3 py-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] sm:rounded-2xl lg:h-32 lg:px-5 lg:py-5"
              style={{
                background: "#C3F84A",
                color: "#1C2B33",
                boxShadow: category === "laporan" ? "0 8px 24px rgba(195,248,74,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                outline: category === "laporan" ? "2px solid #C3F84A" : "none",
                outlineOffset: "3px",
              }}>
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#1C2B33]/10 lg:-right-6 lg:-top-6 lg:h-28 lg:w-28" />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-[#1C2B33]/15 lg:h-9 lg:w-9 lg:rounded-2xl">
                <BarChart3 size={14} className="lg:hidden" />
                <BarChart3 size={16} className="hidden lg:block" />
              </div>
              <div className="relative min-w-0">
                <p className="truncate text-sm font-black leading-tight sm:text-base lg:text-xl">Laporan</p>
                <p className="mt-0.5 truncate text-[9px] font-medium text-[#1C2B33]/75 sm:text-[10px] lg:text-[11px]">{loading ? "…" : laporanAkhirSubtitle}</p>
              </div>
            </button>
          </div>
        </div>

        {category === "lapor-diri" ? <SiswaLaporDiriPanel /> : <SiswaLaporanPanel />}
      </div>
    </div>
  );
}
