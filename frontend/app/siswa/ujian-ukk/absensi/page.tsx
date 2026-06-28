"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, Clock, MapPin, User,
  CheckCircle2, MinusCircle, AlertCircle, Thermometer,
  Camera, Pen, X, RotateCcw, Send, Download, Monitor,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";

// ── Types ──────────────────────────────────────────────────────────────────────
type StatusAbsensi = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

type Tahapan = {
  id: string; hariKe: number; judul: string; tanggal: string;
  jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string;
};

type AbsensiStatus = {
  sudahAbsen: boolean;
  status: string | null;
  tanggal: string;
  record?: {
    status?: string; waktuAbsen?: string; lokasi?: string;
    catatan?: string; ttd?: string; foto?: string;
  };
};

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<StatusAbsensi, {
  label: string; bg: string; clr: string; darkBg: string; icon: React.ElementType;
}> = {
  HADIR: { label: "Hadir", bg: "#E8F8F1", clr: "#10B981", darkBg: "#10B98120", icon: CheckCircle2 },
  IZIN:  { label: "Izin",  bg: "#F0ECFF", clr: "#6334F4", darkBg: "#6334F420", icon: AlertCircle  },
  SAKIT: { label: "Sakit", bg: "#FFF5DC", clr: "#E6A800", darkBg: "#E6A80020", icon: Thermometer  },
  ALPA:  { label: "Alpa",  bg: "#FFE9EA", clr: "#FF3644", darkBg: "#FF364420", icon: MinusCircle  },
};

const CARD_GRADIENTS_BY_STATUS: Record<string, string> = {
  HADIR: "linear-gradient(135deg,#10B981,#34D399)",
  IZIN:  "linear-gradient(135deg,#6334F4,#8B5CF6)",
  SAKIT: "linear-gradient(135deg,#F59E0B,#FCD34D)",
  ALPA:  "linear-gradient(135deg,#EF4444,#F87171)",
  BELUM: "linear-gradient(135deg,#64748B,#94A3B8)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTgl(tgl?: string) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ── Signature Pad ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const src  = "touches" in e ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault(); drawing.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath(); ctx.moveTo(x, y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y); ctx.stroke();
    };
    const onEnd = () => { drawing.current = false; onChange(canvas.toDataURL()); };

    canvas.addEventListener("mousedown",  onStart);
    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseup",    onEnd);
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove",  onMove,  { passive: false });
    canvas.addEventListener("touchend",   onEnd);

    return () => {
      canvas.removeEventListener("mousedown",  onStart);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseup",    onEnd);
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove",  onMove);
      canvas.removeEventListener("touchend",   onEnd);
    };
  }, [onChange]);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden">
        <canvas ref={canvasRef} width={400} height={120} className="w-full touch-none cursor-crosshair"/>
        {!value && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-slate-300 dark:text-slate-500 flex items-center gap-1.5">
              <Pen size={12}/> Tanda tangan di sini
            </p>
          </div>
        )}
      </div>
      <button type="button" onClick={clear}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
        <RotateCcw size={11}/> Hapus tanda tangan
      </button>
    </div>
  );
}

