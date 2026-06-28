"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, MapPin, Camera, PenTool, Download, ExternalLink,
  CheckCircle2, AlertCircle, Thermometer, MinusCircle, Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AbsensiDokumenData = {
  nama: string;
  nis: string;
  kelas: string;
  waktuAbsen: string | null;
  tanggal: string;
  lokasi: string | null;
  foto: string | null;
  ttd: string | null;
  status: string;
};

type Props = {
  siswa: AbsensiDokumenData;
  onClose: () => void;
};

// ─── Status themes ────────────────────────────────────────────────────────────

const STATUS_THEME: Record<string, {
  gradient: string; glow: string; icon: React.ElementType; label: string; ring: string;
}> = {
  HADIR: {
    gradient: "linear-gradient(135deg, #059669 0%, #10B981 60%, #6EE7B7 100%)",
    glow: "#10B981",
    icon: CheckCircle2,
    label: "Hadir",
    ring: "#10B981",
  },
  IZIN: {
    gradient: "linear-gradient(135deg, #4F46E5 0%, #6334F4 60%, #A78BFA 100%)",
    glow: "#6334F4",
    icon: AlertCircle,
    label: "Izin",
    ring: "#6334F4",
  },
  SAKIT: {
    gradient: "linear-gradient(135deg, #B45309 0%, #D97706 60%, #FCD34D 100%)",
    glow: "#D97706",
    icon: Thermometer,
    label: "Sakit",
    ring: "#D97706",
  },
  ALPA: {
    gradient: "linear-gradient(135deg, #B91C1C 0%, #EF4444 60%, #FCA5A5 100%)",
    glow: "#EF4444",
    icon: MinusCircle,
    label: "Alpa",
    ring: "#EF4444",
  },
};

