"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, FileSignature, Thermometer, XCircle, Clock, LogIn, LogOut, Moon, ChevronRight,
} from "lucide-react";
import { icon3dStyle, MENU_TONE } from "@/components/shared/Icon3D";
import { STATUS_CFG, formatTgl } from "@/components/absensi-harian/shared";
import type { StatusAbsensi, AbsenWindow } from "@/components/absensi-harian/types";

const ACCENT = "#F26A3D";
const ACCENT_SOFT = "#FFE9E2";

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
 * dashboard dan Materi & Tugas: judul besar, banner peach, tab bergaris bawah
 * oranye, kartu putih, dan tombol aksi oranye. Wizard absen dan modal detail
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
        className="rounded-3xl px-5 py-6 text-center" style={{ background: ACCENT_SOFT }}
      >
        <p className="text-xs font-semibold" style={{ color: ACCENT }}>{formatTgl(today)}</p>
        <p className="mt-2 font-digital text-[34px] font-bold tracking-wider tabular-nums" style={{ color: ACCENT, textShadow: "0 2px 0 rgba(242,106,61,0.18)" }}>{jam}</p>
        <div
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold"
          style={{ color: data?.sudahAbsen && data?.sudahPulang ? "#5D900F" : data?.sudahAbsen ? "#3E03B3" : "#64748B" }}
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
          ? { background: ACCENT, color: "#fff", boxShadow: "0 10px 24px -8px rgba(242,106,61,0.7)" }
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
                  <motion.span layoutId="app-absen-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ background: ACCENT }} />
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
                  className="flex w-full items-center gap-4 rounded-3xl bg-white p-3 text-left shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]"
                >
                  <span
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                    style={icon3dStyle(selectedRiwayatTab === "DATANG" ? MENU_TONE.absensi : MENU_TONE.magang)}
                  >
                    {selectedRiwayatTab === "DATANG" ? <LogIn size={26} color="#fff" /> : <LogOut size={26} color="#fff" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{formatTgl(row.tanggal)}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{label}</span><span>•</span><span>{i === 0 ? "Terbaru" : "Tercatat"}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold" style={{ color: ACCENT }}>
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
