"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ClipboardList, AlertCircle, Users, Calendar, Eye,
  CheckCircle2, AlertCircle as AlertCircleIcon, Thermometer, MinusCircle, Clock,
} from "lucide-react";
import { AbsensiDokumenModal, type AbsensiDokumenData } from "./AbsensiDokumenModal";

type SiswaStatus = {
  userId: string;
  nama: string;
  status: string | null;
  waktuAbsen?: string | null;
  lokasi?: string | null;
  foto?: string | null;
  ttd?: string | null;
};

type Rekap = {
  HADIR: number;
  IZIN: number;
  SAKIT: number;
  ALPA: number;
};

type Props = {
  open: boolean;
  jadwalKelasId: string;
  kelas: string;
  onClose: () => void;
};

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; darkBg: string }> = {
  HADIR: { label: "Hadir",       icon: CheckCircle2,       color: "#10B981", bg: "#E8F8F1", darkBg: "#10B98120" },
  IZIN:  { label: "Izin",        icon: AlertCircleIcon,    color: "#6334F4", bg: "#F0ECFF", darkBg: "#6334F420" },
  SAKIT: { label: "Sakit",       icon: Thermometer,        color: "#E6A800", bg: "#FFF5DC", darkBg: "#E6A80020" },
  ALPA:  { label: "Alpa",        icon: MinusCircle,        color: "#FF3644", bg: "#FFE9EA", darkBg: "#FF364420" },
};

const REKAP_ORDER = ["HADIR", "IZIN", "SAKIT", "ALPA"] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(nama: string) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = ["#6334F4", "#FF3644", "#FFC25B", "#FF7867", "#10B981", "#0033FF"];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) & 0x7fffffff);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:bg-slate-700 dark:text-slate-500">
        Belum Absen
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PresensiModal({ open, jadwalKelasId, kelas, onClose }: Props) {
  const [tanggal, setTanggal]     = useState(today());
  const [siswaList, setSiswaList] = useState<SiswaStatus[]>([]);
  const [rekap, setRekap]         = useState<Rekap>({ HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [selectedAbsensi, setSelectedAbsensi] = useState<AbsensiDokumenData | null>(null);

  const fetchAbsensi = useCallback(async () => {
    if (!jadwalKelasId || !tanggal) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/absensi-kelas?jadwalKelasId=${jadwalKelasId}&tanggal=${tanggal}`);
      const data = await res.json();
      setSiswaList(data.siswa ?? []);
      setRekap(data.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 });
    } catch {
      setError("Gagal memuat data absensi");
    } finally {
      setLoading(false);
    }
  }, [jadwalKelasId, tanggal]);

  useEffect(() => {
    if (open) fetchAbsensi();
  }, [open, fetchAbsensi]);

  const totalSiswa  = siswaList.length;
  const hadirCount  = rekap.HADIR;
  const hadirPct    = totalSiswa > 0 ? Math.round((hadirCount / totalSiswa) * 100) : 0;
  const sudahAbsen  = siswaList.filter((s) => s.status !== null).length;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop — tidak bisa diklik saat AbsensiDokumenModal terbuka */}
            <motion.div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={selectedAbsensi ? undefined : onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel — disembunyikan (invisible) saat AbsensiDokumenModal terbuka */}
            <motion.div
              className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-[#1c2434] sm:rounded-3xl"
              style={{ maxHeight: "90vh", visibility: selectedAbsensi ? "hidden" : "visible" }}
              initial={{ scale: 0.96, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 24 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              {/* ── Header ── */}
              <div
                className="relative shrink-0 overflow-hidden px-6 py-5"
                style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #6334F4 100%)" }}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-6 right-24 h-20 w-20 rounded-full bg-white/8" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                      <ClipboardList size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-white">Data Presensi</p>
                      <div className="flex items-center gap-1.5 text-[12px] text-white/75">
                        <Users size={11} />
                        <span>{kelas}</span>
                        <span>·</span>
                        <span>{totalSiswa} siswa</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Attendance rate bar */}
                <div className="relative mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/80">
                    <span className="font-semibold">{sudahAbsen}/{totalSiswa} sudah absen</span>
                    <span className="font-extrabold">{hadirPct}% hadir</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/25">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${hadirPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-1.5 rounded-full bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ── Date + Rekap ── */}
              <div className="shrink-0 border-b border-slate-100 px-6 py-4 dark:border-slate-700/40">
                {/* Date picker */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar size={14} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Tanggal Presensi
                    </p>
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Rekap chips */}
                <div className="grid grid-cols-4 gap-2">
                  {REKAP_ORDER.map((key) => {
                    const cfg = STATUS_CONFIG[key];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center gap-1 rounded-2xl py-3 dark:bg-slate-800/60"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <Icon size={15} style={{ color: cfg.color }} />
                        <span className="text-xl font-black" style={{ color: cfg.color }}>
                          {rekap[key]}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Siswa table ── */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="space-y-3 p-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
                        <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                        <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 p-6 text-sm text-red-500">
                    <AlertCircle size={16} /> {error}
                  </div>
                ) : siswaList.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <Users size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                      Tidak ada siswa di kelas ini
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table header — kolom harus identik dengan row */}
                    <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-6 py-2.5 dark:border-slate-700/40 dark:bg-slate-800/80">
                      <div className="grid grid-cols-[24px_40px_1fr_110px_90px_60px] items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <span>#</span>
                        <span />
                        <span>Nama</span>
                        <span className="text-center">Waktu</span>
                        <span className="text-center">Status</span>
                        <span />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                      {siswaList.map((s, idx) => {
                        const ac = avatarColor(s.nama);
                        const hasDokumen = s.status === "HADIR" && (s.foto || s.ttd || s.lokasi);
                        return (
                          <motion.div
                            key={s.userId}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="grid grid-cols-[24px_40px_1fr_110px_90px_60px] items-center gap-3 px-6 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                          >
                            {/* No */}
                            <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">
                              {idx + 1}
                            </span>

                            {/* Avatar */}
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                              style={{ backgroundColor: ac }}
                            >
                              {getInitials(s.nama)}
                            </div>

                            {/* Nama */}
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {s.nama}
                            </p>

                            {/* Waktu absen */}
                            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                              {s.waktuAbsen ? (
                                <>
                                  <Clock size={10} className="shrink-0" />
                                  <span className="font-mono font-semibold">{s.waktuAbsen}</span>
                                </>
                              ) : (
                                <span className="text-center">—</span>
                              )}
                            </div>

                            {/* Status badge */}
                            <div className="flex justify-center">
                              <StatusBadge status={s.status} />
                            </div>

                            {/* Lihat dokumen */}
                            <div className="flex justify-end">
                              {hasDokumen ? (
                                <button
                                  onClick={() => setSelectedAbsensi({
                                    nama: s.nama,
                                    nis: "",
                                    kelas,
                                    waktuAbsen: s.waktuAbsen ?? null,
                                    tanggal,
                                    lokasi: s.lokasi ?? null,
                                    foto: s.foto ?? null,
                                    ttd: s.ttd ?? null,
                                    status: s.status!,
                                  })}
                                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary transition-colors hover:bg-primary/20"
                                >
                                  <Eye size={10} />
                                  <span>Lihat</span>
                                </button>
                              ) : (
                                <span />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-700/40">
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  <span className="font-bold text-slate-600 dark:text-slate-300">{rekap.HADIR}</span>
                  /{totalSiswa} siswa hadir
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedAbsensi && (
        <AbsensiDokumenModal
          siswa={selectedAbsensi}
          onClose={() => setSelectedAbsensi(null)}
        />
      )}
    </>
  );
}
