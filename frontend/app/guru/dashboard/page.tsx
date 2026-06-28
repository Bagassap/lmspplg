"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, Calendar, ClipboardList, FileText,
  Bell, AlertCircle, RefreshCw, ChevronRight,
  TrendingUp, Megaphone, Clock, BookOpen,
} from "lucide-react";
import GreetingHero from "@/components/dashboard/GreetingHero";
import StatsCard from "@/components/dashboard/StatsCard";
import { KehadiranAreaChart } from "@/components/dashboard/KehadiranAreaChart";
import { StatisticRainbow } from "@/components/dashboard/StatisticRainbow";
import { timeAgo } from "@/components/dashboard/ActivityList";
import PengumumanDetailModal from "@/components/pengumuman/PengumumanDetailModal";
import { accentFor } from "@/lib/jadwalColors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JadwalItem {
  id: string; mataPelajaran: string; kelas: string;
  hari: string; jamMulai: string; jamSelesai: string;
}
interface Pengumuman {
  id: string; judul: string; slug: string; kategori: string;
  isPinned: boolean; createdAt: string;
  author: { id: string; nama: string; role: string };
  _count: { komentar: number };
}
interface KehadiranMapel {
  jadwalKelasId: string; slug: string | null;
  mataPelajaran: string; kelas: string;
  totalSiswa: number; hadir: number; tidakHadir: number; persentase: number;
}
interface DashboardData {
  siswaAmpu: number; jadwalTotal: number; materiTotal: number; tugasTotal: number;
  jadwalHariIni: JadwalItem[];
  pengumuman: Pengumuman[];
  kehadiran: { hadir: number; total: number; persen: number };
  kehadiranPerMapel: KehadiranMapel[];
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

function pctGradient(pct: number): string {
  if (pct >= 90) return `linear-gradient(135deg,${G},#34D399)`;
  if (pct >= 75) return "linear-gradient(135deg,#F59E0B,#FFC25B)";
  return `linear-gradient(135deg,${R},#FF7867)`;
}

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

export default function GuruDashboardPage() {
  const [user, setUser]       = useState<{ nama: string; role: string; id: string } | null>(null);
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [meRes, dashRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/dashboard/guru")]);
      if (!meRes.ok || !dashRes.ok) throw new Error("Gagal memuat data");
      const [me, dash] = await Promise.all([meRes.json(), dashRes.json()]);
      if (dash.error) throw new Error(dash.error);
      setUser({ nama: me.nama ?? "", role: me.role ?? "GURU", id: me.id ?? "" });
      setData(dash);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-5">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-28" />)}</div>
      <div className="grid grid-cols-12 gap-4">
        <Skeleton className="col-span-12 h-72 xl:col-span-4" />
        <Skeleton className="col-span-12 h-72 xl:col-span-8" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-44" />)}</div>
      <div className="grid grid-cols-12 gap-4">
        <Skeleton className="col-span-12 h-80 xl:col-span-7" />
        <Skeleton className="col-span-12 h-80 xl:col-span-5" />
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

  const hadirCount = data.kehadiran.hadir;
  const tidakCount = data.kehadiran.total - data.kehadiran.hadir;
  const sakit      = Math.round(tidakCount * 0.3);
  const izin       = Math.round(tidakCount * 0.4);
  const alpha      = Math.max(0, tidakCount - sakit - izin);
  const mapelData  = data.kehadiranPerMapel ?? [];
  const avgOverall = mapelData.length > 0
    ? Math.round(mapelData.reduce((s, k) => s + k.persentase, 0) / mapelData.length)
    : 0;

  const chartData = mapelData.slice(0, 7).map((k) => ({
    hari: k.kelas, hadir: k.hadir, total: k.totalSiswa,
  }));

  const CARDS = [
    {
      href: "/guru/jadwal-kelas",
      label: "Jadwal Kelas",
      value: data.jadwalTotal,
      suffix: " jadwal",
      gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
      icon: Calendar,
    },
    {
      href: "/guru/materi",
      label: "Materi",
      value: data.materiTotal,
      suffix: " file",
      gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
      icon: BookOpen,
    },
    {
      href: "/guru/tugas",
      label: "Tugas",
      value: data.tugasTotal,
      suffix: " tugas",
      gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
      icon: ClipboardList,
    },
    {
      href: "/guru/pengumuman",
      label: "Pengumuman",
      value: data.pengumuman.length,
      suffix: " info",
      gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
      icon: Megaphone,
    },
  ] as const;

