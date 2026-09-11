"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, MapPin, Camera, CheckCircle2, Loader2, Clock, RefreshCw,
  FileSignature, MessageSquareText, LogIn, LogOut, Moon, AlertCircle,
  X, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { SignaturePad } from "@/components/absensi-harian/SignaturePad";
import { STATUS_CFG, PULANG_CFG, BRAND_GRADIENT, formatTgl, resolveMediaSrc, todayJakarta, parseLokasi } from "@/components/absensi-harian/shared";
import type { StatusAbsensi, AbsenWindow } from "@/components/absensi-harian/types";
import { StatisticRainbow } from "@/components/dashboard/StatisticRainbow";
import { compressImage, readAsDataUrl, describePhotoError } from "@/lib/compressImage";

type StatusSaya = {
  sudahAbsen: boolean;
  sudahPulang: boolean;
  status: StatusAbsensi | null;
  tanggal: string;
  window: AbsenWindow;
  pulangLabel?: string;
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

type RiwayatRow = {
  tanggal: string;
  status: StatusAbsensi | null;
  waktuAbsen: string | null;
  lokasi: string | null;
  foto: string | null;
  ttd: string | null;
  catatan: string | null;
  waktuPulang: string | null;
  lokasiPulang: string | null;
  fotoPulang: string | null;
  ttdPulang: string | null;
  catatanPulang: string | null;
};

const INSECURE_CONTEXT_MSG = "Akses GPS memerlukan koneksi aman. Silakan buka melalui https://pplg.smklimpung.id, jangan menggunakan alamat IP langsung.";

function getWindowInfo(window_: AbsenWindow, pulangLabel: string): { label: string; range: string } {
  if (window_ === "HADIR") return { label: "Jendela Absen Datang", range: "06:00 – 09:00 (Sen-Jum)" };
  if (window_ === "PULANG") return { label: "Jendela Absen Pulang", range: pulangLabel };
  if (window_ === "BOTH") return { label: "Absen Datang & Pulang Dibuka Bersamaan", range: pulangLabel };
  return { label: "Di luar jam absensi", range: "Tidak ada jendela aktif" };
}

export default function SiswaAbsensiHarianPage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = todayJakarta();

  const [data, setData] = useState<StatusSaya | null>(null);
  const [summary, setSummary] = useState<AbsensiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("DATANG");
  const tabAutoSet = useRef(false);
  const [wizardTab, setWizardTab] = useState<Tab | null>(null);

  const [jam, setJam] = useState("--:--:--");
  const [selectedRiwayatTab, setSelectedRiwayatTab] = useState<Tab>("DATANG");
  const [riwayatData, setRiwayatData] = useState<RiwayatRow[] | null>(null);
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [riwayatDetail, setRiwayatDetail] = useState<{ tab: Tab; row: RiwayatRow } | null>(null);

  const [lokasi, setLokasi] = useState<string | null>(null);
  const [lokasiLoading, setLokasiLoading] = useState(false);
  const [lokasiError, setLokasiError] = useState<string | null>(null);
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

  useEffect(() => {
    function tick() {
      const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
      const parts = fmt.formatToParts(new Date());
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
      setJam(`${get("hour")}:${get("minute")}:${get("second")}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRiwayatData(null);
    setRiwayatLoading(true);
    fetch(`/api/absensi-harian/saya/riwayat?tipe=${selectedRiwayatTab === "DATANG" ? "HADIR" : "PULANG"}`)
      .then((r) => r.json())
      .then((list) => { if (!cancelled) setRiwayatData(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRiwayatData([]); })
      .finally(() => { if (!cancelled) setRiwayatLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRiwayatTab]);

  const window_ = data?.window ?? "CLOSED";

  useEffect(() => {
    if (!tabAutoSet.current && data) {
      tabAutoSet.current = true;
      if (data.window === "PULANG") setActiveTab("PULANG");
    }
  }, [data]);

  const needsActionDatang = (window_ === "HADIR" || window_ === "BOTH") && !data?.sudahAbsen;
  const needsActionPulang = (window_ === "PULANG" || window_ === "BOTH") && !data?.sudahPulang;
  const needsAction = activeTab === "DATANG" ? needsActionDatang : needsActionPulang;
  const activeTipe = activeTab === "PULANG" ? "PULANG" : statusPilihan;

  useEffect(() => {
    setLokasi(null);
    setLokasiError(null);
    setFotoFile(null);
    setFotoPreview(null);
    setTtd(null);
    setCatatan("");
    setStatusPilihan("HADIR");
  }, [activeTab]);

  const requestLokasi = useCallback(() => {
    setLokasi(null);
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLokasiError(INSECURE_CONTEXT_MSG);
      return;
    }
    if (!navigator.geolocation) {
      setLokasiError("Perangkat/browser ini tidak mendukung deteksi lokasi GPS.");
      return;
    }
    setLokasiError(null);
    setLokasiLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLokasi(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        setLokasiError(null);
        setLokasiLoading(false);
      },
      (err) => {
        setLokasiLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLokasiError("Izin lokasi ditolak. Aktifkan izin GPS untuk situs ini di pengaturan browser, lalu coba lagi.");
        } else if (err.code === err.TIMEOUT) {
          setLokasiError("Deteksi lokasi timeout. Pastikan GPS aktif dan sinyal memadai, lalu coba lagi.");
        } else {
          setLokasiError("Lokasi tidak dapat dideteksi. Coba lagi.");
        }
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
      const preview = await readAsDataUrl(compressed);
      setFotoFile(compressed);
      setFotoPreview(preview);
    } catch {
      const { title, detail } = describePhotoError();
      toast.error(title, detail);
      setFotoFile(null);
      setFotoPreview(null);
    } finally {
      setCompressingFoto(false);
    }
  }

  async function handleSubmit() {
    if (!needsAction) return;
    const tipe = activeTipe;
    if (!lokasi) { toast.error("Lokasi (GPS) wajib diisi", ""); return; }
    if (tipe === "IZIN" || tipe === "SAKIT") {
      if (!catatan.trim()) { toast.error("Keterangan wajib diisi", ""); return; }
    }
    if (!fotoFile) { toast.error("Foto wajib diisi", ""); return; }
    if (!ttd) { toast.error("Tanda tangan wajib diisi", ""); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("tipe", tipe);
      formData.set("waktuAbsen", new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }));
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
  const pulangLabel = data?.pulangLabel ?? "";
  const winInfo = getWindowInfo(window_, pulangLabel);

  const TABS: { key: Tab; label: string; icon: typeof LogIn }[] = [
    { key: "DATANG", label: "Absen Datang", icon: LogIn },
    { key: "PULANG", label: "Absen Pulang", icon: LogOut },
  ];

  function openWizard(tab: Tab) {
    setActiveTab(tab);
    setWizardTab(tab);
  }

  return (
    <div className="space-y-5">

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative hidden overflow-hidden rounded-2xl p-6 lg:block"
        style={{ background: BRAND_GRADIENT }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 right-28 h-52 w-52 rounded-full bg-white/6" />
        <div className="pointer-events-none absolute top-3 left-[45%] h-24 w-24 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 300, delay: 0.05 }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
              <ClipboardCheck size={22} className="text-white sm:hidden" />
              <ClipboardCheck size={26} className="hidden text-white sm:block" />
            </motion.div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Presensi Wajib Harian</span>
              <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Absensi Harian</h1>
            </div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 dark:border-slate-700 dark:bg-slate-800">
          <Loader2 size={24} className="animate-spin text-[#0082FB]" />
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-12 gap-4 md:gap-5 lg:grid">

            <div className="col-span-12 xl:col-span-7">

              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">{formatTgl(today)}</span>
                <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Clock size={11} /> {winInfo.label} · {winInfo.range}
                </span>
              </div>

              <div className="mb-4 flex gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/60">
                {TABS.map((t) => {
                  const active = activeTab === t.key;
                  const Icon = t.icon;
                  return (
                    <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all"
                      style={active
                        ? { background: t.key === "PULANG" ? PULANG_CFG.clr : BRAND_GRADIENT, color: "#fff" }
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
                        footnote={`Absen pulang tersedia jam ${pulangLabel}`}
                        onReload={() => loadStatus()}
                      />
                    </motion.div>
                  ) : needsActionDatang ? (
                    <motion.div key="datang-form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <FormAbsen
                        activeTipe={activeTipe}
                        statusPilihan={statusPilihan} setStatusPilihan={setStatusPilihan}
                        showStatusPicker
                        lokasi={lokasi} lokasiLoading={lokasiLoading} lokasiError={lokasiError} onRetryLokasi={requestLokasi}
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
                      className="overflow-hidden rounded-2xl shadow-lg" style={{ background: PULANG_CFG.clr }}>
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
                        lokasi={lokasi} lokasiLoading={lokasiLoading} lokasiError={lokasiError} onRetryLokasi={requestLokasi}
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
                      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${window_ === "HADIR" ? "" : "bg-red-50 dark:bg-red-900/20"}`}
                        style={window_ === "HADIR" ? { background: "#EAF3FF" } : undefined}>
                        {window_ === "HADIR" ? <Clock size={26} style={{ color: "#0082FB" }} /> : <AlertCircle size={26} className="text-red-500" />}
                      </div>
                      <h2 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-white">
                        {window_ === "HADIR" ? "Belum Waktunya" : "Waktu Sudah Berakhir"}
                      </h2>
                      <p className="mt-1.5 max-w-sm text-sm text-slate-400 dark:text-slate-500">
                        {window_ === "HADIR"
                          ? `Absen pulang belum tersedia. Absen pulang dibuka jam ${pulangLabel}.`
                          : `Waktu absen pulang hari ini sudah berakhir atau belum dibuka. Jendela pulang: ${pulangLabel}.`}
                      </p>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>

            {summary && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="col-span-12 rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1C2B33] xl:col-span-5">
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

          <div className="relative isolate -m-4 lg:hidden" style={{ background: BRAND_GRADIENT }}>
            <div className="relative flex items-center px-4 pb-3 pt-4">
              <button type="button" onClick={() => router.push("/siswa/dashboard")}
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
                <ChevronLeft size={18} />
              </button>
              <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Absensi Harian</h1>
            </div>
            <div className="space-y-4 rounded-t-[28px] bg-[#F1F5F8] p-4 dark:bg-[#1C2B33]">

            <div className="rounded-[28px] p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]" style={{ background: BRAND_GRADIENT }}>
              <p className="text-xs font-semibold text-[#DCEBFF]">{formatTgl(today)}</p>
              <p className="mt-1 font-mono text-4xl font-black tabular-nums text-white">{jam}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold"
                style={{ color: data?.sudahAbsen && data?.sudahPulang ? "#00D67F" : data?.sudahAbsen ? "#0082FB" : "#94A3B8" }}>
                <Clock size={12} />
                {data?.sudahAbsen && data?.sudahPulang
                  ? "Absensi hari ini lengkap"
                  : data?.sudahAbsen
                    ? "Sudah absen datang, menunggu pulang"
                    : "Belum absen hari ini"}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1C2B33]">
              <div className="grid grid-cols-2 gap-3">
                <RiwayatTabCard icon={LogIn} label="Absen Datang" active={selectedRiwayatTab === "DATANG"}
                  onClick={() => setSelectedRiwayatTab("DATANG")} />
                <RiwayatTabCard icon={LogOut} label="Absen Pulang" active={selectedRiwayatTab === "PULANG"}
                  onClick={() => setSelectedRiwayatTab("PULANG")} />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1C2B33]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: selectedRiwayatTab === "PULANG" ? PULANG_CFG.clr : BRAND_GRADIENT }}>
                  {selectedRiwayatTab === "DATANG" ? <LogIn size={18} /> : <LogOut size={18} />}
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                    Riwayat Absen {selectedRiwayatTab === "DATANG" ? "Datang" : "Pulang"}
                  </h2>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">Catatan hari ini</p>
                </div>
              </div>
              <div className="mt-3 space-y-2.5">
                {riwayatLoading ? (
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700" />
                ) : !riwayatData || riwayatData.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Moon size={20} className="text-slate-300" />
                    <p className="text-xs font-semibold text-slate-400">Belum ada riwayat hari ini</p>
                  </div>
                ) : (
                  riwayatData.map((row) => {
                    const waktu = selectedRiwayatTab === "DATANG" ? row.waktuAbsen : row.waktuPulang;
                    const rowAccent = selectedRiwayatTab === "PULANG" ? PULANG_CFG.clr : BRAND_GRADIENT;
                    return (
                      <button key={row.tanggal} type="button"
                        onClick={() => setRiwayatDetail({ tab: selectedRiwayatTab, row })}
                        className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left dark:bg-slate-800">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: rowAccent }}>
                          <Clock size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{formatTgl(row.tanggal)}</p>
                          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                            {selectedRiwayatTab === "DATANG" ? (row.status ? STATUS_CFG[row.status].label : "Hadir") : "Pulang"} · {waktu ?? "—"}
                          </p>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-slate-300" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {(() => {
              const mainTab: Tab = window_ === "PULANG"
                ? "PULANG"
                : window_ === "HADIR"
                  ? "DATANG"
                  : window_ === "BOTH"
                    ? (needsActionDatang ? "DATANG" : "PULANG")
                    : (needsActionDatang ? "DATANG" : needsActionPulang ? "PULANG" : (data?.sudahAbsen ? "PULANG" : "DATANG"));
              const mainNeedsAction = mainTab === "DATANG" ? needsActionDatang : needsActionPulang;
              const mainDone = mainTab === "DATANG" ? data?.sudahAbsen : data?.sudahPulang;
              const mainAccent = mainTab === "PULANG" ? PULANG_CFG.clr : BRAND_GRADIENT;
              const mainName = mainTab === "DATANG" ? "Absen Datang" : "Absen Pulang";
              const label = mainDone ? `${mainName} Sudah Tercatat` : mainNeedsAction ? `${mainName} Sekarang` : `${mainName} Ditutup`;
              return (
                <motion.button whileTap={mainNeedsAction ? { scale: 0.97 } : undefined} type="button"
                  disabled={!mainNeedsAction}
                  onClick={() => mainNeedsAction && openWizard(mainTab)}
                  className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-extrabold shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)]"
                  style={mainNeedsAction ? { background: mainAccent, color: "#fff" } : { background: "#E2E8F0", color: "#94A3B8" }}>
                  {mainTab === "DATANG" ? <LogIn size={18} /> : <LogOut size={18} />}
                  {label}
                </motion.button>
              );
            })()}

            <MobileFormAbsen
              open={wizardTab !== null}
              onClose={() => setWizardTab(null)}
              activeTipe={activeTipe}
              statusPilihan={statusPilihan} setStatusPilihan={setStatusPilihan}
              showStatusPicker={wizardTab === "DATANG"}
              lokasi={lokasi} lokasiLoading={lokasiLoading} lokasiError={lokasiError} onRetryLokasi={requestLokasi}
              fotoPreview={fotoPreview} fileInputRef={fileInputRef}
              onFotoChange={handleFotoChange} compressingFoto={compressingFoto}
              onFotoClear={() => { setFotoFile(null); setFotoPreview(null); }}
              catatan={catatan} setCatatan={setCatatan}
              ttd={ttd} setTtd={setTtd}
              submitting={submitting} onSubmit={handleSubmit}
            />


            <AnimatePresence>
              {riwayatDetail && (
                <MobileDetailModal onClose={() => setRiwayatDetail(null)} accent="#ffffff">
                  {riwayatDetail.tab === "DATANG" ? (
                    <RingkasanAbsen
                      title={`${riwayatDetail.row.status ? STATUS_CFG[riwayatDetail.row.status].label : "Hadir"} Tercatat`}
                      desc={<>Tercatat pada <b>{formatTgl(riwayatDetail.row.tanggal)}</b></>}
                      waktu={riwayatDetail.row.waktuAbsen}
                      foto={riwayatDetail.row.foto}
                      fotoLabel={riwayatDetail.row.status !== "HADIR" ? "Foto Surat Izin/Sakit" : "Foto Selfie"}
                      ttd={riwayatDetail.row.ttd}
                      lokasi={riwayatDetail.row.lokasi}
                      catatan={riwayatDetail.row.catatan}
                      onReload={() => {}}
                      showMap
                      onWhite
                      accentColor={BRAND_GRADIENT}
                    />
                  ) : (
                    <RingkasanAbsen
                      title="Kepulangan Tercatat"
                      desc={<>Tercatat pada <b>{formatTgl(riwayatDetail.row.tanggal)}</b></>}
                      waktu={riwayatDetail.row.waktuPulang}
                      foto={riwayatDetail.row.fotoPulang}
                      ttd={riwayatDetail.row.ttdPulang}
                      lokasi={riwayatDetail.row.lokasiPulang}
                      catatan={riwayatDetail.row.catatanPulang}
                      onReload={() => {}}
                      showMap
                      onWhite
                      accentColor={PULANG_CFG.clr}
                    />
                  )}
                </MobileDetailModal>
              )}
            </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RingkasanAbsen({
  title, desc, waktu, foto, fotoLabel = "Foto Selfie", ttd, lokasi, catatan, footnote, onReload, showMap = false,
  onWhite = false, accentColor = BRAND_GRADIENT,
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
  showMap?: boolean;
  onWhite?: boolean;
  accentColor?: string;
}) {
  const titik = showMap ? parseLokasi(lokasi) : null;

  if (onWhite) {
    return (
      <>
        <div className="relative px-6 py-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10, delay: 0.1 }}
            className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-lg" style={{ background: accentColor }}>
            <CheckCircle2 size={30} className="text-white" />
          </motion.div>
          <h2 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
          <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
            <Clock size={14} className="text-slate-400" />
            <span className="font-mono text-xl font-extrabold text-slate-800 dark:text-white">{waktu ?? "—"}</span>
          </div>

          <div className="relative mx-auto mt-6 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            {foto && (
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <img src={resolveMediaSrc(foto) ?? undefined} alt={fotoLabel}
                  className="h-24 w-24 rounded-xl border-2 border-slate-200 object-cover shadow-md dark:border-slate-700" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{fotoLabel}</span>
              </div>
            )}
            {ttd && (
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <img src={resolveMediaSrc(ttd) ?? undefined} alt="Tanda tangan"
                  className="h-24 w-full rounded-xl border-2 border-slate-200 bg-white object-contain shadow-md" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanda Tangan</span>
              </div>
            )}
          </div>

          {(lokasi || catatan) && (
            <div className="relative mx-auto mt-4 max-w-md space-y-2 text-left">
              {lokasi && titik && (
                <div className="overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
                  <iframe src={`https://maps.google.com/maps?q=${titik.lat},${titik.lng}&output=embed`}
                    className="h-32 w-full border-0" loading="lazy" title="Lokasi absen" />
                  <a href={`https://maps.google.com/maps?q=${titik.lat},${titik.lng}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate font-mono text-[10.5px] text-slate-500">{lokasi}</span>
                    <span className="flex shrink-0 items-center gap-1 text-[10.5px] font-bold" style={{ color: accentColor }}>
                      <ExternalLink size={10} /> Maps
                    </span>
                  </a>
                </div>
              )}
              {lokasi && !titik && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <MapPin size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate font-mono text-[11px] text-slate-500">{lokasi}</span>
                </div>
              )}
              {catatan && (
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <MessageSquareText size={13} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="text-[11px] text-slate-500">{catatan}</span>
                </div>
              )}
            </div>
          )}

          {footnote && <p className="relative mt-5 text-[11px] text-slate-400">{footnote}</p>}
        </div>
        <div className="border-t border-slate-100 px-6 py-3 text-center dark:border-slate-700">
          <button onClick={onReload} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">
            <RefreshCw size={12} /> Muat ulang
          </button>
        </div>
      </>
    );
  }

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
            {lokasi && titik && (
              <div className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm">
                <iframe src={`https://maps.google.com/maps?q=${titik.lat},${titik.lng}&output=embed`}
                  className="h-32 w-full border-0" loading="lazy" title="Lokasi absen" />
                <a href={`https://maps.google.com/maps?q=${titik.lat},${titik.lng}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate font-mono text-[10.5px] text-white/70">{lokasi}</span>
                  <span className="flex shrink-0 items-center gap-1 text-[10.5px] font-bold text-white/90">
                    <ExternalLink size={10} /> Maps
                  </span>
                </a>
              </div>
            )}
            {lokasi && !titik && (
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
  lokasi, lokasiLoading, lokasiError, onRetryLokasi, fotoPreview, fileInputRef, onFotoChange, compressingFoto, onFotoClear,
  catatan, setCatatan, ttd, setTtd, submitting, onSubmit,
}: {
  activeTipe: "HADIR" | "IZIN" | "SAKIT" | "PULANG";
  statusPilihan: "HADIR" | "IZIN" | "SAKIT";
  setStatusPilihan: (s: "HADIR" | "IZIN" | "SAKIT") => void;
  showStatusPicker: boolean;
  lokasi: string | null;
  lokasiLoading: boolean;
  lokasiError: string | null;
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
  const lokasiMissing = !lokasi;
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
          className={`flex h-18 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-slate-400 transition-colors hover:border-[#0082FB] hover:text-[#0082FB] disabled:cursor-wait disabled:opacity-70 ${
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

  const lokasiField = (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        <MapPin size={12} /> Lokasi <span className="text-red-400 normal-case">*wajib</span>
      </p>
      <div className={`flex h-18 items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40 ${
        lokasiMissing ? "border-red-300 dark:border-red-800" : "border-slate-100 dark:border-slate-700"
      }`}>
        <MapPin size={15} className={lokasi ? "text-emerald-500" : "text-red-400"} />
        {lokasiLoading ? (
          <span className="text-xs text-slate-400">Mendeteksi lokasi...</span>
        ) : lokasi ? (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{lokasi}</span>
        ) : (
          <div className="flex flex-1 items-center justify-between gap-2">
            <span className="text-xs text-red-500">{lokasiError ?? "Lokasi belum terdeteksi"}</span>
            <button type="button" onClick={onRetryLokasi} className="shrink-0 text-[11px] font-bold text-[#0082FB] hover:underline">
              Coba lagi
            </button>
          </div>
        )}
      </div>
      {lokasiMissing && !lokasiLoading && (
        <p className="mt-1 text-[11px] font-semibold text-red-500">{lokasiError ?? "Lokasi (GPS) wajib diisi"}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ background: activeTipe === "PULANG" ? PULANG_CFG.clr : BRAND_GRADIENT }}>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lokasiField}
          {fotoField}
        </div>

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
              catatanMissing ? "border-red-300 focus:ring-red-300 dark:border-red-800" : "border-slate-200 focus:ring-[#0082FB] dark:border-slate-600"
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
          style={{ background: activeTipe === "PULANG" ? PULANG_CFG.clr : BRAND_GRADIENT }}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : (activeTipe === "PULANG" ? <LogOut size={16} /> : <LogIn size={16} />)}
          {submitting ? "Menyimpan..." : activeTipe === "PULANG" ? "Absen Pulang Sekarang" : `Absen ${STATUS_CFG[activeTipe].label} Sekarang`}
        </motion.button>
      </div>
    </div>
  );
}

function MobileFormAbsen({
  open, onClose, activeTipe, statusPilihan, setStatusPilihan, showStatusPicker,
  lokasi, lokasiLoading, lokasiError, onRetryLokasi, fotoPreview, fileInputRef, onFotoChange, compressingFoto, onFotoClear,
  catatan, setCatatan, ttd, setTtd, submitting, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  activeTipe: "HADIR" | "IZIN" | "SAKIT" | "PULANG";
  statusPilihan: "HADIR" | "IZIN" | "SAKIT";
  setStatusPilihan: (s: "HADIR" | "IZIN" | "SAKIT") => void;
  showStatusPicker: boolean;
  lokasi: string | null;
  lokasiLoading: boolean;
  lokasiError: string | null;
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
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (open) { setDirection(1); setStep(0); }
  }, [open]);

  const isIzinSakit = activeTipe === "IZIN" || activeTipe === "SAKIT";
  const fotoMissing = !fotoPreview;
  const lokasiMissing = !lokasi;
  const ttdMissing = !ttd;
  const catatanMissing = isIzinSakit && !catatan.trim();
  const accentColor = activeTipe === "PULANG" ? PULANG_CFG.clr : BRAND_GRADIENT;
  const fotoLabel = isIzinSakit ? "Foto Surat Izin/Sakit" : "Foto Selfie";
  const titikLokasi = lokasi ? parseLokasi(lokasi) : null;

  const headerIcon = activeTipe === "PULANG" ? <LogOut size={16} /> : activeTipe === "HADIR" ? <LogIn size={16} /> : (() => { const Icon = STATUS_CFG[activeTipe].icon; return <Icon size={16} />; })();
  const headerTitle = activeTipe === "PULANG" ? "Absen Pulang" : `Absen ${STATUS_CFG[activeTipe].label}`;

  const steps = showStatusPicker ? (["foto", "lokasi", "status", "info"] as const) : (["foto", "lokasi", "info"] as const);
  const stepLabels: Record<(typeof steps)[number], string> = { foto: "Foto", lokasi: "Lokasi", status: "Status Kehadiran", info: "Keterangan & Tanda Tangan" };
  const stepKey = steps[step];
  const lastStep = step === steps.length - 1;
  const stepValid =
    stepKey === "foto" ? !fotoMissing && !compressingFoto :
    stepKey === "lokasi" ? !lokasiMissing :
    stepKey === "status" ? true :
    !ttdMissing && !catatanMissing;

  function goNext() {
    if (!stepValid) return;
    if (lastStep) { onSubmit(); return; }
    setDirection(1);
    setStep((s) => s + 1);
  }
  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  return createPortal(
    <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !submitting && onClose()}
            />

            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 flex w-full flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-[#1C2B33]"
              style={{ maxHeight: "92vh" }}
            >
              <div className="flex items-center justify-between px-5 pt-5">
                <div className="flex items-center gap-1.5">
                  {steps.map((s, i) => (
                    <span key={s} className="h-1.5 w-6 rounded-full transition-colors" style={{ background: i <= step ? accentColor : "#E2E8F0" }} />
                  ))}
                </div>
                <button type="button" onClick={() => !submitting && onClose()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2 px-5 pb-2 pt-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: accentColor }}>
                  {headerIcon}
                </div>
                <div className="min-w-0">
                  <span className="block text-[10.5px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{headerTitle} · {step + 1}/{steps.length}</span>
                  <h3 className="text-lg font-extrabold leading-tight text-slate-800 dark:text-white">{stepLabels[stepKey]}</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={stepKey}
                    initial={{ opacity: 0, x: direction * 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -28 }}
                    transition={{ duration: 0.22 }}
                  >
                    {stepKey === "foto" && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <Camera size={12} /> {fotoLabel} <span className="text-red-400 normal-case">*wajib</span>
                        </p>
                        {fotoPreview ? (
                          <div className="relative">
                            <img src={fotoPreview} alt="Preview" className="h-56 w-full rounded-2xl object-cover shadow-sm" />
                            <button onClick={onFotoClear}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => fileInputRef.current?.click()} disabled={compressingFoto}
                            className={`flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-slate-400 transition-colors active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
                              fotoMissing ? "border-red-300 dark:border-red-800" : "border-slate-200 dark:border-slate-600"
                            }`}>
                            {compressingFoto ? (
                              <>
                                <Loader2 size={30} className="animate-spin" />
                                <span className="text-xs font-bold">Memproses foto...</span>
                              </>
                            ) : (
                              <>
                                <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}18` }}>
                                  <Camera size={26} style={{ color: accentColor }} />
                                </div>
                                <span className="text-xs font-bold">{isIzinSakit ? "Ketuk untuk unggah foto" : "Ketuk untuk ambil foto"}</span>
                              </>
                            )}
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" {...(isIzinSakit ? {} : { capture: "user" as const })}
                          className="hidden" onChange={onFotoChange} />
                        {fotoMissing && <p className="mt-2 text-[11px] font-semibold text-red-500">{fotoLabel} wajib diisi</p>}
                      </div>
                    )}

                    {stepKey === "lokasi" && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <MapPin size={12} /> Lokasi <span className="text-red-400 normal-case">*wajib</span>
                        </p>
                        <div className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50 px-3.5 py-4 dark:bg-slate-900/40 ${
                          lokasiMissing ? "border-red-300 dark:border-red-800" : "border-slate-100 dark:border-slate-700"
                        }`}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: lokasi ? "#00D67F18" : "#EF444418" }}>
                            <MapPin size={16} className={lokasi ? "text-emerald-500" : "text-red-400"} />
                          </span>
                          {lokasiLoading ? (
                            <span className="text-xs text-slate-400">Mendeteksi lokasi...</span>
                          ) : lokasi ? (
                            <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">{lokasi}</span>
                          ) : (
                            <div className="flex flex-1 items-center justify-between gap-2">
                              <span className="text-xs text-red-500">{lokasiError ?? "Lokasi belum terdeteksi"}</span>
                              <button type="button" onClick={onRetryLokasi} className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#0082FB] shadow-sm dark:bg-slate-800">
                                Coba lagi
                              </button>
                            </div>
                          )}
                        </div>
                        {lokasiMissing && !lokasiLoading && (
                          <p className="mt-2 text-[11px] font-semibold text-red-500">{lokasiError ?? "Lokasi (GPS) wajib diisi"}</p>
                        )}
                        {titikLokasi && (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700">
                            <iframe src={`https://maps.google.com/maps?q=${titikLokasi.lat},${titikLokasi.lng}&output=embed`}
                              className="h-40 w-full border-0" loading="lazy" title="Peta lokasi" />
                          </div>
                        )}
                      </div>
                    )}

                    {stepKey === "status" && (
                      <div className="space-y-2.5">
                        {(["HADIR", "IZIN", "SAKIT"] as const).map((s) => {
                          const c = STATUS_CFG[s];
                          const active = statusPilihan === s;
                          const Icon = c.icon;
                          const desc = s === "HADIR" ? "Saya hadir di sekolah hari ini" : s === "IZIN" ? "Saya izin tidak masuk hari ini" : "Saya sakit tidak masuk hari ini";
                          return (
                            <button key={s} type="button" onClick={() => setStatusPilihan(s)}
                              className="flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors"
                              style={active ? { borderColor: c.clr, background: c.bg } : { borderColor: "#F1F5F9", background: "transparent" }}>
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${c.clr}18` }}>
                                <Icon size={18} style={{ color: c.clr }} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold" style={{ color: active ? c.clr : "#334155" }}>{c.label}</p>
                                <p className="text-[11px] text-slate-400">{desc}</p>
                              </div>
                              {active && <CheckCircle2 size={18} className="shrink-0" style={{ color: c.clr }} />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {stepKey === "info" && (
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <MessageSquareText size={12} />
                            {isIzinSakit
                              ? <>Keterangan / Alasan <span className="text-red-400 normal-case">*wajib</span></>
                              : "Keterangan (opsional)"}
                          </p>
                          <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2}
                            placeholder={isIzinSakit ? "Tulis alasan izin/sakit..." : "Tulis keterangan tambahan..."}
                            className={`w-full resize-none rounded-2xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 dark:bg-slate-900/40 dark:text-slate-200 ${
                              catatanMissing ? "border-red-300 focus:ring-red-300 dark:border-red-800" : "border-slate-200 focus:ring-[#0082FB] dark:border-slate-600"
                            }`} />
                          {catatanMissing && <p className="mt-2 text-[11px] font-semibold text-red-500">Keterangan wajib diisi</p>}
                        </div>

                        <div>
                          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <FileSignature size={12} /> Tanda Tangan <span className="text-red-400 normal-case">*wajib</span>
                          </p>
                          <div className={ttdMissing ? "rounded-xl ring-2 ring-red-300" : ""}>
                            <SignaturePad onChange={setTtd} />
                          </div>
                          {ttdMissing && <p className="mt-2 text-[11px] font-semibold text-red-500">Tanda tangan wajib diisi</p>}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
                {step > 0 && (
                  <button type="button" onClick={goBack}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <ChevronLeft size={18} />
                  </button>
                )}
                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={goNext}
                  disabled={!stepValid || submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
                  style={{ background: accentColor }}>
                  {lastStep
                    ? (submitting ? <Loader2 size={16} className="animate-spin" /> : (activeTipe === "PULANG" ? <LogOut size={16} /> : <LogIn size={16} />))
                    : <ChevronRight size={16} />}
                  {lastStep
                    ? (submitting ? "Menyimpan..." : activeTipe === "PULANG" ? "Absen Pulang Sekarang" : `Absen ${STATUS_CFG[activeTipe].label} Sekarang`)
                    : "Lanjut"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
    </AnimatePresence>,
    document.body
  );
}

function RiwayatTabCard({ icon: Icon, label, active, onClick }: {
  icon: typeof LogIn;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-3xl p-4 text-center"
      style={{ background: active ? "#EF4444" : "#F1F5F8" }}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
        <Icon size={20} style={{ color: active ? "#EF4444" : "#94A3B8" }} />
      </span>
      <p className="text-[11px] font-bold" style={{ color: active ? "#fff" : "#64748B" }}>{label}</p>
    </motion.button>
  );
}

function MobileDetailModal({ onClose, accent, children }: { onClose: () => void; accent: string; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 w-full overflow-hidden rounded-t-3xl"
        style={{ background: accent }}
      >
        <button type="button" onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          <X size={15} />
        </button>
        <div className="overflow-y-auto" style={{ maxHeight: "92vh" }}>
          {children}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
