"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, Clock, MapPin, User,
  CheckCircle2, MinusCircle, AlertCircle, Thermometer,
  Monitor, Users, Eye, PenTool, X, ExternalLink, Download, Camera, FileText,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { Avatar } from "@/components/shared/Avatar";

type StatusAbsensi = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

type Tahapan = {
  id: string; hariKe: number; judul: string; tanggal: string;
  jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string;
};

type SiswaAbsensi = {
  siswaId: string; nama: string; nis?: string;
  fotoProfil?: string | null;
  status: StatusAbsensi | null;
  waktuAbsen?: string | null;
  lokasi?: string | null;
  catatan?: string | null;
  ttd?: string | null;
  foto?: string | null;
};

type AbsensiData = {
  tahapanId: string; tahapan: Tahapan; tanggal: string;
  rekap: Record<StatusAbsensi, number>;
  siswa: SiswaAbsensi[];
};

const STATUS_CFG: Record<StatusAbsensi, {
  label: string; bg: string; clr: string; darkBg: string;
  icon: React.ElementType;
}> = {
  HADIR: { label: "Hadir",  bg: "#E8F8F1", clr: "#10B981", darkBg: "#10B98120", icon: CheckCircle2  },
  IZIN:  { label: "Izin",   bg: "#F0ECFF", clr: "#6334F4", darkBg: "#6334F420", icon: AlertCircle   },
  SAKIT: { label: "Sakit",  bg: "#FFF5DC", clr: "#E6A800", darkBg: "#E6A80020", icon: Thermometer   },
  ALPA:  { label: "Alpa",   bg: "#FFE9EA", clr: "#FF3644", darkBg: "#FF364420", icon: MinusCircle   },
};

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#3B7CE8,#4F8EF7)",
  "linear-gradient(135deg,#EF4444,#F87171)",
  "linear-gradient(135deg,#F59E0B,#FCD34D)",
  "linear-gradient(135deg,#10B981,#34D399)",
];

function formatTgl(tgl?: string) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#6334F4","#EF4444","#F59E0B","#FF7867","#10B981","#3B82F6"];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) & 0x7fffffff);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function parseLokasi(raw: string | null | undefined) {
  if (!raw) return null;
  const parts = raw.split(",");
  if (parts.length >= 2) return { lat: parts[0].trim(), lng: parts[1].trim() };
  return null;
}

function StatusBadge({ status }: { status: StatusAbsensi | null }) {
  if (!status) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
      Belum Absen
    </span>
  );
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.clr }}>
      <Icon size={10}/>{cfg.label}
    </span>
  );
}

