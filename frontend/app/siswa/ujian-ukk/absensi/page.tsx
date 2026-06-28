"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, Clock, MapPin, User, CheckCircle,
  Pen, X, RotateCcw, Send, Camera, ImagePlus,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

// ── Types ──────────────────────────────────────────────────────────────────────
type Tahapan = {
  id: string; judul: string; tanggal: string;
  jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string;
};

type AbsensiStatus = {
  sudahAbsen: boolean;
  status: string | null;
  tanggal: string;
  record?: {
    status?: string; waktuAbsen?: string; lokasi?: string; catatan?: string; ttd?: string; foto?: string;
  };
};

function formatTgl(tgl?: string) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
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
      e.preventDefault();
      drawing.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const onEnd = () => {
      drawing.current = false;
      onChange(canvas.toDataURL());
    };

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
      <div className="relative rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 overflow-hidden">
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SiswaUkkAbsensiPage() {
  const toast = useToast();

  const [tahapan,   setTahapan]   = useState<Tahapan | null>(null);
  const [absensi,   setAbsensi]   = useState<AbsensiStatus | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [catatan,     setCatatan]     = useState("");
  const [ttd,         setTtd]         = useState("");
  const [lokasi,      setLokasi]      = useState("");
  const [fotoFile,    setFotoFile]    = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Ambil task siswa (1 task pertama) lalu cek status absensi
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await fetch("/api/ujian-ukk/tahapan").then(r => r.json());
      const tasks: Tahapan[] = (Array.isArray(t) ? t : []).filter((x: any) => x.hariKe !== 0);
      const myTask = tasks[0] ?? null;
      setTahapan(myTask);

      if (myTask) {
        const s = await fetch(`/api/ujian-ukk/absensi/saya?tahapanId=${myTask.id}`).then(r => r.json());
        setAbsensi(s);
      }
    } catch {
      toast.error("Gagal memuat data", "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-detect lokasi
  useEffect(() => {
    if (!showForm) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLokasi(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
      () => {},
    );
  }, [showForm]);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAbsen() {
    if (!tahapan) return;
    if (!ttd) { toast.error("Tanda tangan wajib diisi", ""); return; }
    setSubmitting(true);

    const waktuAbsen = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const fd = new FormData();
    fd.append("tahapanId", tahapan.id);
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
        load();
      } else {
        toast.error("Gagal absen", "Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-500"/>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
          <ClipboardCheck size={18} className="text-white"/>
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Absensi UKK</h1>
          <p className="text-xs text-slate-400">{today}</p>
        </div>
      </div>

      {!tahapan ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-10 text-center shadow-sm">
          <ClipboardCheck size={36} className="mx-auto mb-3 text-slate-200"/>
          <p className="text-sm text-slate-400">Belum ada sesi UKK yang ditugaskan</p>
        </div>
      ) : (
        <>
          {/* Info sesi */}
          <div className="rounded-2xl overflow-hidden shadow-sm"
            style={{background: absensi?.sudahAbsen
              ? "linear-gradient(135deg,#10B981,#059669)"
              : "linear-gradient(135deg,#6366F1,#4F46E5)"}}>
            <div className="relative px-5 py-5">
              <div className="pointer-events-none absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10"/>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Sesi UKK Kamu</p>
              <p className="text-lg font-extrabold text-white mb-3">{tahapan.judul}</p>
              <div className="flex flex-wrap gap-3 text-[11px] text-white/80">
                <span className="flex items-center gap-1"><CalendarDays size={11}/>{formatTgl(tahapan.tanggal)}</span>
                <span className="flex items-center gap-1"><Clock size={11}/>{tahapan.jamMulai}–{tahapan.jamSelesai}</span>
                <span className="flex items-center gap-1"><MapPin size={11}/>{tahapan.lokasi}</span>
                {tahapan.penguji && <span className="flex items-center gap-1"><User size={11}/>{tahapan.penguji}</span>}
              </div>
            </div>
          </div>

          {/* Status absensi */}
          {absensi?.sudahAbsen ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle size={18} className="text-emerald-500"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Sudah Absen</p>
                    <p className="text-xs text-slate-400">Kehadiran kamu sudah tercatat hari ini</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-600">{absensi.record?.status ?? "HADIR"}</span>
                </div>
                {absensi.record?.waktuAbsen && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Waktu Absen</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{absensi.record.waktuAbsen}</span>
                  </div>
                )}
                {absensi.record?.lokasi && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lokasi</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[60%] truncate">{absensi.record.lokasi}</span>
                  </div>
                )}
                {absensi.record?.catatan && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Keterangan</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{absensi.record.catatan}</p>
                  </div>
                )}
                {absensi.record?.foto && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Foto Selfie</p>
                    <img src={absensi.record.foto} alt="Foto selfie" className="rounded-xl border border-slate-100 w-full max-h-52 object-cover"/>
                  </div>
                )}
                {absensi.record?.ttd && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Tanda Tangan</p>
                    <img src={absensi.record.ttd} alt="TTD" className="rounded-xl border border-slate-100 bg-white w-full max-h-24 object-contain"/>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Tombol absen */}
              {!showForm ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
                    <ClipboardCheck size={28} className="text-white"/>
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Belum Absen</p>
                  <p className="text-xs text-slate-400 mb-5">Lakukan absensi sebelum memulai ujian</p>
                  <button onClick={() => setShowForm(true)}
                    className="px-8 py-3 rounded-xl text-sm font-bold text-white w-full transition-all hover:brightness-95"
                    style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
                    Absen Sekarang
                  </button>
                </div>
              ) : (
                /* Form absensi */
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between"
                    style={{background:"linear-gradient(135deg,rgba(16,185,129,0.06),rgba(99,102,241,0.06))"}}>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Form Absensi</p>
                    <button onClick={() => setShowForm(false)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600">
                      <X size={13}/>
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Foto Selfie */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Foto Selfie <span className="text-slate-300 font-normal normal-case">(opsional)</span>
                      </label>
                      <input
                        ref={fotoInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={handleFotoChange}
                      />
                      {fotoPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                          <img src={fotoPreview} alt="Foto selfie" className="w-full max-h-52 object-cover"/>
                          <button type="button" onClick={() => { setFotoFile(null); setFotoPreview(""); if (fotoInputRef.current) fotoInputRef.current.value = ""; }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
                            <X size={12}/>
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => fotoInputRef.current?.click()}
                          className="w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                          <Camera size={24}/>
                          <span className="text-xs font-medium">Ambil Foto / Upload Gambar</span>
                        </button>
                      )}
                    </div>

                    {/* Lokasi */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Lokasi <span className="text-slate-300 font-normal normal-case">(opsional — terisi otomatis)</span>
                      </label>
                      <input value={lokasi} onChange={e => setLokasi(e.target.value)}
                        placeholder="Koordinat atau nama lokasi..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                    </div>

                    {/* Keterangan */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Keterangan <span className="text-slate-300 font-normal normal-case">(opsional)</span>
                      </label>
                      <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                        placeholder="Tambahkan keterangan jika perlu..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"/>
                    </div>

                    {/* Tanda Tangan */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Tanda Tangan <span className="text-rose-400">*</span>
                      </label>
                      <SignaturePad value={ttd} onChange={setTtd}/>
                    </div>

                    {/* Submit */}
                    <button onClick={handleAbsen} disabled={submitting || !ttd}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-95 disabled:opacity-50"
                      style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
                      <Send size={14}/>{submitting ? "Menyimpan..." : "Konfirmasi Absen"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