const DEFAULT_THEME = STATUS_THEME.HADIR;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nama: string) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = ["#6334F4", "#EF4444", "#F59E0B", "#FF7867", "#10B981", "#3B82F6"];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) & 0x7fffffff);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatTanggal(raw: string) {
  const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function parseLokasi(raw: string | null): { lat: string; lng: string } | null {
  if (!raw) return null;
  const parts = raw.split(",");
  if (parts.length >= 2) return { lat: parts[0].trim(), lng: parts[1].trim() };
  return null;
}

// ─── Image overlay ────────────────────────────────────────────────────────────

function ImageOverlay({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-70 flex flex-col items-center justify-center bg-black/90 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] max-w-3xl flex-col items-center gap-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl" />
        <div className="flex gap-3">
          <button
            onClick={() => { const a = document.createElement("a"); a.href = src; a.download = label + ".jpg"; a.click(); }}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
          >
            <Download size={14} /> Download
          </button>
          <button onClick={onClose} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20">
            <X size={14} /> Tutup
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60"
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, label, color, action }: {
  icon: React.ElementType; label: string; color: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700/50">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: color + "18" }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      {action}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AbsensiDokumenModal({ siswa, onClose }: Props) {
  const [imgOverlay, setImgOverlay] = useState<{ src: string; label: string } | null>(null);

  const theme    = STATUS_THEME[siswa.status] ?? DEFAULT_THEME;
  const StatusIcon = theme.icon;
  const ac       = avatarColor(siswa.nama);
  const lokasi   = parseLokasi(siswa.lokasi);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const fotoSrc = siswa.foto
    ? siswa.foto.startsWith("data:") || siswa.foto.startsWith("blob:") ? siswa.foto : `${API}${siswa.foto}`
    : null;
  const ttdSrc = siswa.ttd
    ? siswa.ttd.startsWith("data:") ? siswa.ttd : `${API}${siswa.ttd}`
    : null;

  const hasMedia = fotoSrc || ttdSrc || lokasi;

  return (
    <>
      <AnimatePresence>
        {imgOverlay && (
          <ImageOverlay src={imgOverlay.src} label={imgOverlay.label} onClose={() => setImgOverlay(null)} />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal — horizontal layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative z-10 flex w-full max-w-3xl overflow-hidden rounded-t-3xl shadow-2xl sm:rounded-3xl"
          style={{ maxHeight: "88vh" }}
        >
          {/* ── Panel kiri: hero info ── */}
          <div
            className="relative flex w-64 shrink-0 flex-col overflow-hidden"
            style={{ background: theme.gradient }}
          >
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/8" />
            <div className="pointer-events-none absolute bottom-24 right-4 h-20 w-20 rounded-full bg-white/10" />

            {/* Close button */}
            <div className="relative flex justify-end p-4">
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              >
                <X size={15} />
              </button>
            </div>

            {/* Avatar + info — vertically centered */}
            <div className="relative flex flex-1 flex-col items-center justify-center px-5 pb-8 text-center">
              {/* Avatar with ring */}
              <div
                className="relative flex h-24 w-24 items-center justify-center rounded-full text-2xl font-extrabold text-white"
                style={{
                  backgroundColor: ac,
                  boxShadow: `0 0 0 5px rgba(255,255,255,0.25), 0 0 0 10px rgba(255,255,255,0.1), 0 16px 32px rgba(0,0,0,0.2)`,
                }}
              >
                {getInitials(siswa.nama)}
                {/* Status badge */}
                <div
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 shadow-lg"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                >
                  <StatusIcon size={15} className="text-white" />
                </div>
              </div>

              <h2 className="mt-5 text-base font-extrabold leading-tight text-white">{siswa.nama}</h2>
              {siswa.nis && <p className="mt-1 text-xs text-white/65">NIS {siswa.nis}</p>}

              {/* Status pill */}
              <div
                className="mt-3 rounded-full px-4 py-1.5 text-xs font-extrabold text-white"
                style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}
              >
                {theme.label}
              </div>

              {/* Kelas */}
              <div
                className="mt-2 rounded-full px-3 py-1 text-[11px] font-semibold text-white/80"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                {siswa.kelas}
              </div>

              {/* Divider */}
              <div className="my-5 h-px w-full bg-white/20" />

              {/* Tanggal */}
              <div className="w-full text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Tanggal</p>
                {(() => {
                  const d = new Date(siswa.tanggal.includes("T") ? siswa.tanggal : siswa.tanggal + "T00:00:00");
                  return (
                    <p className="mt-1 text-sm font-bold text-white">
                      {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  );
                })()}
              </div>

              {/* Waktu */}
              <div className="mt-4 w-full text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Waktu Absen</p>
                <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-white">
                  {siswa.waktuAbsen ?? "—"}
                </p>
                {siswa.waktuAbsen && (
                  <p className="text-[10px] font-semibold text-white/55">WIB</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Panel kanan: media ── */}
          <div className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-[#141b2d]">
            {/* Header kanan */}
            <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-700/40">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Dokumen Kehadiran
              </p>
            </div>

            {/* Scrollable media */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-3 p-4">

                {/* Foto Selfie */}
                {fotoSrc && (
                  <SectionCard delay={0.05}>
                    <SectionHeader
                      icon={Camera}
                      label="Foto Selfie"
                      color="#FF7867"
                      action={
                        <button
                          onClick={() => setImgOverlay({ src: fotoSrc, label: "foto-" + siswa.nama })}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        >
                          <ExternalLink size={10} /> Perbesar
                        </button>
                      }
                    />
                    <button
                      onClick={() => setImgOverlay({ src: fotoSrc, label: "foto-" + siswa.nama })}
                      className="group relative block w-full overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoSrc}
                        alt="Foto selfie"
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25">
                        <span className="scale-90 rounded-full bg-white/0 px-4 py-1.5 text-xs font-bold text-white/0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:bg-white/20 group-hover:opacity-100 group-hover:backdrop-blur-sm">
                          Lihat Penuh
                        </span>
                      </div>
                    </button>
                  </SectionCard>
                )}

                {/* Tanda Tangan */}
                {ttdSrc && (
                  <SectionCard delay={0.1}>
                    <SectionHeader
                      icon={PenTool}
                      label="Tanda Tangan Digital"
                      color="#6334F4"
                      action={
                        <button
                          onClick={() => setImgOverlay({ src: ttdSrc, label: "ttd-" + siswa.nama })}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        >
                          <Download size={10} /> Simpan
                        </button>
                      }
                    />
                    <div className="flex items-center justify-center bg-white p-4 dark:bg-slate-900/40">
                      <button
                        onClick={() => setImgOverlay({ src: ttdSrc, label: "ttd-" + siswa.nama })}
                        className="group relative w-full overflow-hidden rounded-xl border border-dashed border-slate-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ttdSrc}
                          alt="Tanda tangan"
                          className="h-20 w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                    </div>
                  </SectionCard>
                )}

                {/* Lokasi */}
                {lokasi && (
                  <SectionCard delay={0.15}>
                    <SectionHeader
                      icon={MapPin}
                      label="Lokasi Absensi"
                      color="#3B82F6"
                      action={
                        <a
                          href={`https://maps.google.com/maps?q=${lokasi.lat},${lokasi.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-500 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                        >
                          <ExternalLink size={10} /> Maps
                        </a>
                      }
                    />
                    <iframe
                      src={`https://maps.google.com/maps?q=${lokasi.lat},${lokasi.lng}&output=embed`}
                      className="h-40 w-full border-0"
                      loading="lazy"
                      title="Lokasi absensi"
                    />
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <MapPin size={11} className="shrink-0 text-blue-400" />
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {lokasi.lat}, {lokasi.lng}
                      </span>
                    </div>
                  </SectionCard>
                )}

                {/* Empty state */}
                {!hasMedia && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-3 py-16 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <Camera size={22} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada dokumen pendukung</p>
                  </motion.div>
                )}

                <div className="h-1" />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-700/40 dark:bg-[#141b2d]">
              <button
                onClick={onClose}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: theme.gradient }}
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