function DokumenModal({ siswa, tanggal, lab, onClose }: {
  siswa: SiswaAbsensi; tanggal: string; lab: string; onClose: () => void;
}) {
  const [imgOverlay, setImgOverlay] = useState<string | null>(null);
  const API     = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const lokasi  = parseLokasi(siswa.lokasi);
  const fotoSrc = siswa.foto
    ? (siswa.foto.startsWith("data:") || siswa.foto.startsWith("blob:") ? siswa.foto : `${API}${siswa.foto}`)
    : null;
  const ttdSrc  = siswa.ttd ?? null;
  const status  = siswa.status ?? "HADIR";
  const theme   = STATUS_CFG[status as StatusAbsensi] ?? STATUS_CFG.HADIR;
  const ThemeIcon = theme.icon;
  const ac      = avatarColor(siswa.nama);

  return (
    <>
      <AnimatePresence>
        {imgOverlay && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-4"
            onClick={() => setImgOverlay(null)}>
            <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.88,opacity:0}}
              transition={{type:"spring",damping:24,stiffness:320}}
              onClick={e => e.stopPropagation()}
              className="flex max-h-[85vh] max-w-3xl flex-col items-center gap-4">
              <img src={imgOverlay} alt="TTD" className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"/>
              <div className="flex gap-3">
                <button onClick={() => { const a = document.createElement("a"); a.href = imgOverlay; a.download = "ttd-"+siswa.nama+".png"; a.click(); }}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                  <Download size={14}/> Download
                </button>
                <button onClick={() => setImgOverlay(null)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                  <X size={14}/> Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

        <motion.div initial={{opacity:0,scale:0.94,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.94,y:24}}
          transition={{type:"spring",damping:26,stiffness:300}}
          className="relative z-10 flex w-full max-w-3xl overflow-hidden rounded-t-3xl shadow-2xl sm:rounded-3xl"
          style={{maxHeight:"88vh"}}>

          <div className="relative flex w-60 shrink-0 flex-col overflow-hidden"
            style={{background:`linear-gradient(135deg,${theme.clr}dd,${theme.clr})`}}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10"/>
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/8"/>

            <div className="relative flex justify-end p-4">
              <button onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <X size={15}/>
              </button>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center px-5 pb-8 text-center">
              <div className="relative" style={{boxShadow:"0 0 0 4px rgba(255,255,255,0.25),0 12px 24px rgba(0,0,0,0.2)", borderRadius:"9999px"}}>
                <Avatar src={siswa.fotoProfil} nama={siswa.nama} sizePx={80} fallbackBg={ac} textClassName="text-xl font-extrabold" />
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 shadow-lg">
                  <ThemeIcon size={13} className="text-white"/>
                </div>
              </div>

              <h2 className="mt-4 text-sm font-extrabold leading-tight text-white">{siswa.nama}</h2>
              <div className="mt-2 rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{background:"rgba(255,255,255,0.22)"}}>
                {theme.label}
              </div>
              <div className="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white/80" style={{background:"rgba(255,255,255,0.12)"}}>
                {lab}
              </div>

              <div className="my-4 h-px w-full bg-white/20"/>

              <div className="w-full text-left space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Tanggal</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{formatTgl(tanggal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Waktu Absen</p>
                  <p className="mt-0.5 font-mono text-2xl font-extrabold text-white">{siswa.waktuAbsen ?? "—"}</p>
                  {siswa.waktuAbsen && <p className="text-[10px] text-white/55">WIB</p>}
                </div>
                {siswa.catatan && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Keterangan</p>
                    <p className="mt-0.5 text-xs text-white/90 leading-relaxed">{siswa.catatan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-[#141b2d]">
            <div className="shrink-0 border-b border-slate-100 dark:border-slate-700/40 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dokumen Kehadiran</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-3 p-4">

                {fotoSrc && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:"#EF444418"}}>
                        <Camera size={13} style={{color:"#EF4444"}}/>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Foto Selfie</span>
                    </div>
                    <button onClick={() => setImgOverlay(fotoSrc)}
                      className="group block w-full overflow-hidden">
                      <img src={fotoSrc} alt="Foto selfie" className="w-full max-h-52 object-cover group-hover:brightness-90 transition-all duration-200"/>
                    </button>
                  </div>
                )}

                {ttdSrc && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:"#6334F418"}}>
                          <PenTool size={13} style={{color:"#6334F4"}}/>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tanda Tangan Digital</span>
                      </div>
                      <button onClick={() => setImgOverlay(ttdSrc)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                        <Download size={10}/> Simpan
                      </button>
                    </div>
                    <div className="flex items-center justify-center bg-white dark:bg-slate-900/40 p-4">
                      <button onClick={() => setImgOverlay(ttdSrc)}
                        className="group relative w-full overflow-hidden rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:shadow-md transition-shadow">
                        <img src={ttdSrc} alt="Tanda tangan" className="h-20 w-full object-contain group-hover:scale-105 transition-transform duration-300"/>
                      </button>
                    </div>
                  </div>
                )}

                {lokasi && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:"#3B82F618"}}>
                          <MapPin size={13} style={{color:"#3B82F6"}}/>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lokasi Absensi</span>
                      </div>
                      <a href={`https://maps.google.com/maps?q=${lokasi.lat},${lokasi.lng}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-[10px] font-bold text-blue-500 dark:text-blue-400 hover:bg-blue-100">
                        <ExternalLink size={10}/> Maps
                      </a>
                    </div>
                    <iframe
                      src={`https://maps.google.com/maps?q=${lokasi.lat},${lokasi.lng}&output=embed`}
                      className="h-40 w-full border-0" loading="lazy" title="Lokasi absensi"/>
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <MapPin size={11} className="shrink-0 text-blue-400"/>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{lokasi.lat}, {lokasi.lng}</span>
                    </div>
                  </div>
                )}

                {siswa.lokasi && !lokasi && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:"#3B82F618"}}>
                        <MapPin size={13} style={{color:"#3B82F6"}}/>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lokasi Absensi</span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm text-slate-600 dark:text-slate-300">{siswa.lokasi}</p>
                    </div>
                  </div>
                )}

                {!fotoSrc && !ttdSrc && !siswa.lokasi && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <PenTool size={22} className="text-slate-300 dark:text-slate-600"/>
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada dokumen pendukung</p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 dark:border-slate-700/40 bg-white dark:bg-[#141b2d] px-4 py-3">
              <button onClick={onClose}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
                style={{background:`linear-gradient(135deg,${theme.clr}dd,${theme.clr})`}}>
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function LabCard({ tahapan, gradient, delay, hadir, total, selected, onClick }: {
  tahapan: Tahapan; gradient: string; delay: number;
  hadir: number; total: number; selected: boolean; onClick: () => void;
}) {
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
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Lab UKK</p>
          <p className="mt-0.5 text-sm font-bold text-white">{tahapan.lokasi}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Monitor size={16} className="text-white"/>
        </div>
      </div>

      <div className="relative">
        <p className="text-3xl font-bold text-white">
          {hadir}<span className="ml-1 text-base font-semibold text-white/60">/ {total}</span>
        </p>
        <p className="text-[11px] text-white/70 mt-0.5">siswa hadir</p>
      </div>

      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/50">Penguji</p>
          <p className="text-[11px] font-semibold text-white/90">{tahapan.penguji ?? "-"}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/50">Jam</p>
          <p className="text-[11px] font-semibold text-white/80">{tahapan.jamMulai}–{tahapan.jamSelesai}</p>
        </div>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 rounded-full bg-white/30 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
          Dipilih
        </div>
      )}
    </motion.div>
  );
}

