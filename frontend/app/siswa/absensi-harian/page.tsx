"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, MapPin, Camera, CheckCircle2, Loader2, Clock, RefreshCw,
  Sparkles, FileSignature, MessageSquareText, LogIn, LogOut, Moon,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { SignaturePad } from "@/components/absensi-harian/SignaturePad";
import { STATUS_CFG, PULANG_CFG, BRAND_GRADIENT, formatTgl, resolveMediaSrc } from "@/components/absensi-harian/shared";
import type { StatusAbsensi, AbsenWindow } from "@/components/absensi-harian/types";
import { StatisticRainbow } from "@/components/dashboard/StatisticRainbow";

type StatusSaya = {
  sudahAbsen: boolean;
  sudahPulang: boolean;
  status: StatusAbsensi | null;
  tanggal: string;
  window: AbsenWindow;
  record?: {
    waktuAbsen?: string | null;
    lokasi?: string | null;
    foto?: string | null;
    ttd?: string | null;
    catatan?: string | null;
    waktuPulang?: string | null;
    lokasiPulang?: string | null;
    fotoPulang?: string | null;
    ttdPulang?: string | null;
    catatanPulang?: string | null;
  } | null;
};

type AbsensiSummary = { hadir: number; izin: number; sakit: number; alpa: number; total: number; persentase: number };

const MOTIVASI = [
  "Kehadiranmu hari ini adalah langkah kecil menuju kesuksesan besar!",
  "Konsisten hadir, konsisten berkembang.",
  "Rajin hadir, ilmu makin melekat.",
  "Semangat pagi! Satu absen, satu langkah maju.",
  "Disiplin hari ini, hasil gemilang nanti.",
  "Hadir hari ini, bangga selamanya.",
  "Jangan lewatkan harimu — catat kehadiranmu sekarang!",
];

const WINDOW_INFO: Record<AbsenWindow, { label: string; range: string }> = {
  HADIR:  { label: "Jendela Absen Hadir",  range: "06:00 – 12:00" },
  PULANG: { label: "Jendela Absen Pulang", range: "12:00 – 18:00" },
  CLOSED: { label: "Di luar jam absensi",  range: "18:00 – 06:00" },
};

export default function SiswaAbsensiHarianPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [data, setData] = useState<StatusSaya | null>(null);
  const [summary, setSummary] = useState<AbsensiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [lokasi, setLokasi] = useState<string | null>(null);
  const [lokasiLoading, setLokasiLoading] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [ttd, setTtd] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");

  const loadStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statusRes, dashRes] = await Promise.all([
        fetch(`/api/absensi-harian/saya?tanggal=${today}`),
        fetch("/api/dashboard/siswa"),
      ]);
      const d: StatusSaya = await statusRes.json();
      setData(d);
      if (dashRes.ok) {
        const dash = await dashRes.json();
        if (dash?.absensi) setSummary(dash.absensi);
      }
    } catch {
      if (!silent) toast.error("Gagal memuat status absensi", "");
    } finally {
      if (!silent) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Re-check every minute so the Hadir/Pulang window flips automatically without a manual refresh.
  useEffect(() => {
    const id = setInterval(() => loadStatus(true), 60_000);
    return () => clearInterval(id);
  }, [loadStatus]);

  const window_ = data?.window ?? "CLOSED";
  const needsAction =
    (window_ === "HADIR" && !data?.sudahAbsen) || (window_ === "PULANG" && !data?.sudahPulang);

  // Reset the shared form fields whenever the active window/mode changes.
  useEffect(() => {
    setLokasi(null);
    setFotoFile(null);
    setFotoPreview(null);
    setTtd(null);
    setCatatan("");
  }, [window_]);

  useEffect(() => {
    if (!needsAction) return;
    if (!navigator.geolocation) return;
    setLokasiLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLokasi(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        setLokasiLoading(false);
      },
      () => setLokasiLoading(false),
      { timeout: 8000 },
    );
  }, [needsAction]);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (window_ !== "HADIR" && window_ !== "PULANG") return;
    if (!ttd) { toast.error("Tanda tangan wajib diisi", ""); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("tipe", window_);
      formData.set("waktuAbsen", new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      if (lokasi) formData.set("lokasi", lokasi);
      if (catatan) formData.set("catatan", catatan);
      formData.set("ttd", ttd);
      if (fotoFile) formData.set("foto", fotoFile);

      const res = await fetch("/api/absensi-harian/saya", { method: "POST", body: formData });
      if (res.ok) {
        toast.success(window_ === "HADIR" ? "Absen hadir berhasil dicatat!" : "Absen pulang berhasil dicatat!", "");
        loadStatus();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal mencatat absensi", "");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const status = (data?.status ?? "HADIR") as StatusAbsensi;
  const cfg = STATUS_CFG[status];
  const motivasi = MOTIVASI[new Date().getDay() % MOTIVASI.length];
  const winInfo = WINDOW_INFO[window_];

  return (
    <div className="space-y-5">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
        style={{ background: BRAND_GRADIENT }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 right-28 h-52 w-52 rounded-full bg-white/6" />
        <div className="pointer-events-none absolute top-3 left-[45%] h-24 w-24 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 300, delay: 0.05 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ClipboardCheck size={26} className="text-white" />
            </motion.div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Presensi Wajib Harian</span>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi Harian</h1>
              <p className="mt-0.5 text-sm text-white/70">{formatTgl(today)}</p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="mt-1.5 flex items-center gap-1.5 text-xs text-white/60">
                <Sparkles size={12} className="shrink-0" /> <span className="truncate">{motivasi}</span>
              </motion.p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
              <Clock size={11} /> {winInfo.label} · {winInfo.range}
            </span>
            <LiveClock />
          </div>
        </div>

        {/* Ringkasan keterangan hari ini */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: data?.sudahAbsen ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.12)" }}>
            <LogIn size={11} /> Hadir {data?.sudahAbsen ? `· ${data.record?.waktuAbsen ?? ""}` : "· belum"}
          </span>
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: data?.sudahPulang ? "rgba(59,124,232,0.35)" : "rgba(255,255,255,0.12)" }}>
            <LogOut size={11} /> Pulang {data?.sudahPulang ? `· ${data.record?.waktuPulang ?? ""}` : "· belum"}
          </span>
          {data?.status && data.status !== "HADIR" && (
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.18)" }}>
              Keterangan: {cfg.label}
            </span>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 dark:border-slate-700 dark:bg-slate-800">
          <Loader2 size={24} className="animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          {/* ── Row: Absen utama + Statistik ────────────────────────────────── */}
          <div className="grid grid-cols-12 gap-4 md:gap-5">

            <div className="col-span-12 xl:col-span-7">
              <AnimatePresence mode="wait">
                {window_ === "CLOSED" ? (
                  <motion.div key="closed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: BRAND_GRADIENT }}>
                      <Moon size={26} className="text-white" />
                    </div>
                    <h2 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-white">Belum Waktunya Absen</h2>
                    <p className="mt-1.5 max-w-sm text-sm text-slate-400 dark:text-slate-500">
                      Absen hadir dibuka pukul <b>06:00–12:00</b> dan absen pulang pukul <b>12:00–18:00</b>. Silakan kembali lagi nanti.
                    </p>
                  </motion.div>
                ) : needsAction ? (
                  <motion.div key={`form-${window_}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">

                    <div className="flex items-center gap-3 px-5 pt-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                        style={{ background: window_ === "HADIR" ? BRAND_GRADIENT : `linear-gradient(135deg,${PULANG_CFG.clr}dd,${PULANG_CFG.clr})` }}>
                        {window_ === "HADIR" ? <LogIn size={18} /> : <LogOut size={18} />}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                          {window_ === "HADIR" ? "Absen Hadir" : "Absen Pulang"}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {window_ === "HADIR" ? "Catat kehadiranmu untuk hari ini" : "Catat waktu pulangmu untuk hari ini"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 px-5 pb-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <MapPin size={12} /> Lokasi
                          </p>
                          <div className="flex h-18 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/40">
                            <MapPin size={15} className={lokasi ? "text-emerald-500" : "text-slate-300"} />
                            {lokasiLoading ? (
                              <span className="text-xs text-slate-400">Mendeteksi lokasi...</span>
                            ) : lokasi ? (
                              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{lokasi}</span>
                            ) : (
                              <span className="text-xs text-slate-400">Lokasi tidak tersedia (opsional)</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <Camera size={12} /> Foto Selfie (opsional)
                          </p>
                          {fotoPreview ? (
                            <div className="relative flex h-18 items-center">
                              <img src={fotoPreview} alt="Preview" className="h-18 w-18 rounded-xl object-cover shadow-sm" />
                              <button onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md">
                                ×
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => fileInputRef.current?.click()}
                              className="flex h-18 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-violet-400 hover:text-violet-400 dark:border-slate-600">
                              <Camera size={18} />
                              <span className="text-xs font-semibold">Ambil Foto</span>
                            </button>
                          )}
                          <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFotoChange} />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <MessageSquareText size={12} /> Keterangan (opsional)
                        </p>
                        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2}
                          placeholder="Tulis keterangan tambahan..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200" />
                      </div>

                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <FileSignature size={12} /> Tanda Tangan <span className="text-red-400 normal-case">*wajib</span>
                        </p>
                        <SignaturePad onChange={setTtd} />
                      </div>

                      <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={submitting || !ttd}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md disabled:opacity-50"
                        style={{ background: window_ === "HADIR" ? BRAND_GRADIENT : `linear-gradient(135deg,${PULANG_CFG.clr}dd,${PULANG_CFG.clr})` }}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : (window_ === "HADIR" ? <LogIn size={16} /> : <LogOut size={16} />)}
                        {submitting ? "Menyimpan..." : window_ === "HADIR" ? "Absen Hadir Sekarang" : "Absen Pulang Sekarang"}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key={`sudah-${window_}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="overflow-hidden rounded-2xl shadow-lg" style={{ background: BRAND_GRADIENT }}>
                    <div className="relative px-6 py-8 text-center">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/8" />
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10, delay: 0.1 }}
                        className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/25 shadow-lg">
                        <CheckCircle2 size={30} className="text-white" />
                      </motion.div>
                      <h2 className="mt-4 text-lg font-extrabold text-white">
                        {window_ === "HADIR" ? "Kehadiran Tercatat" : "Kepulangan Tercatat"}
                      </h2>
                      <p className="mt-1 text-sm text-white/80">
                        {window_ === "HADIR"
                          ? <>Anda tercatat <b>{cfg.label}</b> hari ini</>
                          : <>Anda tercatat <b>Pulang</b> hari ini</>}
                      </p>
                      <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
                        <Clock size={14} className="text-white/70" />
                        <span className="font-mono text-xl font-extrabold text-white">
                          {window_ === "HADIR" ? (data?.record?.waktuAbsen ?? "—") : (data?.record?.waktuPulang ?? "—")}
                        </span>
                      </div>

                      <div className="relative mx-auto mt-6 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                        {(window_ === "HADIR" ? data?.record?.foto : data?.record?.fotoPulang) && (
                          <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                            <img src={resolveMediaSrc(window_ === "HADIR" ? data?.record?.foto : data?.record?.fotoPulang) ?? undefined} alt="Selfie"
                              className="h-24 w-24 rounded-xl border-2 border-white/30 object-cover shadow-md" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Foto Selfie</span>
                          </div>
                        )}
                        {(window_ === "HADIR" ? data?.record?.ttd : data?.record?.ttdPulang) && (
                          <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                            <img src={resolveMediaSrc(window_ === "HADIR" ? data?.record?.ttd : data?.record?.ttdPulang) ?? undefined} alt="Tanda tangan"
                              className="h-24 w-full rounded-xl border-2 border-white/30 bg-white object-contain shadow-md" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Tanda Tangan</span>
                          </div>
                        )}
                      </div>

                      {((window_ === "HADIR" ? data?.record?.lokasi : data?.record?.lokasiPulang) ||
                        (window_ === "HADIR" ? data?.record?.catatan : data?.record?.catatanPulang)) && (
                        <div className="relative mx-auto mt-4 max-w-md space-y-2 text-left">
                          {(window_ === "HADIR" ? data?.record?.lokasi : data?.record?.lokasiPulang) && (
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                              <MapPin size={13} className="shrink-0 text-white/70" />
                              <span className="truncate font-mono text-[11px] text-white/80">
                                {window_ === "HADIR" ? data?.record?.lokasi : data?.record?.lokasiPulang}
                              </span>
                            </div>
                          )}
                          {(window_ === "HADIR" ? data?.record?.catatan : data?.record?.catatanPulang) && (
                            <div className="flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                              <MessageSquareText size={13} className="mt-0.5 shrink-0 text-white/70" />
                              <span className="text-[11px] text-white/80">
                                {window_ === "HADIR" ? data?.record?.catatan : data?.record?.catatanPulang}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {window_ === "HADIR" && (
                        <p className="relative mt-5 text-[11px] text-white/60">Absen pulang tersedia mulai pukul 12:00</p>
                      )}
                    </div>
                    <div className="bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
                      <button onClick={() => loadStatus()} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white">
                        <RefreshCw size={12} /> Muat ulang
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {summary && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="col-span-12 rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434] xl:col-span-5">
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Statistik Absensi</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Rekap kehadiran semester ini</p>
                <StatisticRainbow
                  hadir={summary.hadir} sakit={summary.sakit}
                  izin={summary.izin} alpha={summary.alpa}
                  total={summary.total}
                />
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