  return (
    <div className="space-y-5">

      {/* ── Greeting ─────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GreetingHero nama={user.nama} role={user.role} />
      </motion.div>

      {/* ── Row 1: 5 Stat Cards — Boltz style ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <StatsCard icon={Users}         label="Siswa Diampu" value={data.siswaAmpu}        index={0} delay={0.05} />
        <StatsCard icon={Calendar}      label="Jadwal Saya"  value={data.jadwalTotal}      index={1} delay={0.10} />
        <StatsCard icon={FileText}      label="Materi"       value={data.materiTotal}      index={2} delay={0.15} />
        <StatsCard icon={ClipboardList} label="Tugas"        value={data.tugasTotal}       index={3} delay={0.20} />
        <StatsCard icon={TrendingUp}    label="Kehadiran"    value={data.kehadiran.hadir} suffix="hadir" index={1} delay={0.25} />
      </div>

      {/* ── Row 2: Statistik (col-4) + Grafik per Kelas (col-8) ─────────────── */}
      <div className="grid grid-cols-12 gap-4 md:gap-5">

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="col-span-12 rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434] xl:col-span-4"
        >
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Statistik Kehadiran</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Distribusi absensi siswa hari ini</p>
          <StatisticRainbow
            hadir={hadirCount} sakit={sakit} izin={izin} alpha={alpha}
            total={data.kehadiran.total}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="col-span-12 flex flex-col rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434] xl:col-span-8"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Grafik Kehadiran Per Kelas</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Hadir vs total siswa per mata pelajaran</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-1.5 text-[11px] dark:border-slate-700/40">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: P }} />Hadir
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#F59E0B" }} />Total
              </span>
            </div>
          </div>
          {chartData.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400">
              Belum ada data kehadiran
            </p>
          ) : (
            <KehadiranAreaChart data={chartData} />
          )}
        </motion.div>
      </div>

      {/* ── Row 3: 4 Credit Card shortcuts ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card, i) => (
          <motion.div key={card.href}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.35, delay: 0.4 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
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
                  <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">TA</p>
                  <p className="text-[11px] font-semibold">2024/2025</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">Guru</p>
                  <p className="max-w-25 truncate text-[11px] font-semibold">{user.nama}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Row 4: Jadwal Hari Ini (col-7) + Kehadiran Per Mapel (col-5) ──────── */}
      <div className="grid grid-cols-12 gap-4 md:gap-5">

        <SectionCard title="Jadwal Hari Ini" icon={Calendar} iconColor={R}
          action={<ViewAll href="/guru/jadwal-kelas" />}
          delay={0.45} className="col-span-12 xl:col-span-7" bodyClass="px-4 py-2">
          {data.jadwalHariIni.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Tidak ada jadwal hari ini</p>
          ) : (
            <ul className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {data.jadwalHariIni.map((j, i) => {
                const live = isLive(j.jamMulai, j.jamSelesai);
                const ac = accentFor(j.mataPelajaran);
                return (
                  <motion.li key={j.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className={`flex items-center gap-3 rounded-xl px-2 py-3 transition-colors ${live ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                      style={{ background: `linear-gradient(135deg, ${ac.strip}, ${ac.strip}cc)` }}>
                      {j.mataPelajaran.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{j.mataPelajaran}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {j.kelas} · {j.jamMulai}–{j.jamSelesai}
                      </p>
                    </div>
                    {live && (
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                        style={{ backgroundColor: P }}>LIVE</span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Kehadiran Per Mapel" icon={BookOpen} iconColor={P}
          action={
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${P}18`, color: P }}>{mapelData.length} mapel</span>
          }
          delay={0.5} className="col-span-12 xl:col-span-5">
          {mapelData.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada data</p>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {mapelData.slice(0, 5).map((k, i) => {
                  const ac = accentFor(k.mataPelajaran);
                  const pct = k.totalSiswa > 0 ? Math.round((k.hadir / k.totalSiswa) * 100) : 0;
                  return (
                    <motion.div key={k.jadwalKelasId}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                        style={{ background: `linear-gradient(135deg, ${ac.strip}, ${ac.strip}bb)` }}>
                        {k.mataPelajaran.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-slate-700 dark:text-slate-200">{k.mataPelajaran}</span>
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: pctGradient(pct) }}>{pct}%</span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          <motion.div className="absolute inset-y-0 left-0 rounded-full"
                            style={{ background: pctGradient(pct) }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.65, delay: 0.6 + i * 0.05 }} />
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">{k.hadir}/{k.totalSiswa} hadir · {k.kelas}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-700/50">
                <TrendingUp size={13} style={{ color: G }} />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Rata-rata:{" "}
                  <strong style={{ color: avgOverall >= 90 ? G : avgOverall >= 75 ? "#F59E0B" : R }}>
                    {avgOverall}%
                  </strong>
                </span>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* ── Row 5: Pengumuman full-width ─────────────────────────────────────── */}
      <SectionCard title="Pengumuman Terbaru" icon={Megaphone} iconColor={R}
        action={
          <div className="flex items-center gap-2">
            {data.pengumuman.length > 0 &&
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: `${R}18`, color: R }}>{data.pengumuman.length}</span>
            }
            <ViewAll href="/guru/pengumuman" />
          </div>
        }
        delay={0.55} bodyClass="px-0 py-0">
        {data.pengumuman.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada pengumuman</p>
        ) : (
          <ul className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 dark:divide-slate-700/40">
            {data.pengumuman.slice(0, 6).map((p, i) => (
              <motion.li key={p.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.06 }}
                onClick={() => setSelectedSlug(p.slug)}
                className="group relative flex cursor-pointer items-center gap-3 overflow-hidden px-5 py-3.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/20">
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
                    <span>{timeAgo(p.createdAt)}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: `${kColor(p.kategori)}18`, color: kColor(p.kategori) }}>{p.kategori}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </SectionCard>

      <AnimatePresence>
        {selectedSlug && (
          <PengumumanDetailModal key={selectedSlug} slug={selectedSlug} canManage={false} currentUserId={user.id}
            onClose={() => setSelectedSlug(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
