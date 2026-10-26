"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, Upload, RotateCcw, ImagePlus, X, Camera } from "lucide-react";
import { getCroppedImg } from "@/lib/getCroppedImg";
import { compressToMaxBytes, describePhotoError } from "@/lib/compressImage";

const MAX_UPLOAD_BYTES = 1024 * 1024;

export function ChangeFotoProfilModal({ onClose, gradient }: { onClose: () => void; gradient: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format file harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }

    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!imageSrc || !croppedAreaPixels || loading) return;
    setLoading(true);
    setError(null);

    let file: File;
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
      file = await compressToMaxBytes(cropped, MAX_UPLOAD_BYTES);
    } catch {
      setError(describePhotoError().detail);
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("foto", file);

      const res = await fetch("/api/auth/foto-profil", { method: "PATCH", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Gagal menyimpan foto profil.");
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
      setLoading(false);
    }
  }

  const modal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
        <motion.div
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-[#1E293B] sm:rounded-3xl"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="app-sheet-header flex items-center justify-between px-6 py-4" style={{ background: gradient }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <Camera size={15} className="text-white" />
              </div>
              <h2 className="text-base font-semibold text-white">Ganti Foto Profil</h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-50"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFile}
            />

            {!imageSrc ? (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#F1EDFA] px-4 py-7 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><ImagePlus size={20} className="text-[#3E03B3]" /></span>
                  <span className="text-sm font-bold text-slate-900">Galeri</span>
                  <span className="text-[11px] text-slate-600">Pilih dari galeri</span>
                </button>
                <button type="button" onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#F1EDFA] px-4 py-7 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><Camera size={20} className="text-[#3E03B3]" /></span>
                  <span className="text-sm font-bold text-slate-900">Kamera</span>
                  <span className="text-[11px] text-slate-600">Ambil foto langsung</span>
                </button>
                <p className="col-span-2 text-center text-[11px] text-slate-600">JPG, PNG, atau WEBP — maksimal 5MB</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-black/90">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex items-center gap-3 px-1">
                  <span className="shrink-0 text-xs font-medium text-black/50">Perbesar</span>
                  <input
                    type="range" min={1} max={3} step={0.01} value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#3E03B3]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setImageSrc(null); setCroppedAreaPixels(null); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-black/60 transition-colors hover:bg-slate-200"
                >
                  <RotateCcw size={14} />
                  Pilih Ulang
                </button>
              </div>
            )}

            {error && <p className="text-xs text-[#5D900F] dark:text-[#C4B5FD]">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-700/50">
            <button onClick={onClose} disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
              Batal
            </button>
            <motion.button
              onClick={handleSubmit}
              disabled={!imageSrc || !croppedAreaPixels || loading}
              whileHover={imageSrc ? { scale: 1.03 } : undefined}
              whileTap={imageSrc ? { scale: 0.97 } : undefined}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: gradient }}
            >
              {loading
                ? <Loader2 size={15} className="animate-spin" />
                : <Upload size={15} />}
              Simpan
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}
