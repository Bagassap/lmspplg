"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, CheckCircle2, MapPin, Camera, PenTool, Loader2,
  Clock, BookOpen, User, CreditCard, Trash2, AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

// ─── Types ────────────────────────────────────────────────────────────────────

type JadwalItem = {
  id: string;
  mataPelajaran: string;
  kelas: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
};

type SiswaInfo = {
  nama: string;
  nis: string;
  kelas: string;
};

type Props = {
  open: boolean;
  jadwal: JadwalItem | null;
  siswa: SiswaInfo | null;
  onClose: () => void;
  onSuccess: (jadwalKelasId: string) => void;
};

// ─── Image compression ────────────────────────────────────────────────────────

async function compressImage(file: File, maxSizeKB = 1024): Promise<File> {
  if (file.size <= maxSizeKB * 1024) return file;

  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await new Promise<void>((r) => { img.onload = () => r(); });

  let maxDim = 1280;
  let quality = 0.75;
  let result: Blob | null = null;

  while (maxDim >= 640 && quality >= 0.3) {
    const canvas = document.createElement("canvas");
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim; }
      else { width = Math.round(width * maxDim / height); height = maxDim; }
    }
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    result = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));

    if (result && result.size <= maxSizeKB * 1024) break;
    quality -= 0.1;
    if (quality < 0.3) { maxDim -= 256; quality = 0.7; }
  }

  URL.revokeObjectURL(url);
  return result
    ? new File([result], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })
    : file;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AbsensiModal({ open, jadwal, siswa, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [jam, setJam] = useState("");
  const [tanggal, setTanggal] = useState("");

  // GPS
  const [lokasi, setLokasi] = useState<string | null>(null);
  const [lokasiLoading, setLokasiLoading] = useState(false);
  const [lokasiError, setLokasiError] = useState<string | null>(null);

  // Foto
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [ttdEmpty, setTtdEmpty] = useState(true);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Live clock ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const now = new Date();
      setJam(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setTanggal(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  // ── Init/reset canvas when modal opens ───────────────────────────────────

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (open) {
      setLokasi(null); setLokasiError(null); setLokasiLoading(false);
      setFoto(null); setFotoPreview(null);
      setTtdEmpty(true); setSubmitError(null);
      // Init canvas after it renders
      requestAnimationFrame(() => initCanvas());
    }
  }, [open, initCanvas]);

  // ── GPS ───────────────────────────────────────────────────────────────────

  function ambilLokasi() {
    if (!navigator.geolocation) {
      setLokasiError("Browser tidak mendukung geolocation");
      return;
    }
    setLokasiLoading(true);
    setLokasiError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLokasi(`${lat},${lng}`);
        setLokasiLoading(false);
      },
      (err) => {
        setLokasiError(err.message || "Gagal mendapatkan lokasi");
        setLokasiLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  // ── Foto ──────────────────────────────────────────────────────────────────

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setFoto(compressed);
    setFotoPreview(URL.createObjectURL(compressed));
    e.target.value = "";
  }

  // ── Signature pad ─────────────────────────────────────────────────────────

  function getCanvasPos(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(canvas, clientX, clientY);
    setTtdEmpty(false);
  }

  function draw(clientX: number, clientY: number) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getCanvasPos(canvas, clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  }

  function endDraw() { isDrawingRef.current = false; }

  function clearCanvas() {
    initCanvas();
    setTtdEmpty(true);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const canSubmit = !submitting && !!lokasi && !!foto && !ttdEmpty && !!jadwal;

  async function handleSubmit() {
    if (!canSubmit || !jadwal) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Get TTD as base64 dataURL from canvas
      const ttdDataUrl = canvasRef.current?.toDataURL("image/png") ?? "";

      // Validasi total size dokumen sebelum kirim
      const ttdSizeBytes = (ttdDataUrl.length * 3) / 4;
      const fotoSizeBytes = foto?.size ?? 0;
      if (fotoSizeBytes + ttdSizeBytes > 2 * 1024 * 1024) {
        setSubmitError("Total ukuran dokumen melebihi 2MB. Coba ambil foto ulang dengan kualitas lebih rendah.");
        setSubmitting(false);
        return;
      }

      // Get current time for waktuAbsen
      const now = new Date();
      const waktuAbsen = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      const fd = new FormData();
      fd.append("jadwalKelasId", jadwal.id);
      fd.append("lokasi", lokasi!);
      fd.append("waktuAbsen", waktuAbsen);
      fd.append("ttd", ttdDataUrl);
      if (foto) fd.append("foto", foto);

      const res = await fetch("/api/absensi-kelas/saya", { method: "POST", body: fd });
      if (res.ok) {
        toast.success(
          "Absensi berhasil dikirim!",
          `Kehadiran kamu di ${jadwal.mataPelajaran} sudah tercatat.`,
        );
        onSuccess(jadwal.id);
        onClose();
      } else {
        const err = await res.json().catch(() => null);
        const msg = err?.message ?? "Gagal mengirim absensi";
        setSubmitError(msg);
        toast.error("Gagal mengirim absensi", msg);
      }
    } catch {
      const msg = "Gagal terhubung ke server";
      setSubmitError(msg);
      toast.error("Koneksi bermasalah", msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, #6334F4, #977DFF)" }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <BookOpen size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white">Absensi Kelas</p>
                <p className="truncate text-xs text-white/75">
                  {jadwal?.mataPelajaran} · {jadwal?.jamMulai}–{jadwal?.jamSelesai}
                </p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">

              {/* Live date + time */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-400">Tanggal</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{tanggal}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-400">Jam</p>
                  <p className="font-mono text-xl font-extrabold text-[#6334F4]">{jam}</p>
                </div>
              </div>

              {/* Info siswa */}
              {siswa && (
                <div className="rounded-xl border border-gray-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-700/30">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400">Data Siswa</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="shrink-0 text-[#977DFF]" />
                      <div>
                        <p className="text-[10px] text-gray-400">Nama</p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-white">{siswa.nama}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={12} className="shrink-0 text-[#977DFF]" />
                      <div>
                        <p className="text-[10px] text-gray-400">NIS</p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-white">{siswa.nis}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={12} className="shrink-0 text-[#977DFF]" />
                      <div>
                        <p className="text-[10px] text-gray-400">Kelas</p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-white">{siswa.kelas}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GPS */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-200">
                  <MapPin size={13} className="text-[#0033FF]" />
                  Lokasi <span className="text-red-400">*</span>
                </p>
                {lokasi ? (
                  <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 dark:bg-green-900/20">
                    <CheckCircle2 size={14} className="shrink-0 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400">Lokasi terdeteksi ✓</p>
                      <p className="font-mono text-[10px] text-green-600/80 dark:text-green-500">{lokasi}</p>
                    </div>
                    <button onClick={() => setLokasi(null)} className="text-green-500 hover:text-green-700">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={ambilLokasi}
                      disabled={lokasiLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0033FF]/25 py-2.5 text-sm font-bold text-[#0033FF] transition-all hover:border-[#0033FF]/50 hover:bg-[#0033FF]/5 disabled:opacity-60"
                    >
                      {lokasiLoading ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                      {lokasiLoading ? "Mendapatkan lokasi…" : "Ambil Lokasi GPS"}
                    </motion.button>
                    {lokasiError && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle size={11} />{lokasiError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Foto selfie */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-200">
                  <Camera size={13} className="text-[#FF7867]" />
                  Foto Selfie <span className="text-red-400">*</span>
                </p>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFotoChange}
                />
                {fotoPreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fotoPreview} alt="Foto selfie" className="h-40 w-full object-cover" />
                    <button
                      onClick={() => { setFoto(null); setFotoPreview(null); }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="absolute bottom-2 left-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      ✓ Foto diambil
                    </div>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => fotoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#FF7867]/25 py-2.5 text-sm font-bold text-[#FF7867] transition-all hover:border-[#FF7867]/50 hover:bg-[#FF7867]/5"
                  >
                    <Camera size={15} />
                    Ambil Foto Selfie
                  </motion.button>
                )}
              </div>

              {/* Signature pad */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-200">
                    <PenTool size={13} className="text-[#977DFF]" />
                    Tanda Tangan <span className="text-red-400">*</span>
                  </p>
                  {!ttdEmpty && (
                    <button onClick={clearCanvas} className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-red-500">
                      <Trash2 size={11} /> Hapus
                    </button>
                  )}
                </div>
                <div className={`overflow-hidden rounded-xl border-2 ${ttdEmpty ? "border-dashed border-gray-200 dark:border-slate-600" : "border-[#977DFF]/40"}`}>
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={150}
                    className="w-full cursor-crosshair"
                    style={{ touchAction: "none", display: "block" }}
                    onMouseDown={(e) => startDraw(e.clientX, e.clientY)}
                    onMouseMove={(e) => draw(e.clientX, e.clientY)}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={(e) => { e.preventDefault(); startDraw(e.touches[0].clientX, e.touches[0].clientY); }}
                    onTouchMove={(e) => { e.preventDefault(); draw(e.touches[0].clientX, e.touches[0].clientY); }}
                    onTouchEnd={endDraw}
                  />
                  {ttdEmpty && (
                    <div className="pointer-events-none absolute -mt-10 flex h-10 w-full items-center justify-center" />
                  )}
                </div>
                {ttdEmpty && (
                  <p className="mt-1 text-center text-[11px] text-gray-400 dark:text-slate-500">
                    Tanda tangan di area abu-abu di atas
                  </p>
                )}
              </div>

              {/* Error */}
              {submitError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-2 pb-1">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <motion.button
                  whileHover={canSubmit ? { scale: 1.02, boxShadow: "0 6px 20px #6334F445" } : undefined}
                  whileTap={canSubmit ? { scale: 0.97 } : undefined}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: "#6334F4" }}
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" />Mengirim…</>
                  ) : (
                    <><CheckCircle2 size={15} />Kirim Absensi</>
                  )}
                </motion.button>
              </div>

              {/* Required hint */}
              {(!lokasi || !foto || ttdEmpty) && (
                <p className="text-center text-[10px] text-gray-400 dark:text-slate-500">
                  Wajib: {[!lokasi && "Lokasi GPS", !foto && "Foto Selfie", ttdEmpty && "Tanda Tangan"].filter(Boolean).join(" · ")}
                </p>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
