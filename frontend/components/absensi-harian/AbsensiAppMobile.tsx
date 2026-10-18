"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, FileSignature, Thermometer, XCircle, Clock, LogIn, LogOut, Moon, ChevronRight,
} from "lucide-react";
import { icon3dStyle, MENU_TONE } from "@/components/shared/Icon3D";
import { STATUS_CFG, formatTgl } from "@/components/absensi-harian/shared";
import type { StatusAbsensi, AbsenWindow } from "@/components/absensi-harian/types";
import { APP_HERO } from "@/components/app/AppUI";

const ACCENT = "#3E03B3";
const ACCENT_SOFT = "#F1EDFA";

type Tab = "DATANG" | "PULANG";

type RowLite = {
  tanggal: string;
  status: StatusAbsensi | null;
  waktuAbsen: string | null;
  waktuPulang: string | null;
};

type StatusLite = { sudahAbsen: boolean; sudahPulang: boolean } | null;

type Summary = { hadir: number; izin: number; sakit: number; alpa: number } | null;

/**
 * Tampilan mobile Absensi Harian untuk aplikasi terpasang, mengikuti pola
 * dashboard dan Materi & Tugas: judul besar, banner lavender, tab bergaris bawah
 * ungu, kartu putih, dan tombol aksi ungu. Wizard absen dan modal detail
 * dirender oleh halaman induk (dipakai bersama tampilan biasa).
 */
export function AbsensiAppMobile<R extends RowLite>({
  today, jam, data, summary, window_, needsActionDatang, needsActionPulang,
  selectedRiwayatTab, setSelectedRiwayatTab, riwayatData, riwayatLoading, onDetail, onOpenWizard,
}: {
  today: string;
  jam: string;
  data: StatusLite;
  summary: Summary;
  window_: AbsenWindow;
  needsActionDatang: boolean;
  needsActionPulang: boolean;
  selectedRiwayatTab: Tab;
  setSelectedRiwayatTab: (t: Tab) => void;
  riwayatData: R[] | null;
  riwayatLoading: boolean;
  onDetail: (tab: Tab, row: R) => void;
  onOpenWizard: (tab: Tab) => void;
}) {
  const mainTab: Tab = window_ === "PULANG"
    ? "PULANG"
    : window_ === "HADIR"
      ? "DATANG"
      : window_ === "BOTH"
        ? (needsActionDatang ? "DATANG" : "PULANG")
        : (needsActionDatang ? "DATANG" : needsActionPulang ? "PULANG" : (data?.sudahAbsen ? "PULANG" : "DATANG"));
  const mainNeedsAction = mainTab === "DATANG" ? needsActionDatang : needsActionPulang;
  const mainDone = mainTab === "DATANG" ? data?.sudahAbsen : data?.sudahPulang;
  const mainName = mainTab === "DATANG" ? "Absen Datang" : "Absen Pulang";
  const ctaLabel = mainDone
    ? `${mainName} Sudah Tercatat`
    : mainNeedsAction ? `${mainName} Sekarang` : `${mainName} Ditutup`;

  const statusText = data?.sudahAbsen && data?.sudahPulang
    ? "Absensi hari ini lengkap"
    : data?.sudahAbsen
      ? "Sudah absen datang, menunggu pulang"
      : "Belum absen hari ini";

  const rekap = summary ? [
    { label: "Hadir", value: summary.hadir, icon: CheckCircle2, tone: "emerald" as const },
    { label: "Izin", value: summary.izin, icon: FileSignature, tone: "sky" as const },
    { label: "Sakit", value: summary.sakit, icon: Thermometer, tone: "amber" as const },
    { label: "Alpa", value: summary.alpa, icon: XCircle, tone: "violet" as const },
  ] : [];

  return (
    <div className="space-y-6 lg:hidden">
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Presensi Wajib Harian</p>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Absensi Harian</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl px-5 py-6 text-center" style={{ background: APP_HERO }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
        <p className="relative text-xs font-semibold text-white/80">{formatTgl(today)}</p>
        <p className="relative mt-2 font-digital text-[34px] font-bold tracking-wider tabular-nums" style={{ color: "#FFFFFF", textShadow: "0 0 18px rgba(255,255,255,0.45)" }}>{jam}</p>
        <div
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold"
          style={{ color: data?.sudahAbsen && data?.sudahPulang ? "#3E03B3" : data?.sudahAbsen ? "#3E03B3" : "#64748B" }}
        >
          <Clock size={12} /> {statusText}
        </div>
      </motion.div>

      <motion.button
        whileTap={mainNeedsAction ? { scale: 0.97 } : undefined} type="button"
        disabled={!mainNeedsAction}
        onClick={() => mainNeedsAction && onOpenWizard(mainTab)}
        className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-bold"
        style={mainNeedsAction
          ? { background: ACCENT, color: "#fff", boxShadow: "0 10px 24px -8px rgba(62,3,179,0.7)" }
          : { background: "#E2E8F0", color: "#94A3B8" }}
      >
        {mainTab === "DATANG" ? <LogIn size={18} /> : <LogOut size={18} />}
        {ctaLabel}
      </motion.button>

      {summary && (
        <section>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Rekap Kehadiran</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {rekap.map((r, i) => (
              <motion.div
                key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(r.tone)}>
                  <r.icon size={26} color="#fff" />
                </span>
                <span className="text-lg font-extrabold leading-none text-slate-900 dark:text-white">{r.value}</span>
                <span className="-mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{r.label}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Riwayat Absen</h2>
        <div className="mt-4 flex gap-7 border-b border-slate-200 dark:border-slate-700/60">
          {([["DATANG", "Datang"], ["PULANG", "Pulang"]] as const).map(([key, label]) => {
            const active = selectedRiwayatTab === key;
            return (
              <button
                key={key} type="button" onClick={() => setSelectedRiwayatTab(key)}
                className="relative pb-3 text-[15px] font-semibold transition-colors"
                style={{ color: active ? ACCENT : "#94a3b8" }}
              >
                {label}
                {active && (
                  <motion.span layoutId="app-absen-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ background: "#F26A3D" }} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          {riwayatLoading ? (
            [0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />)
          ) : !riwayatData || riwayatData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Moon size={22} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-400">Belum ada riwayat</p>
            </div>
          ) : (
            riwayatData.map((row, i) => {
              const waktu = selectedRiwayatTab === "DATANG" ? row.waktuAbsen : row.waktuPulang;
              const label = selectedRiwayatTab === "DATANG"
                ? (row.status ? STATUS_CFG[row.status].label : "Hadir")
                : "Pulang";
              return (
                <motion.button
                  key={row.tanggal} type="button" whileTap={{ scale: 0.98 }}
                  onClick={() => onDetail(selectedRiwayatTab, row)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-[0_2px_10px_-3px_rgba(62,3,179,0.14)] dark:bg-[#1E293B]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={icon3dStyle(selectedRiwayatTab === "DATANG" ? MENU_TONE.absensi : MENU_TONE.magang)}
                  >
                    {selectedRiwayatTab === "DATANG" ? <LogIn size={20} color="#fff" /> : <LogOut size={20} color="#fff" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{formatTgl(row.tanggal)}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{label}</span><span>•</span><span>{i === 0 ? "Terbaru" : "Tercatat"}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold" style={{ color: "#F26A3D" }}>
                      <Clock size={12} /> <span className="font-digital text-[12px] tracking-wider">{waktu ?? "—"}</span>
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-slate-300" />
                </motion.button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