// ── Siswa Lab Card ────────────────────────────────────────────────────────────
function SiswaLabCard({ tahapan, statusAbsensi, selected, onClick, delay, index }: {
  tahapan: Tahapan;
  statusAbsensi: AbsensiStatus | undefined;
  selected: boolean;
  onClick: () => void;
  delay: number;
  index: number;
}) {
  const st       = statusAbsensi?.status as StatusAbsensi | null ?? null;
  const gradient = CARD_GRADIENTS_BY_STATUS[st ?? "BELUM"];
  const Icon     = st ? STATUS_CFG[st].icon : Clock;
  const label    = st ? STATUS_CFG[st].label : "Belum Absen";

  return (
    <motion.div onClick={onClick}
      initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
      whileHover={{y:-4,scale:1.02}} whileTap={{scale:0.97}}
      transition={{duration:0.35,delay,ease:[0.16,1,0.3,1]}}
      className="relative flex h-44 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all"
      style={{
        background: gradient,
        outline: selected ? "3px solid white" : "3px solid transparent",
        boxShadow: selected
          ? "0 0 0 5px rgba(255,255,255,0.30),0 8px 32px rgba(0,0,0,0.18)"
          : "0 4px 16px rgba(0,0,0,0.10)",
      }}>
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10"/>
      <div className="pointer-events-none absolute -bottom-4 right-12 h-20 w-20 rounded-full bg-white/8"/>

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Hari ke-{tahapan.hariKe}</p>
          <p className="mt-0.5 text-sm font-bold text-white">{tahapan.lokasi}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Monitor size={16} className="text-white"/>
        </div>
      </div>

      <div className="relative">
        <p className="text-base font-extrabold text-white leading-tight">{tahapan.judul}</p>
        <p className="text-[11px] text-white/70 mt-1">{formatTgl(tahapan.tanggal)}</p>
      </div>

      <div className="relative flex items-end justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1">
          <Icon size={11} className="text-white"/>
          <span className="text-[11px] font-bold text-white">{label}</span>
        </div>
        {statusAbsensi?.record?.waktuAbsen && (
          <span className="font-mono text-[11px] font-semibold text-white/80">
            {statusAbsensi.record.waktuAbsen}
          </span>
        )}
      </div>

      {selected && (
        <div className="absolute top-3 right-3 rounded-full bg-white/30 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
          Dipilih
        </div>
      )}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SiswaUkkAbsensiPage() {
  const toast = useToast();

  const [tahapanList,  setTahapanList]  = useState<Tahapan[]>([]);
  const [statusMap,    setStatusMap]    = useState<Record<string, AbsensiStatus>>({});
  const [selectedId,   setSelectedId]   = useState<string>("");
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // Form fields
  const [catatan,      setCatatan]      = useState("");
  const [ttd,          setTtd]          = useState("");
  const [lokasi,       setLokasi]       = useState("");
  const [fotoFile,     setFotoFile]     = useState<File | null>(null);
  const [fotoPreview,  setFotoPreview]  = useState<string>("");
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetch("/api/ujian-ukk/tahapan/saya").then(r => r.json());
      const tasks: Tahapan[] = (Array.isArray(raw) ? raw : []).filter((x: any) => x.hariKe !== 0);
      setTahapanList(tasks);
      if (tasks.length > 0) setSelectedId(prev => prev || tasks[0].id);

      if (tasks.length > 0) {
        const statuses = await Promise.all(
          tasks.map(t => fetch(`/api/ujian-ukk/absensi/saya?tahapanId=${t.id}`).then(r => r.json()).catch(() => null))
        );
        const map: Record<string, AbsensiStatus> = {};
        tasks.forEach((t, i) => { if (statuses[i]) map[t.id] = statuses[i]; });
        setStatusMap(map);
      }
    } catch {
      toast.error("Gagal memuat data", "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-detect lokasi saat form terbuka
  useEffect(() => {
    if (!showForm || lokasi) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setLokasi(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
      () => {},
    );
  }, [showForm]);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setCatatan(""); setTtd(""); setLokasi("");
    setFotoFile(null); setFotoPreview("");
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  }

  async function handleAbsen() {
    if (!selectedId) return;
    if (!ttd) { toast.error("Tanda tangan wajib diisi", ""); return; }
    setSubmitting(true);

    const waktuAbsen = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const fd = new FormData();
    fd.append("tahapanId", selectedId);
    fd.append("waktuAbsen", waktuAbsen);
    if (lokasi)   fd.append("lokasi",  lokasi);
    if (catatan)  fd.append("catatan", catatan);
    if (ttd)      fd.append("ttd",     ttd);
    if (fotoFile) fd.append("foto",    fotoFile);

    try {
      const r = await fetch("/api/ujian-ukk/absensi/saya", { method: "POST", body: fd });
      if (r.ok) {
        toast.success("Absensi berhasil!", "Kehadiran kamu sudah tercatat.");
        setShowForm(false);
        resetForm();
        load();
      } else {
        const err = await r.json().catch(() => null);
        toast.error("Gagal absen", err?.message ?? "Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedTahapan = tahapanList.find(t => t.id === selectedId);
  const selectedStatus  = statusMap[selectedId];
  const sudahAbsen      = selectedStatus?.sudahAbsen ?? false;

  // Rekap keseluruhan across all sessions
  const rekapTotal = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0, BELUM: 0 };
  tahapanList.forEach(t => {
    const s = statusMap[t.id];
    if (!s?.sudahAbsen) rekapTotal.BELUM++;
    else if (s.status && s.status in rekapTotal) (rekapTotal as any)[s.status]++;
    else rekapTotal.BELUM++;
  });

  // ── Stats header pills ─────────────────────────────────────────────────────
  const headerStats = [
    { label: "Sesi",   val: tahapanList.length,    clr: "rgba(255,255,255,0.9)"  },
    { label: "Hadir",  val: rekapTotal.HADIR,       clr: "#86EFAC" },
    { label: "Belum",  val: rekapTotal.BELUM,       clr: "#FCA5A5" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-500"/>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6"
        style={{background:"linear-gradient(135deg,#059669 0%,#10B981 40%,#34D399 80%,#6EE7B7 100%)"}}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10"/>
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8"/>
        <div className="pointer-events-none absolute bottom-4 -left-6 h-24 w-24 rounded-full bg-white/6"/>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ClipboardCheck size={26} className="text-white"/>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ujian Kompetensi Keahlian</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Siswa</span>
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi UKK</h1>
              <p className="mt-0.5 text-sm text-white/70">Lakukan absensi dan pantau rekap kehadiranmu</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {headerStats.map(s => (
              <div key={s.label} className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/15 min-w-14">
                <span className="text-xl font-black leading-none" style={{color: s.clr}}>{s.val}</span>
                <span className="text-[10px] font-semibold text-white/60 mt-0.5">{s.label}</span>
              </div>
            ))}
            <LiveClock />
          </div>
        </div>
      </div>

      {tahapanList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
            <ClipboardCheck size={28} className="text-slate-300 dark:text-slate-500"/>
          </div>
          <p className="text-base font-semibold text-slate-500 dark:text-slate-400">Belum ada sesi UKK yang ditugaskan</p>
          <p className="text-sm text-slate-400">Hubungi admin untuk mendapatkan assignment sesi UKK</p>
        </div>
      ) : (
        <>
          {/* Sesi cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tahapanList.map((t, i) => (
              <SiswaLabCard key={t.id} tahapan={t} statusAbsensi={statusMap[t.id]}
                selected={t.id === selectedId} onClick={() => { setSelectedId(t.id); setShowForm(false); }}
                delay={0.05 + i * 0.05} index={i}/>
            ))}
          </div>

          {/* Rekap chips keseluruhan */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["HADIR","IZIN","SAKIT","ALPA"] as StatusAbsensi[]).map(key => {
              const cfg  = STATUS_CFG[key];
              const Icon = cfg.icon;
              const count = (rekapTotal as any)[key] as number;
              const pct  = tahapanList.length > 0 ? Math.round(count / tahapanList.length * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm"
                  style={{backgroundColor: cfg.bg}}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{backgroundColor: cfg.darkBg}}>
                    <Icon size={20} style={{color:cfg.clr}}/>
                  </div>
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="text-2xl font-black leading-none" style={{color:cfg.clr}}>{count}</span>
                    <span className="text-sm font-bold" style={{color:cfg.clr}}>{cfg.label}</span>
                  </div>
                  <div className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold"
                    style={{backgroundColor: cfg.darkBg, color: cfg.clr}}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail sesi terpilih */}
          {selectedTahapan && (
            <div className="space-y-4">
              {/* Info sesi banner */}
              <div className="relative overflow-hidden rounded-2xl shadow-lg"
                style={{background: CARD_GRADIENTS_BY_STATUS[selectedStatus?.status ?? "BELUM"]}}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10"/>
                <div className="relative px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 shadow-sm">
                        <Monitor size={22} className="text-white"/>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">Sesi Aktif</p>
                        <p className="text-lg font-extrabold leading-tight text-white">{selectedTahapan.judul}</p>
                      </div>
                    </div>
                    {sudahAbsen ? (
                      <div className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm">
                        <CheckCircle2 size={16} className="text-white"/>
                        <span className="text-sm font-extrabold text-white">Sudah Absen</span>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white/20 px-3 py-2 text-sm font-extrabold text-white backdrop-blur-sm">
                        Belum Absen
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { Icon: CalendarDays, label:"Tanggal", val: formatTgl(selectedTahapan.tanggal) },
                      { Icon: Clock,        label:"Jam",     val: `${selectedTahapan.jamMulai} – ${selectedTahapan.jamSelesai}` },
                      { Icon: MapPin,       label:"Lokasi",  val: selectedTahapan.lokasi },
                      { Icon: User,         label:"Penguji", val: selectedTahapan.penguji ?? "—" },
                    ].map(({ Icon, label, val }) => (
                      <div key={label} className="flex items-start gap-2.5 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                          <Icon size={13} className="text-white"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">{label}</p>
                          <p className="mt-0.5 truncate text-sm font-bold text-white">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sudah absen → tampilkan rekap personal */}
              {sudahAbsen && selectedStatus?.record ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"
                    style={{background:"linear-gradient(135deg,rgba(16,185,129,0.06),rgba(52,211,153,0.06))"}}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-emerald-500"/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Kehadiran Tercatat</p>
                        <p className="text-xs text-slate-400">Data absensimu sudah masuk ke sistem</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                        <p className="text-sm font-extrabold text-emerald-600">{selectedStatus.record.status ?? "HADIR"}</p>
                      </div>
                      {selectedStatus.record.waktuAbsen && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Waktu Absen</p>
                          <p className="font-mono text-xl font-extrabold text-slate-800 dark:text-slate-100">{selectedStatus.record.waktuAbsen}</p>
                        </div>
                      )}
                      {selectedStatus.record.lokasi && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Lokasi</p>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{selectedStatus.record.lokasi}</p>
                        </div>
                      )}
                    </div>
                    {selectedStatus.record.catatan && (
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Keterangan</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{selectedStatus.record.catatan}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedStatus.record.foto && (
                        <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <Camera size={10}/> Foto Selfie
                            </p>
                          </div>
                          <img src={selectedStatus.record.foto} alt="Foto selfie"
                            className="w-full max-h-48 object-cover"/>
                        </div>
                      )}
                      {selectedStatus.record.ttd && (
                        <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <Pen size={10}/> Tanda Tangan
                            </p>
                            <button onClick={() => {
                              const a = document.createElement("a");
                              a.href = selectedStatus.record!.ttd!;
                              a.download = "ttd-saya.png"; a.click();
                            }} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600">
                              <Download size={10}/> Simpan
                            </button>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3 flex justify-center">
                            <img src={selectedStatus.record.ttd} alt="TTD"
                              className="max-h-24 object-contain"/>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : !sudahAbsen ? (
                /* Belum absen → tombol / form absen */
                <AnimatePresence mode="wait">
                  {!showForm ? (
                    <motion.div key="prompt"
                      initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 text-center shadow-sm">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
                        <ClipboardCheck size={32} className="text-white"/>
                      </div>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Belum Absen</p>
                      <p className="text-sm text-slate-400 mb-6">Kamu wajib absen sebelum memulai ujian UKK</p>
                      <button onClick={() => setShowForm(true)}
                        className="px-10 py-3 rounded-xl text-sm font-bold text-white w-full max-w-xs transition-all hover:brightness-95 hover:scale-[1.02] active:scale-[0.98]"
                        style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
                        Absen Sekarang
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="form"
                      initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

                      {/* Form header */}
                      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between"
                        style={{background:"linear-gradient(135deg,rgba(16,185,129,0.06),rgba(52,211,153,0.06))"}}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <ClipboardCheck size={15} className="text-emerald-500"/>
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Form Absensi</p>
                        </div>
                        <button onClick={() => { setShowForm(false); resetForm(); }}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={13}/>
                        </button>
                      </div>

                      <div className="p-5 space-y-5">
                        {/* Foto Selfie */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Foto Selfie <span className="text-slate-300 font-normal normal-case">(opsional)</span>
                          </label>
                          <input ref={fotoInputRef} type="file" accept="image/*" capture="user"
                            className="hidden" onChange={handleFotoChange}/>
                          {fotoPreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                              <img src={fotoPreview} alt="Preview" className="w-full max-h-52 object-cover"/>
                              <button type="button" onClick={() => { setFotoFile(null); setFotoPreview(""); if (fotoInputRef.current) fotoInputRef.current.value = ""; }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
                                <X size={14}/>
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => fotoInputRef.current?.click()}
                              className="w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                              <Camera size={28}/>
                              <span className="text-xs font-medium">Ambil Foto / Upload Gambar</span>
                            </button>
                          )}
                        </div>

                        {/* Lokasi */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Lokasi <span className="text-slate-300 font-normal normal-case">(terisi otomatis)</span>
                          </label>
                          <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                            <input value={lokasi} onChange={e => setLokasi(e.target.value)}
                              placeholder="Mendeteksi lokasi..."
                              className="w-full pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                          </div>
                        </div>

                        {/* Keterangan */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Keterangan <span className="text-slate-300 font-normal normal-case">(opsional)</span>
                          </label>
                          <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                            placeholder="Tambahkan keterangan jika perlu..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"/>
                        </div>

                        {/* Tanda Tangan */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Tanda Tangan <span className="text-rose-400 font-bold">*</span>
                          </label>
                          <SignaturePad value={ttd} onChange={setTtd}/>
                        </div>

                        {/* Submit */}
                        <button onClick={handleAbsen} disabled={submitting || !ttd}
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                          style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
                          <Send size={15}/>{submitting ? "Menyimpan..." : "Konfirmasi Absen"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