function printAbsensiPDF({ siswaList, tahapan, tanggal, rekap, total, API }: {
  siswaList: SiswaAbsensi[];
  tahapan: Tahapan | null;
  tanggal: string;
  rekap: Record<StatusAbsensi, number>;
  total: number;
  API: string;
}) {
  const tglFormatted = tanggal
    ? new Date(tanggal).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    : "-";

  const statusColor: Record<string, string> = {
    HADIR: "#10B981", IZIN: "#6334F4", SAKIT: "#E6A800", ALPA: "#FF3644",
  };
  const statusBg: Record<string, string> = {
    HADIR: "#E8F8F1", IZIN: "#F0ECFF", SAKIT: "#FFF5DC", ALPA: "#FFE9EA",
  };

  const fotoSrc = (s: SiswaAbsensi) => {
    if (!s.foto) return null;
    return s.foto.startsWith("data:") || s.foto.startsWith("blob:") ? s.foto : `${API}${s.foto}`;
  };

  const pages = siswaList.map((s, i) => {
    const st     = s.status ?? "—";
    const stClr  = statusColor[st] ?? "#64748B";
    const stBg   = statusBg[st]   ?? "#F1F5F9";
    const foto   = fotoSrc(s);
    const ttd    = s.ttd ?? null;
    const lokasi = s.lokasi ?? "—";
    const waktu  = s.waktuAbsen ?? "—";
    const isLast = i === siswaList.length - 1;

    return `
      <div style="page-break-after:${isLast?"avoid":"always"};padding:32px;font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;box-sizing:border-box;display:flex;flex-direction:column;gap:20px;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #10B981;padding-bottom:14px;">
          <div>
            <h1 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">Laporan Absensi UKK</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${tglFormatted}</p>
          </div>
          <div style="text-align:right;font-size:11px;color:#94a3b8;">
            <div style="font-weight:700;color:#10B981;font-size:16px;">${i+1} / ${siswaList.length}</div>
            <div>siswa ke-${i+1}</div>
          </div>
        </div>

        <!-- Info Lab -->
        <div style="background:linear-gradient(135deg,#10B981,#059669);border-radius:14px;padding:16px 20px;color:white;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.65;">Sesi / Lab</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:800;">${tahapan?.judul ?? "—"}</p>
            </div>
            <div>
              <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.65;">Lokasi</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:800;">${tahapan?.lokasi ?? "—"}</p>
            </div>
            <div>
              <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.65;">Penguji</p>
              <p style="margin:4px 0 0;font-size:13px;font-weight:700;">${tahapan?.penguji ?? "—"}</p>
            </div>
            <div>
              <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.65;">Jam</p>
              <p style="margin:4px 0 0;font-size:13px;font-weight:700;">${tahapan?.jamMulai ?? "—"} – ${tahapan?.jamSelesai ?? "—"}</p>
            </div>
          </div>
        </div>

        <!-- Data Siswa -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

          <!-- Kiri: identitas + status -->
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Identitas Siswa</p>
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                <div style="width:48px;height:48px;border-radius:50%;background:${avatarColor(s.nama)};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:white;flex-shrink:0;">
                  ${getInitials(s.nama)}
                </div>
                <div>
                  <p style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">${s.nama}</p>
                  <p style="margin:3px 0 0;font-size:12px;font-family:monospace;color:#64748b;">${s.nis ?? "—"}</p>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <p style="margin:0;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;">Status</p>
                  <div style="margin-top:4px;display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:${stBg};color:${stClr};font-size:12px;font-weight:800;">
                    ${st}
                  </div>
                </div>
                <div>
                  <p style="margin:0;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;">Waktu Absen</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:900;font-family:monospace;color:#0f172a;">${waktu}</p>
                </div>
              </div>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Lokasi Absensi</p>
              <p style="margin:0;font-size:12px;color:#334155;font-family:monospace;word-break:break-all;">${lokasi}</p>
            </div>
            ${s.catatan ? `
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Keterangan</p>
              <p style="margin:0;font-size:12px;color:#334155;">${s.catatan}</p>
            </div>` : ""}
          </div>

          <!-- Kanan: foto + ttd -->
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${foto ? `
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Foto Selfie</p>
              <img src="${foto}" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;" crossorigin="anonymous"/>
            </div>` : `
            <div style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#cbd5e1;">Tidak ada foto selfie</p>
            </div>`}
            ${ttd ? `
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Tanda Tangan Digital</p>
              <div style="background:white;border-radius:8px;border:1px solid #e2e8f0;padding:8px;text-align:center;">
                <img src="${ttd}" style="max-width:100%;max-height:100px;object-contain;" crossorigin="anonymous"/>
              </div>
            </div>` : `
            <div style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#cbd5e1;">Tidak ada tanda tangan</p>
            </div>`}
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top:auto;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
          <span>Laporan Absensi UKK — Dicetak ${new Date().toLocaleDateString("id-ID")}</span>
          <span>Rekap: Hadir ${rekap.HADIR} | Izin ${rekap.IZIN} | Sakit ${rekap.SAKIT} | Alpa ${rekap.ALPA} dari ${total} siswa</span>
        </div>
      </div>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"/>
  <title>Laporan Absensi UKK — ${tglFormatted}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head><body>${pages}</body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

export default function AdminUkkAbsensiPage() {
  const toast = useToast();

  const [tahapanList, setTahapanList] = useState<Tahapan[]>([]);
  const [selectedId,  setSelectedId]  = useState<string>("");
  const [tanggal,     setTanggal]     = useState(() => new Date().toISOString().slice(0, 10));
  const [data,        setData]        = useState<AbsensiData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [dokumenSiswa, setDokumenSiswa] = useState<SiswaAbsensi | null>(null);

  useEffect(() => {
    fetch("/api/ujian-ukk/tahapan")
      .then(r => r.json())
      .then((list: any[]) => {
        const tasks = (Array.isArray(list) ? list : []).filter(t => t.hariKe !== 0) as Tahapan[];
        setTahapanList(tasks);
        if (tasks.length > 0) setSelectedId(tasks[0].id);
      })
      .catch(() => {});
  }, []);

  const loadAbsensi = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ujian-ukk/absensi?tahapanId=${selectedId}&tanggal=${tanggal}`);
      const d: AbsensiData = await res.json();
      setData(d);
    } catch {
      toast.error("Gagal memuat data absensi", "");
    } finally {
      setLoading(false);
    }
  }, [selectedId, tanggal]);

  useEffect(() => { loadAbsensi(); }, [loadAbsensi]);

  const selectedTahapan = tahapanList.find(t => t.id === selectedId);
  const selectedIdx     = tahapanList.findIndex(t => t.id === selectedId);
  const siswaList       = data?.siswa ?? [];
  const rekap           = data?.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
  const total           = siswaList.length;
  const sudahAbsen      = siswaList.filter(s => s.status !== null).length;
  const hadirPct        = total > 0 ? Math.round((rekap.HADIR / total) * 100) : 0;

  return (
    <>
      <div className="space-y-5 p-1">

        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{background:"linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)"}}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10"/>
          <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8"/>
          <div className="pointer-events-none absolute bottom-4 -left-6 h-24 w-24 rounded-full bg-white/6"/>

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <ClipboardCheck size={26} className="text-white"/>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ujian Kompetensi Keahlian</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Admin</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi UKK</h1>
                <p className="mt-0.5 text-sm text-white/70">Pantau kehadiran siswa di setiap lab komputer</p>
              </div>
            </div>

            <LiveClock />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tahapanList.length === 0
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl"
                  style={{background:CARD_GRADIENTS[i], opacity:0.4}}/>
              ))
            : tahapanList.map((t, i) => (
                <LabCard key={t.id} tahapan={t} gradient={CARD_GRADIENTS[i % 4]}
                  delay={0.05 + i*0.05} hadir={t.id===selectedId ? rekap.HADIR : 0}
                  total={t.id===selectedId ? total : 0}
                  selected={t.id === selectedId} onClick={() => setSelectedId(t.id)}/>
              ))
          }
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays size={14} className="text-slate-400"/>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Absensi</span>
          </div>
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
          <div className="flex-1"/>
          <span className="text-xs text-slate-400">{sudahAbsen}/{total} sudah absen</span>
          <button
            onClick={() => printAbsensiPDF({
              siswaList, tahapan: selectedTahapan ?? null, tanggal, rekap, total,
              API: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
            })}
            disabled={siswaList.length === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-40 transition-all hover:brightness-95"
            style={{background:"linear-gradient(135deg,#EF4444,#DC2626)"}}>
            <FileText size={14}/> Laporan PDF
          </button>
        </div>

        {selectedTahapan && (
          <div className="relative rounded-2xl overflow-hidden shadow-lg"
            style={{background: CARD_GRADIENTS[selectedIdx % 4]}}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10"/>
            <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/5"/>

            <div className="relative px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 shadow-sm">
                    <Monitor size={22} className="text-white"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">Lab Aktif</p>
                    <p className="text-lg font-extrabold leading-tight text-white">{selectedTahapan.judul}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-xl bg-white/20 px-3 py-1 text-lg font-extrabold text-white backdrop-blur-sm">
                    {hadirPct}%
                  </span>
                  <span className="text-[10px] text-white/60">{sudahAbsen}/{total} hadir</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <motion.div initial={{width:0}} animate={{width:`${hadirPct}%`}}
                    transition={{duration:0.7,ease:[0.16,1,0.3,1]}}
                    className="h-2 rounded-full bg-white shadow-sm"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { Icon: CalendarDays, label: "Tanggal",  val: formatTgl(selectedTahapan.tanggal) },
                  { Icon: Clock,        label: "Jam",       val: `${selectedTahapan.jamMulai} – ${selectedTahapan.jamSelesai}` },
                  { Icon: MapPin,       label: "Lokasi",    val: selectedTahapan.lokasi },
                  { Icon: User,         label: "Penguji",   val: selectedTahapan.penguji ?? "—" },
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
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["HADIR","IZIN","SAKIT","ALPA"] as StatusAbsensi[]).map(key => {
            const cfg  = STATUS_CFG[key];
            const Icon = cfg.icon;
            const pct  = total > 0 ? Math.round(rekap[key] / total * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm"
                style={{backgroundColor: cfg.bg}}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{backgroundColor: cfg.darkBg}}>
                  <Icon size={20} style={{color:cfg.clr}}/>
                </div>
                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="text-2xl font-black leading-none" style={{color:cfg.clr}}>{rekap[key]}</span>
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

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

          {!loading && siswaList.length > 0 && (
            <div className="sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/80 px-5 py-2.5">
              <div className="grid items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                style={{gridTemplateColumns:"28px 40px 2fr 1.4fr 1.1fr 1fr 1.6fr 72px 72px 100px"}}>
                <span>#</span>
                <span/>
                <span>Nama Siswa</span>
                <span>NIS</span>
                <span className="text-center">Status</span>
                <span className="text-center">Waktu</span>
                <span>Lokasi</span>
                <span className="text-center">Foto</span>
                <span className="text-center">TTD</span>
                <span/>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({length:4}).map((_,i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700"/>
                  <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-700"/>
                  <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700"/>
                </div>
              ))}
            </div>
          ) : siswaList.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Users size={24} className="text-slate-300 dark:text-slate-600"/>
              </div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                Belum ada siswa di-assign ke lab ini
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {siswaList.map((s, idx) => {
                const ac       = avatarColor(s.nama);
                const hasDok   = !!(s.ttd || s.lokasi || s.foto);
                const lokasiParsed = parseLokasi(s.lokasi);
                return (
                  <motion.div key={s.siswaId}
                    initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:idx*0.02}}
                    className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                    style={{gridTemplateColumns:"28px 40px 2fr 1.4fr 1.1fr 1fr 1.6fr 72px 72px 100px"}}>

                    <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{idx+1}</span>

                    <Avatar src={s.fotoProfil} nama={s.nama} sizePx={36} fallbackBg={ac} textClassName="text-[10px] font-extrabold" />

                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{s.nama}</p>

                    <p className="truncate font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">{s.nis ?? "—"}</p>

                    <div className="flex justify-center">
                      <StatusBadge status={s.status}/>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300">
                      {s.waktuAbsen
                        ? <><Clock size={12} className="shrink-0 text-slate-400"/><span className="font-mono text-sm font-bold">{s.waktuAbsen}</span></>
                        : <span className="text-sm text-slate-300">—</span>}
                    </div>

                    <div className="min-w-0">
                      {lokasiParsed ? (
                        <a href={`https://maps.google.com/maps?q=${lokasiParsed.lat},${lokasiParsed.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline truncate">
                          <MapPin size={10} className="shrink-0"/>
                          <span className="font-mono truncate">{lokasiParsed.lat.slice(0,8)}…</span>
                        </a>
                      ) : s.lokasi ? (
                        <span className="text-[11px] text-slate-500 truncate block">{s.lokasi}</span>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </div>

                    <div className="flex justify-center">
                      {(() => {
                        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
                        const src = s.foto
                          ? (s.foto.startsWith("data:") || s.foto.startsWith("blob:") ? s.foto : `${API}${s.foto}`)
                          : null;
                        return src ? (
                          <button onClick={() => setDokumenSiswa(s)}
                            className="group h-9 w-14 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                            <img src={src} alt="Foto" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"/>
                          </button>
                        ) : (
                          <div className="flex h-9 w-14 items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            <Camera size={12} className="text-slate-300 dark:text-slate-600"/>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex justify-center">
                      {s.ttd ? (
                        <button onClick={() => setDokumenSiswa(s)}
                          className="group h-9 w-14 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                          <img src={s.ttd} alt="TTD" className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-200"/>
                        </button>
                      ) : (
                        <div className="flex h-9 w-14 items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                          <PenTool size={12} className="text-slate-300 dark:text-slate-600"/>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      {hasDok ? (
                        <button onClick={() => setDokumenSiswa(s)}
                          className="group flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
                          style={{background:"linear-gradient(135deg,#6334F4,#4F8EF7)"}}>
                          <Eye size={11} className="transition-transform group-hover:scale-110"/> Lihat
                        </button>
                      ) : <span/>}
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/40 px-5 py-3">
            <div className="text-xs text-slate-400 dark:text-slate-500">
              <span className="font-bold text-slate-600 dark:text-slate-300">{rekap.HADIR}</span>/{total} siswa hadir
            </div>
            <div className="flex gap-2">
              {(Object.entries(STATUS_CFG) as [StatusAbsensi, typeof STATUS_CFG[StatusAbsensi]][]).map(([st, cfg]) => (
                <span key={st} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{backgroundColor:cfg.bg, color:cfg.clr}}>
                  {cfg.label} {rekap[st]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dokumenSiswa && (
          <DokumenModal
            siswa={dokumenSiswa}
            tanggal={tanggal}
            lab={selectedTahapan?.lokasi ?? ""}
            onClose={() => setDokumenSiswa(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
