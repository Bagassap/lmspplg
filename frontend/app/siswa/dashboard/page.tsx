"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle, XCircle, TrendingUp,
  Bell, ClipboardList, AlertCircle, RefreshCw, ChevronRight,
  FileQuestion, Calendar, Megaphone, Clock, BookOpen, Briefcase,
} from "lucide-react";
import GreetingHero from "@/components/dashboard/GreetingHero";
import StatsCard from "@/components/dashboard/StatsCard";
import { StatisticRainbow } from "@/components/dashboard/StatisticRainbow";
import { DonutChart } from "@/components/dashboard/MiniChart";
import PengumumanDetailModal from "@/components/pengumuman/PengumumanDetailModal";
import { timeAgo } from "@/components/dashboard/ActivityList";
import { accentFor } from "@/lib/jadwalColors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JadwalItem {
  id: string; mataPelajaran: string; kelas: string;
  hari: string; jamMulai: string; jamSelesai: string;
  guru: { user: { nama: string } };
}
interface TugasItem {
  id: string; judul: string; deadline: string;
  jadwalKelas: { mataPelajaran: string };
}
interface Pengumuman {
  id: string; judul: string; slug: string; kategori: string;
  isPinned: boolean; createdAt: string;
  author: { id: string; nama: string; role: string };
  _count: { komentar: number };
}
interface DashboardData {
  kelas: string;
  absensi: { hadir: number; izin: number; alpa: number; total: number; persentase: number };
  jadwalHariIni: JadwalItem[];
  tugasBelumDikumpulkan: TugasItem[];
  tugasProgress: { total: number; dikumpulkan: number };
  pengumuman: Pengumuman[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const P = "#4F8EF7";
const R = "#EF4444";
const G = "#10B981";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/60 ${className}`} />;
}

function isLive(start: string, end: string) {
  const now = new Date().toTimeString().slice(0, 5);
  return now >= start && now <= end;
}

const KATEGORI_COLOR: Record<string, string> = {
  UMUM: P, AKADEMIK: "#6366F1", EKSKUL: G, DARURAT: R,
};
const kColor = (k: string) => KATEGORI_COLOR[k] ?? P;

function SectionCard({
  title, action, icon: Icon, iconColor = P, children, delay = 0,
  className = "", bodyClass = "",
}: {
  title: string; action?: React.ReactNode; icon?: React.ElementType; iconColor?: string;
  children: React.ReactNode; delay?: number; className?: string; bodyClass?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434] ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-700/40">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${iconColor}18` }}>
              <Icon size={14} style={{ color: iconColor }} />
            </div>
          )}
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</span>
        </div>
        {action}
      </div>
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </motion.div>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-0.5 text-[11px] font-semibold"
      style={{ color: P }}>
      Lihat Semua <ChevronRight size={12} />
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SiswaDashboardPage() {
  const [user, setUser]       = useState<{ nama: string; role: string; id: string } | null>(null);
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [meRes, dashRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/dashboard/siswa")]);
      if (!meRes.ok || !dashRes.ok) throw new Error("Gagal memuat data");
      const [me, dash] = await Promise.all([meRes.json(), dashRes.json()]);
      if (dash.error) throw new Error(dash.error);
      setUser({ nama: me.nama ?? "", role: me.role ?? "SISWA", id: me.id ?? "" });
      setData(dash);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 min-w-0 space-y-5">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-44" />)}</div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <div className="lg:w-80 shrink-0 space-y-4">
        <div className="grid grid-cols-2 gap-3">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-40" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      <button onClick={load} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: P }}>
        <RefreshCw size={14} /> Coba lagi
      </button>
    </div>
  );

  if (!data || !user) return null;

  const { absensi, tugasProgress } = data;
  const tugasPersen = tugasProgress.total > 0
    ? Math.round((tugasProgress.dikumpulkan / tugasProgress.total) * 100)
    : 0;
  const tugasBelum = Math.max(0, tugasProgress.total - tugasProgress.dikumpulkan);

  const CARDS = [
    {
      href: "/siswa/jadwal-kelas",
      label: "Jadwal Kelas",
      value: data.jadwalHariIni.length,
      suffix: " hari ini",
      gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
      icon: Calendar,
    },
    {
      href: "/siswa/tugas",
      label: "Tugas",
      value: tugasBelum,
      suffix: " belum",
      gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
      icon: ClipboardList,
    },
    {
      href: "/siswa/pengumuman",
      label: "Pengumuman",
      value: data.pengumuman.length,
      suffix: " info",
      gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
      icon: Megaphone,
    },
    {
      href: "/siswa/magang",
      label: "Magang / PKL",
      value: absensi.hadir,
      suffix: "x hadir",
      gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
      icon: Briefcase,
    },
  ] as const;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ══ KOLOM KIRI — Hero + Shortcuts + Tugas + Pengumuman ══════════════ */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Hero Greeting */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <GreetingHero nama={user.nama} role={user.role} kelas={data.kelas} />
          </motion.div>

          {/* 4 Credit Card shortcuts — 2 × 2 */}
          <div className="grid grid-cols-2 gap-4">
            {CARDS.map((card, i) => (
              <motion.div key={card.href}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={card.href}
                  className="relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl p-5 text-white"
                  style={{ background: card.gradient, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                  <div className="pointer-events-none absolute -bottom-4 right-12 h-20 w-20 rounded-full bg-white/8" />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">Akses Cepat</p>
                      <p className="mt-0.5 text-sm font-bold">{card.label}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                      <card.icon size={17} />
                    </div>
                  </div>
                  <div className="relative">
                    <p className="text-3xl font-bold tabular-nums">{card.value}{card.suffix}</p>
                  </div>
                  <div className="relative flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">Kelas</p>
                      <p className="text-[11px] font-semibold">{data.kelas}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">Siswa</p>
                      <p className="max-w-25 truncate text-[11px] font-semibold">{user.nama}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Tugas Belum Dikumpulkan */}
          <SectionCard title="Tugas Belum Dikumpulkan" icon={ClipboardList} iconColor={R}
            action={<ViewAll href="/siswa/tugas" />}
            delay={0.3} bodyClass="px-4 py-2">
            {data.tugasBelumDikumpulkan.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Semua tugas sudah dikumpulkan 🎉
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {data.tugasBelumDikumpulkan.slice(0, 6).map((t, i) => {
                  const daysLeft = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);
                  const urgent = daysLeft <= 2;
                  const dc = urgent ? R : "#F59E0B";
                  return (
                    <motion.li key={t.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                      className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 rounded-xl px-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${dc}18` }}>
                        <ClipboardList size={14} style={{ color: dc }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-white">{t.judul}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.jadwalKelas.mataPelajaran}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                        style={{ backgroundColor: dc }}>
                        {daysLeft <= 0 ? "Hari ini" : daysLeft === 1 ? "Besok" : `${daysLeft}h lagi`}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {/* Pengumuman Terbaru */}
          <SectionCard title="Pengumuman Terbaru" icon={Megaphone} iconColor={P}
            action={
              <div className="flex items-center gap-2">
                {data.pengumuman.length > 0 &&
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${P}18`, color: P }}>{data.pengumuman.length}</span>
                }
                <ViewAll href="/siswa/pengumuman" />
              </div>
            }
            delay={0.4} bodyClass="px-0 py-0">
            {data.pengumuman.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada pengumuman</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {data.pengumuman.slice(0, 5).map((p, i) => (
                  <motion.li key={p.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    onClick={() => setSelectedSlug(p.slug)}
                    className="group relative flex cursor-pointer items-center gap-3 overflow-hidden px-6 py-3.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <div className="absolute inset-y-0 left-0 w-0.5 rounded-r" style={{ backgroundColor: kColor(p.kategori) }} />
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${kColor(p.kategori)}18` }}>
                      <Bell size={14} style={{ color: kColor(p.kategori) }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="line-clamp-1 text-[13px] font-semibold text-slate-800 dark:text-white">{p.judul}</p>
                        {p.isPinned && <span className="shrink-0 text-[10px]">📌</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock size={9} />
                        <span>{p.author.nama} · {timeAgo(p.createdAt)}</span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{ background: `${kColor(p.kategori)}18`, color: kColor(p.kategori) }}>{p.kategori}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </SectionCard>

        </div>{/* end kolom kiri */}

        {/* ══ KOLOM KANAN — Stats + Progress + Absensi Chart + Jadwal ═════════ */}
        <div className="lg:w-80 shrink-0 space-y-4">

          {/* 5 Stat Cards — 2 × 2 + 1 full */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 gap-3">
            <StatsCard icon={CheckCircle}   label="Hadir"       value={absensi.hadir}      index={0} delay={0.05} />
            <StatsCard icon={FileQuestion}  label="Izin"        value={absensi.izin}       index={1} delay={0.10} />
            <StatsCard icon={XCircle}       label="Alpa"        value={absensi.alpa}       index={2} delay={0.15} />
            <StatsCard icon={TrendingUp}    label="Kehadiran"   value={absensi.persentase} index={3} delay={0.20} suffix="%" />
            <div className="col-span-2">
              <StatsCard icon={ClipboardList} label="Tugas Belum" value={tugasBelum} index={2} delay={0.25} />
            </div>
          </motion.div>

          {/* Progress Tugas — compact donut */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Progress Tugas</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{tugasProgress.dikumpulkan}/{tugasProgress.total} dikumpulkan</p>
              </div>
              <ViewAll href="/siswa/tugas" />
            </div>
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <DonutChart
                  value={tugasPersen} color={P} trackColor="#EEF4FF"
                  size={80} strokeWidth={9}
                  label={`${tugasPersen}%`} sublabel="selesai"
                  labelSize="17px" sublabelSize="10px"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: P }}
                    initial={{ width: 0 }} animate={{ width: `${tugasPersen}%` }}
                    transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: P }}/> Selesai {tugasProgress.dikumpulkan}</span>
                  <span className="flex items-center gap-1 text-slate-500"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: R }}/> Belum {tugasBelum}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Statistik Absensi — radial chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434]">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Statistik Absensi</h2>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Rekap kehadiran semester ini</p>
            <StatisticRainbow
              hadir={absensi.hadir} sakit={0}
              izin={absensi.izin} alpha={absensi.alpa}
              total={absensi.total}
            />
          </motion.div>

          {/* Jadwal Hari Ini */}
          <SectionCard title="Jadwal Hari Ini" icon={Calendar} iconColor={R}
            action={<ViewAll href="/siswa/jadwal-kelas" />}
            delay={0.3} bodyClass="px-3 py-2">
            {data.jadwalHariIni.length === 0 ? (
              <p className="py-5 text-center text-sm text-slate-500 dark:text-slate-400">Tidak ada jadwal hari ini</p>
            ) : (
              <ul className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {data.jadwalHariIni.map((j, i) => {
                  const live = isLive(j.jamMulai, j.jamSelesai);
                  const ac = accentFor(j.mataPelajaran);
                  return (
                    <motion.li key={j.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                      className={`flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors ${live ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                        style={{ background: `linear-gradient(135deg, ${ac.strip}, ${ac.strip}cc)` }}>
                        {j.mataPelajaran.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">{j.mataPelajaran}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{j.jamMulai}–{j.jamSelesai}</p>
                      </div>
                      {live && (
                        <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ backgroundColor: P }}>LIVE</span>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

        </div>{/* end kolom kanan */}

      </div>

      <AnimatePresence>
        {selectedSlug && (
          <PengumumanDetailModal key={selectedSlug} slug={selectedSlug} canManage={false} currentUserId={user.id}
            onClose={() => setSelectedSlug(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
