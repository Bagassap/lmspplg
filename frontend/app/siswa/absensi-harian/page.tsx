"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, MapPin, Camera, CheckCircle2, Loader2, Clock, RefreshCw,
  Sparkles, FileSignature, MessageSquareText, LogIn, LogOut, Moon, AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { SignaturePad } from "@/components/absensi-harian/SignaturePad";
import { STATUS_CFG, PULANG_CFG, BRAND_GRADIENT, formatTgl, resolveMediaSrc, todayJakarta } from "@/components/absensi-harian/shared";
import type { StatusAbsensi, AbsenWindow } from "@/components/absensi-harian/types";
import { StatisticRainbow } from "@/components/dashboard/StatisticRainbow";
import { compressImage } from "@/lib/compressImage";

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
type Tab = "DATANG" | "PULANG";

const MOTIVASI = [
  "Kehadiranmu hari ini adalah langkah kecil menuju kesuksesan besar!",
  "Konsisten hadir, konsisten berkembang.",
  "Rajin hadir, ilmu makin melekat.",
  "Semangat pagi! Satu absen, satu langkah maju.",
  "Disiplin hari ini, hasil gemilang nanti.",
  "Hadir hari ini, bangga selamanya.",
  "Jangan lewatkan harimu — catat kehadiranmu sekarang!",
];

// getCurrentPosition is blocked outright by every browser on non-HTTPS,
// non-localhost origins (this site is served over plain HTTP on a bare IP,
// so it always fails here). GPS is still requested and still required to
// *attempt*, but when the browser itself refuses to even try, we fall back
// to this marker instead of leaving the field empty forever — otherwise
// nobody could ever submit an absen on this deployment.
const GPS_UNAVAILABLE = "GPS tidak tersedia (koneksi tidak aman)";
function isGpsCoords(loc: string | null) {
  return !!loc && loc !== GPS_UNAVAILABLE;
}

// Absen pulang closes at a different time on Friday (11:00-12:00) vs
// Senin-Kamis (14:00-17:00) — keep the displayed range in sync with the
// day-aware window enforced server-side (currentWindow() in
// absensi-harian.service.ts).
function isJakartaFriday(): boolean {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "short" }).format(new Date()) === "Fri";
}
function pulangRange(): string {
  return isJakartaFriday() ? "11:00 – 12:00 (Jumat)" : "14:00 – 17:00 (Sen-Kam)";
}
function getWindowInfo(window_: AbsenWindow): { label: string; range: string } {
  if (window_ === "HADIR") return { label: "Jendela Absen Datang", range: "06:00 – 09:00 (Sen-Jum)" };
  if (window_ === "PULANG") return { label: "Jendela Absen Pulang", range: pulangRange() };
  return { label: "Di luar jam absensi", range: "Tidak ada jendela aktif" };
}

export default function SiswaAbsensiHarianPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = todayJakarta();

  const [data, setData] = useState<StatusSaya | null>(null);
  const [summary, setSummary] = useState<AbsensiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("DATANG");
  const tabAutoSet = useRef(false);

  const [lokasi, setLokasi] = useState<string | null>(null);
  const [lokasiLoading, setLokasiLoading] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [compressingFoto, setCompressingFoto] = useState(false);
  const [ttd, setTtd] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [statusPilihan, setStatusPilihan] = useState<"HADIR" | "IZIN" | "SAKIT">("HADIR");

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
  }, [today]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    const id = setInterval(() => loadStatus(true), 60_000);
    return () => clearInterval(id);
  }, [loadStatus]);

  const window_ = data?.window ?? "CLOSED";

  // Default the visible tab to whichever one is actually actionable right now,
  // but only once on first load — after that the student is free to switch
  // tabs to review either side without it jumping back on them.
  useEffect(() => {
    if (!tabAutoSet.current && data) {
      tabAutoSet.current = true;
      if (data.window === "PULANG") setActiveTab("PULANG");
    }
  }, [data]);

  const needsActionDatang = window_ === "HADIR" && !data?.sudahAbsen;
  const needsActionPulang = window_ === "PULANG" && !data?.sudahPulang;
  const needsAction = activeTab === "DATANG" ? needsActionDatang : needsActionPulang;
  const activeTipe = activeTab === "PULANG" ? "PULANG" : statusPilihan;

  useEffect(() => {
    setLokasi(null);
    setFotoFile(null);
    setFotoPreview(null);
    setTtd(null);
    setCatatan("");
    setStatusPilihan("HADIR");
  }, [activeTab]);

  const requestLokasi = useCallback(() => {
    if (!navigator.geolocation) {
      setLokasi(GPS_UNAVAILABLE);
      return;
    }
    setLokasiLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLokasi(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        setLokasiLoading(false);
      },
      () => {
        setLokasi(GPS_UNAVAILABLE);
        setLokasiLoading(false);
      },
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!needsAction) return;
    requestLokasi();
  }, [needsAction, requestLokasi]);

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCompressingFoto(true);
    try {
      const compressed = await compressImage(file);
      setFotoFile(compressed);
      const reader = new FileReader();
      reader.onload = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(compressed);
    } catch {
      toast.error(
        "Foto gagal diproses",
        "Perangkat mungkin kehabisan memori. Coba lagi, gunakan foto lain, atau tutup aplikasi lain lalu ulangi.",
      );
    } finally {
      setCompressingFoto(false);
    }
  }

  async function handleSubmit() {
    if (!needsAction) return;
    const tipe = activeTipe;
    if (tipe === "HADIR" || tipe === "PULANG") {
      if (!lokasi) { toast.error("Lokasi (GPS) wajib diisi", ""); return; }
    }
    if (tipe === "IZIN" || tipe === "SAKIT") {
      if (!catatan.trim()) { toast.error("Keterangan wajib diisi", ""); return; }
    }
    if (!fotoFile) { toast.error("Foto wajib diisi", ""); return; }
    if (!ttd) { toast.error("Tanda tangan wajib diisi", ""); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("tipe", tipe);
      formData.set("waktuAbsen", new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      if (lokasi) formData.set("lokasi", lokasi);
      if (catatan) formData.set("catatan", catatan);
      if (ttd) formData.set("ttd", ttd);
      if (fotoFile) formData.set("foto", fotoFile);

      const res = await fetch("/api/absensi-harian/saya", { method: "POST", body: formData });
      if (res.ok) {
        const successMsg =
          tipe === "HADIR" ? "Absen datang berhasil dicatat!" :
          tipe === "PULANG" ? "Absen pulang berhasil dicatat!" :
          tipe === "IZIN" ? "Izin berhasil dicatat!" : "Sakit berhasil dicatat!";
        toast.success(successMsg, "");
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
  const winInfo = getWindowInfo(window_);

  const TABS: { key: Tab; label: string; icon: typeof LogIn }[] = [
    { key: "DATANG", label: "Absen Datang", icon: LogIn },
    { key: "PULANG", label: "Absen Pulang", icon: LogOut },
  ];

  return (
    <div className="space-y-5">

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

        <div className="relative mt-5 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
            style={{ background: data?.sudahAbsen ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.12)" }}>
            <LogIn size={11} /> Datang {data?.sudahAbsen ? `· ${data.record?.waktuAbsen ?? ""}` : "· belum"}
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
          <div className="grid grid-cols-12 gap-4 md:gap-5">

            <div className="col-span-12 xl:col-span-7">

              {/* Tab switcher — both tabs always visible/clickable regardless of the active time window */}
              <div className="mb-4 flex gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/60">
                {TABS.map((t) => {
                  const active = activeTab === t.key;
                  const Icon = t.icon;
                  return (
                    <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all"
                      style={active
                        ? { background: t.key === "PULANG" ? `linear-gradient(135deg,${PULANG_CFG.clr}dd,${PULANG_CFG.clr})` : BRAND_GRADIENT, color: "#fff" }
                        : { background: "transparent", color: "#94a3b8" }}>
                      <Icon size={15} /> {t.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "DATANG" ? (
                  data?.sudahAbsen ? (
                    <motion.div key="datang-sudah" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="overflow-hidden rounded-2xl shadow-lg" style={{ background: BRAND_GRADIENT }}>
                      <RingkasanAbsen
                        title={`${cfg.label} Tercatat`}
                        desc={<>Anda tercatat <b>{cfg.label}</b> hari ini</>}
                        waktu={data?.record?.waktuAbsen}
                        foto={data?.record?.foto}
                        fotoLabel={status !== "HADIR" ? "Foto Surat Izin/Sakit" : "Foto Selfie"}
                        ttd={data?.record?.ttd}
                        lokasi={data?.record?.lokasi}
                        catatan={data?.record?.catatan}
                        footnote={`Absen pulang tersedia jam ${pulangRange()}`}
                        onReload={() => loadStatus()}
                      />
                    </motion.div>
                  ) : needsActionDatang ? (
                    <motion.div key="datang-form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <FormAbsen
                        activeTipe={activeTipe}
                        statusPilihan={statusPilihan} setStatusPilihan={setStatusPilihan}
                        showStatusPicker
                        lokasi={lokasi} lokasiLoading={lokasiLoading} onRetryLokasi={requestLokasi}
                        fotoPreview={fotoPreview} fileInputRef={fileInputRef}
                        onFotoChange={handleFotoChange} compressingFoto={compressingFoto}
                        onFotoClear={() => { setFotoFile(null); setFotoPreview(null); }}
                        catatan={catatan} setCatatan={setCatatan}
                        ttd={ttd} setTtd={setTtd}
                        submitting={submitting} onSubmit={handleSubmit}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="datang-closed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: BRAND_GRADIENT }}>
                        <Moon size={26} className="text-white" />
                      </div>
                      <h2 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-white">Belum Waktunya</h2>
                      <p className="mt-1.5 max-w-sm text-sm text-slate-400 dark:text-slate-500">
                        Absen datang hanya tersedia jam 06.00-09.00 WIB, Senin-Jumat.
                      </p>
                    </motion.div>
                  )
                ) : (
                  data?.sudahPulang ? (
                    <motion.div key="pulang-sudah" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="overflow-hidden rounded-2xl shadow-lg" style={{ background: `linear-gradient(160deg,${PULANG_CFG.clr}dd,${PULANG_CFG.clr})` }}>
                      <RingkasanAbsen
                        title="Kepulangan Tercatat"
                        desc={<>Anda tercatat <b>Pulang</b> hari ini</>}
                        waktu={data?.record?.waktuPulang}
                        foto={data?.record?.fotoPulang}
                        ttd={data?.record?.ttdPulang}
                        lokasi={data?.record?.lokasiPulang}
                        catatan={data?.record?.catatanPulang}
                        onReload={() => loadStatus()}
                      />
                    </motion.div>
                  ) : needsActionPulang ? (
                    <motion.div key="pulang-form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <FormAbsen
                        activeTipe="PULANG"
                        statusPilihan={statusPilihan} setStatusPilihan={setStatusPilihan}
                        showStatusPicker={false}
                        lokasi={lokasi} lokasiLoading={lokasiLoading} onRetryLokasi={requestLokasi}
                        fotoPreview={fotoPreview} fileInputRef={fileInputRef}
                        onFotoChange={handleFotoChange} compressingFoto={compressingFoto}
                        onFotoClear={() => { setFotoFile(null); setFotoPreview(null); }}
                        catatan={catatan} setCatatan={setCatatan}
                        ttd={ttd} setTtd={setTtd}
                        submitting={submitting} onSubmit={handleSubmit}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="pulang-closed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                        {window_ === "HADIR" ? <Clock size={26} className="text-blue-500" /> : <AlertCircle size={26} className="text-red-500" />}
                      </div>
                      <h2 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-white">
                        {window_ === "HADIR" ? "Belum Waktunya" : "Waktu Sudah Berakhir"}
                      </h2>
                      <p className="mt-1.5 max-w-sm text-sm text-slate-400 dark:text-slate-500">
                        {window_ === "HADIR"
                          ? `Absen pulang belum tersedia. Absen pulang dibuka jam ${pulangRange()}.`
                          : `Waktu absen pulang hari ini sudah berakhir atau belum dibuka. Jendela pulang: ${pulangRange()}.`}
                      </p>
                    </motion.div>
                  )
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

function RingkasanAbsen({
  title, desc, waktu, foto, fotoLabel = "Foto Selfie", ttd, lokasi, catatan, footnote, onReload,
}: {
  title: string;
  desc: React.ReactNode;
  waktu?: string | null;
  foto?: string | null;
  fotoLabel?: string;
  ttd?: string | null;
  lokasi?: string | null;
  catatan?: string | null;
  footnote?: string;
  onReload: () => void;
}) {
  return (
    <>
      <div className="relative px-6 py-8 text-center">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/8" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10, delay: 0.1 }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/25 shadow-lg">
          <CheckCircle2 size={30} className="text-white" />
        </motion.div>
        <h2 className="mt-4 text-lg font-extrabold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/80">{desc}</p>
        <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
          <Clock size={14} className="text-white/70" />
          <span className="font-mono text-xl font-extrabold text-white">{waktu ?? "—"}</span>
        </div>

        <div className="relative mx-auto mt-6 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
          {foto && (
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <img src={resolveMediaSrc(foto) ?? undefined} alt={fotoLabel}
                className="h-24 w-24 rounded-xl border-2 border-white/30 object-cover shadow-md" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">{fotoLabel}</span>
            </div>
          )}
          {ttd && (
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <img src={resolveMediaSrc(ttd) ?? undefined} alt="Tanda tangan"
                className="h-24 w-full rounded-xl border-2 border-white/30 bg-white object-contain shadow-md" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Tanda Tangan</span>
            </div>
          )}
        </div>

        {(lokasi || catatan) && (
          <div className="relative mx-auto mt-4 max-w-md space-y-2 text-left">
            {lokasi && (
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                <MapPin size={13} className="shrink-0 text-white/70" />
                <span className="truncate font-mono text-[11px] text-white/80">{lokasi}</span>
              </div>
            )}
            {catatan && (
              <div className="flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                <MessageSquareText size={13} className="mt-0.5 shrink-0 text-white/70" />
                <span className="text-[11px] text-white/80">{catatan}</span>
              </div>
            )}
          </div>
        )}

        {footnote && <p className="relative mt-5 text-[11px] text-white/60">{footnote}</p>}
      </div>
      <div className="bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
        <button onClick={onReload} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white">
          <RefreshCw size={12} /> Muat ulang
        </button>
      </div>
    </>
  );
}

function FormAbsen({
  activeTipe, statusPilihan, setStatusPilihan, showStatusPicker,
  lokasi, lokasiLoading, onRetryLokasi, fotoPreview, fileInputRef, onFotoChange, compressingFoto, onFotoClear,
  catatan, setCatatan, ttd, setTtd, submitting, onSubmit,
}: {
  activeTipe: "HADIR" | "IZIN" | "SAKIT" | "PULANG";
  statusPilihan: "HADIR" | "IZIN" | "SAKIT";
  setStatusPilihan: (s: "HADIR" | "IZIN" | "SAKIT") => void;
  showStatusPicker: boolean;
  lokasi: string | null;
  lokasiLoading: boolean;
  onRetryLokasi: () => void;
  fotoPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  compressingFoto: boolean;
  onFotoClear: () => void;
  catatan: string;
  setCatatan: (v: string) => void;
  ttd: string | null;
  setTtd: (v: string | null) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const isIzinSakit = activeTipe === "IZIN" || activeTipe === "SAKIT";
  const fotoMissing = !fotoPreview;
  const lokasiMissing = !isIzinSakit && !lokasi;
  const ttdMissing = !ttd;
  const catatanMissing = isIzinSakit && !catatan.trim();
  const disabled = submitting || compressingFoto || fotoMissing || lokasiMissing || ttdMissing || catatanMissing;

  const fotoLabel = isIzinSakit ? "Foto Surat Izin/Sakit" : "Foto Selfie";
  const fotoField = (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Camera size={12} /> {fotoLabel} <span className="text-red-400 normal-case">*wajib</span>
      </p>
      {fotoPreview ? (
        <div className="relative flex h-18 items-center">
          <img src={fotoPreview} alt="Preview" className="h-18 w-18 rounded-xl object-cover shadow-sm" />
          <button onClick={onFotoClear}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md">
            ×
          </button>
        </div>
      ) : (
        <button onClick={() => fileInputRef.current?.click()} disabled={compressingFoto}
          className={`flex h-18 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-slate-400 transition-colors hover:border-violet-400 hover:text-violet-400 disabled:cursor-wait disabled:opacity-70 ${
            fotoMissing ? "border-red-300 dark:border-red-800" : "border-slate-200 dark:border-slate-600"
          }`}>
          {compressingFoto ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs font-semibold">Memproses foto...</span>
            </>
          ) : (
            <>
              <Camera size={18} />
              <span className="text-xs font-semibold">{isIzinSakit ? "Unggah Foto" : "Ambil Foto"}</span>
            </>
          )}
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" {...(isIzinSakit ? {} : { capture: "user" as const })}
        className="hidden" onChange={onFotoChange} />
      {fotoMissing && <p className="mt-1 text-[11px] font-semibold text-red-500">{fotoLabel} wajib diisi</p>}
    </div>
  );

  return (
    <div className="space-y-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ background: activeTipe === "PULANG" ? `linear-gradient(135deg,${PULANG_CFG.clr}dd,${PULANG_CFG.clr})` : BRAND_GRADIENT }}>
          {activeTipe === "PULANG" ? <LogOut size={18} /> : activeTipe === "HADIR" ? <LogIn size={18} /> : (() => { const Icon = STATUS_CFG[activeTipe].icon; return <Icon size={18} />; })()}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
            {activeTipe === "PULANG" ? "Absen Pulang" : `Absen ${STATUS_CFG[activeTipe].label}`}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {activeTipe === "PULANG" ? "Catat waktu pulangmu untuk hari ini" :
             activeTipe === "HADIR" ? "Catat kehadiranmu untuk hari ini" :
             `Laporkan ${STATUS_CFG[activeTipe].label.toLowerCase()} untuk hari ini`}
          </p>
        </div>
      </div>

      {showStatusPicker && (
        <div className="flex gap-2 px-5">
          {(["HADIR", "IZIN", "SAKIT"] as const).map((s) => {
            const c = STATUS_CFG[s];
            const active = statusPilihan === s;
            return (
              <button key={s} type="button" onClick={() => setStatusPilihan(s)}
                className="flex-1 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-colors"
                style={active
                  ? { borderColor: c.clr, background: c.bg, color: c.clr }
                  : { borderColor: "transparent", background: "transparent", color: "#94a3b8" }}>
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-4 px-5 pb-5">
        {!isIzinSakit ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <MapPin size={12} /> Lokasi <span className="text-red-400 normal-case">*wajib</span>
              </p>
              <div className={`flex h-18 items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40 ${
                lokasiMissing ? "border-red-300 dark:border-red-800" : isGpsCoords(lokasi) ? "border-slate-100 dark:border-slate-700" : "border-amber-200 dark:border-amber-800"
              }`}>
                <MapPin size={15} className={isGpsCoords(lokasi) ? "text-emerald-500" : lokasi ? "text-amber-500" : "text-slate-300"} />
                {lokasiLoading ? (
                  <span className="text-xs text-slate-400">Mendeteksi lokasi...</span>
                ) : isGpsCoords(lokasi) ? (
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{lokasi}</span>
                ) : (
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-xs text-amber-600 dark:text-amber-400">{lokasi ?? "Lokasi tidak tersedia"}</span>
                    <button type="button" onClick={onRetryLokasi} className="shrink-0 text-[11px] font-bold text-violet-500 hover:underline">
                      Coba lagi
                    </button>
                  </div>
                )}
              </div>
              {lokasiMissing && !lokasiLoading && <p className="mt-1 text-[11px] font-semibold text-red-500">Lokasi (GPS) wajib diisi</p>}
              {!lokasiMissing && !isGpsCoords(lokasi) && !lokasiLoading && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">GPS tidak dapat diakses browser — absen tetap bisa dikirim</p>
              )}
            </div>

            {fotoField}
          </div>
        ) : (
          fotoField
        )}

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <MessageSquareText size={12} />
            {isIzinSakit
              ? <>Keterangan / Alasan <span className="text-red-400 normal-case">*wajib</span></>
              : "Keterangan (opsional)"}
          </p>
          <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2}
            placeholder={isIzinSakit ? "Tulis alasan izin/sakit..." : "Tulis keterangan tambahan..."}
            className={`w-full resize-none rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 dark:bg-slate-900/40 dark:text-slate-200 ${
              catatanMissing ? "border-red-300 focus:ring-red-300 dark:border-red-800" : "border-slate-200 focus:ring-violet-400 dark:border-slate-600"
            }`} />
          {catatanMissing && <p className="mt-1 text-[11px] font-semibold text-red-500">Keterangan wajib diisi</p>}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <FileSignature size={12} /> Tanda Tangan <span className="text-red-400 normal-case">*wajib</span>
          </p>
          <div className={ttdMissing ? "rounded-xl ring-2 ring-red-300" : ""}>
            <SignaturePad onChange={setTtd} />
          </div>
          {ttdMissing && <p className="mt-1 text-[11px] font-semibold text-red-500">Tanda tangan wajib diisi</p>}
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={onSubmit}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md disabled:opacity-50"
          style={{ background: activeTipe === "PULANG" ? `linear-gradient(135deg,${PULANG_CFG.clr}dd,${PULANG_CFG.clr})` : BRAND_GRADIENT }}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : (activeTipe === "PULANG" ? <LogOut size={16} /> : <LogIn size={16} />)}
          {submitting ? "Menyimpan..." : activeTipe === "PULANG" ? "Absen Pulang Sekarang" : `Absen ${STATUS_CFG[activeTipe].label} Sekarang`}
        </motion.button>
      </div>
    </div>
  );
}
