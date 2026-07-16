"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Download, Camera, PenTool, ExternalLink,
} from "lucide-react";
import type { SiswaAbsensi, StatusAbsensi } from "./types";
import { STATUS_CFG, PULANG_CFG, BRAND_GRADIENT, formatTgl, getInitials, avatarColor, parseLokasi, resolveMediaSrc } from "./shared";

export function DokumenModal({ siswa, tanggal, kelas, onClose, source = "hadir" }: {
  siswa: SiswaAbsensi; tanggal: string; kelas: string; onClose: () => void; source?: "hadir" | "pulang";
}) {
  const [imgOverlay, setImgOverlay] = useState<string | null>(null);
  const isPulang = source === "pulang";
  const rawLokasi = isPulang ? siswa.lokasiPulang : siswa.lokasi;
  const lokasi = parseLokasi(rawLokasi);
  const fotoSrc = resolveMediaSrc(isPulang ? siswa.fotoPulang : siswa.foto);
  const ttdSrc = (isPulang ? siswa.ttdPulang : siswa.ttd) ?? null;
  const waktu = isPulang ? siswa.waktuPulang : siswa.waktuAbsen;
  const catatan = isPulang ? siswa.catatanPulang : siswa.catatan;
  const status = (siswa.status ?? "HADIR") as StatusAbsensi;
  const theme = isPulang ? PULANG_CFG : STATUS_CFG[status];
  const ThemeIcon = theme.icon;
  const ac = avatarColor(siswa.nama);

  return (
    <>
      <AnimatePresence>
        {imgOverlay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 flex flex-col items-center justify-center bg-black/90 p-4"
            onClick={() => setImgOverlay(null)}>
            <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] max-w-3xl flex-col items-center gap-4">
              <img src={imgOverlay} alt="Dokumen" className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl" />
              <div className="flex gap-3">
                <button onClick={() => { const a = document.createElement("a"); a.href = imgOverlay; a.download = "dok-" + siswa.nama + ".png"; a.click(); }}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                  <Download size={14} /> Download
                </button>
                <button onClick={() => setImgOverlay(null)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                  <X size={14} /> Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative z-10 flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-3xl shadow-2xl sm:flex-row sm:overflow-hidden sm:rounded-3xl">

          <div className="relative flex shrink-0 flex-col overflow-hidden sm:w-60"
            style={{ background: BRAND_GRADIENT }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
            <div className="relative flex justify-end p-4">
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <X size={15} />
              </button>
            </div>
            <div className="relative flex flex-1 flex-col items-center justify-center px-5 pb-8 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full text-xl font-extrabold text-white"
                style={{ backgroundColor: ac, boxShadow: "0 0 0 4px rgba(255,255,255,0.25),0 12px 24px rgba(0,0,0,0.2)" }}>
                {getInitials(siswa.nama)}
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 shadow-lg">
                  <ThemeIcon size={13} className="text-white" />
                </div>
              </div>
              <h2 className="mt-4 text-sm font-extrabold leading-tight text-white">{siswa.nama}</h2>
              <div className="mt-2 rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: "rgba(255,255,255,0.22)" }}>
                {theme.label}
              </div>
              <div className="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white/80" style={{ background: "rgba(255,255,255,0.12)" }}>
                {kelas}
              </div>
              <div className="my-4 h-px w-full bg-white/20" />
              <div className="w-full text-left space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Tanggal</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{formatTgl(tanggal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">{isPulang ? "Waktu Pulang" : "Waktu Absen"}</p>
                  <p className="mt-0.5 font-mono text-2xl font-extrabold text-white">{waktu ?? "—"}</p>
                </div>
                {catatan && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Keterangan</p>
                    <p className="mt-0.5 text-xs text-white/90 leading-relaxed">{catatan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-[#141b2d]">
            <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700/40 dark:bg-[#141b2d]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dokumen Kehadiran</p>
            </div>
            <div className="flex-1 sm:min-h-0 sm:overflow-y-auto">
              <div className="space-y-3 p-4">
                {fotoSrc && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#EF444418" }}>
                        <Camera size={13} style={{ color: "#EF4444" }} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Foto Selfie</span>
                    </div>
                    <button onClick={() => setImgOverlay(fotoSrc)} className="group block w-full overflow-hidden">
                      <img src={fotoSrc} alt="Foto selfie" className="w-full max-h-52 object-cover group-hover:brightness-90 transition-all duration-200" />
                    </button>
                  </div>
                )}
                {ttdSrc && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#6334F418" }}>
                          <PenTool size={13} style={{ color: "#6334F4" }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tanda Tangan Digital</span>
                      </div>
                      <button onClick={() => setImgOverlay(ttdSrc)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-200">
                        <Download size={10} /> Simpan
                      </button>
                    </div>
                    <div className="flex items-center justify-center bg-white dark:bg-slate-900/40 p-4">
                      <button onClick={() => setImgOverlay(ttdSrc)}
                        className="group relative w-full overflow-hidden rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:shadow-md transition-shadow">
                        <img src={ttdSrc} alt="TTD" className="h-20 w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                )}
                {lokasi && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#3B82F618" }}>
                          <MapPin size={13} style={{ color: "#3B82F6" }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lokasi Absensi</span>
                      </div>
                      <a href={`https://maps.google.com/maps?q=${lokasi.lat},${lokasi.lng}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-[10px] font-bold text-blue-500 hover:bg-blue-100">
                        <ExternalLink size={10} /> Maps
                      </a>
                    </div>
                    <iframe src={`https://maps.google.com/maps?q=${lokasi.lat},${lokasi.lng}&output=embed`}
                      className="h-40 w-full border-0" loading="lazy" title="Lokasi" />
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <MapPin size={11} className="shrink-0 text-blue-400" />
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{lokasi.lat}, {lokasi.lng}</span>
                    </div>
                  </div>
                )}
                {rawLokasi && !lokasi && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Lokasi Absensi</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{rawLokasi}</p>
                  </div>
                )}
                {!fotoSrc && !ttdSrc && !rawLokasi && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <PenTool size={22} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada dokumen pendukung</p>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-700/40 dark:bg-[#141b2d]">
              <button onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
                style={{ background: BRAND_GRADIENT }}>
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
