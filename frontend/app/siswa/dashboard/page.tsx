"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle, CheckCircle2, XCircle, MinusCircle, TrendingUp,
  Bell, AlertCircle, RefreshCw, ChevronRight, ArrowRight,
  Thermometer, Calendar, Megaphone, Clock, ClipboardCheck, GraduationCap,
  BookOpen, NotebookPen, FileText,
} from "lucide-react";
import GreetingHero from "@/components/dashboard/GreetingHero";
import StatsCard from "@/components/dashboard/StatsCard";
import { QuickAccessGrid } from "@/components/dashboard/QuickAccessCard";
import { StatisticRainbow } from "@/components/dashboard/StatisticRainbow";
import PengumumanDetailModal from "@/components/pengumuman/PengumumanDetailModal";
import { timeAgo } from "@/components/dashboard/ActivityList";
import { WALLET_GRADIENTS, WALLET_ON_TEXT } from "@/components/absensi-harian/shared";


interface Pengumuman {
  id: string; judul: string; slug: string; kategori: string;
  isPinned: boolean; createdAt: string;
  author: { id: string; nama: string; role: string };
  _count: { komentar: number };
}
interface DashboardData {
  kelas: string;
  waliKelas: string | null;
  absensi: { hadir: number; izin: number; sakit: number; alpa: number; total: number; persentase: number };
  magang: { status: "BELUM_MAGANG" | "AKTIF" | "SELESAI"; tempat?: string; hadir?: number };
  pengumuman: Pengumuman[];
}


const P = "#0082FB";
const R = "#EF4444";
const G = "#00D67F";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/60 ${className}`} />;
}

const KATEGORI_COLOR: Record<string, string> = {
  UMUM: P, AKADEMIK: "#0082FB", EKSKUL: G, DARURAT: R,
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
      className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1C2B33] ${className}`}
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
    <div className="space-y-5">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-28" />)}</div>
      <div className="grid grid-cols-12 gap-4">
        <Skeleton className="col-span-12 h-72 xl:col-span-4" />
        <Skeleton className="col-span-12 h-72 xl:col-span-8" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-44" />)}</div>
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

  const { absensi, magang } = data;
  const belumMagang = magang.status === "BELUM_MAGANG";

  const CARDS = [
    {
      href: "/siswa/absensi-harian",
      label: "Absensi Harian",
      value: `${absensi.persentase}% hadir`,
      small: false,
      validThru: data.kelas,
      holder: user.nama,
      gradient: "#0064E0",
      icon: ClipboardCheck,
    },
    {
      href: "/siswa/absensi-harian",
      label: "Total Hadir",
      value: `${absensi.hadir}x`,
      small: false,
      validThru: data.kelas,
      holder: user.nama,
      gradient: "#C3F84A",
      icon: CheckCircle,
    },
    {
      href: "/siswa/pengumuman",
      label: "Pengumuman",
      value: `${data.pengumuman.length} info`,
      small: false,
      validThru: data.kelas,
      holder: user.nama,
      gradient: "#EF4444",
      icon: Megaphone,
    },
    {
      href: "/siswa/magang",
      label: "PKL",
      value: belumMagang ? "Belum PKL" : `${magang.hadir ?? 0}x hadir`,
      small: belumMagang,
      validThru: data.kelas,
      holder: user.nama,
      gradient: "#0082FB",
      icon: GraduationCap,
    },
  ];

  return (
    <>
      <div className="relative isolate -m-4 overflow-hidden lg:hidden">
        <div className="absolute inset-x-0 top-0 h-40 rounded-b-[32px]" style={{ background: "#0082FB" }} />

        <div className="relative z-10 space-y-5 p-4">

        <div className="rounded-3xl bg-white p-3 shadow-[0_10px_28px_-10px_rgba(0,130,251,0.35)] dark:bg-[#1C2B33]">
          <Link
            href="/siswa/absensi-harian"
            className="relative flex flex-col overflow-hidden rounded-2xl p-4 text-white"
            style={{ background: `linear-gradient(135deg, ${P}, #0064E0)` }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-white/8" />
            <div className="relative flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <ClipboardCheck size={17} />
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wide">
                Absensi Harian
              </span>
            </div>
            <div className="relative mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xl font-black leading-none tabular-nums">{absensi.persentase}%</p>
                <p className="mt-1 truncate text-[10.5px] text-white/75">{absensi.hadir} hari hadir bulan ini</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold" style={{ color: P }}>
                Detail <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          <div className="grid grid-cols-5 gap-1.5 pt-4">
            {[
              { href: "/siswa/materi", label: "Materi", icon: BookOpen, color: "#0082FB" },
              { href: "/siswa/pengumuman", label: "Pengumuman", icon: Megaphone, color: "#EF4444", badge: data.pengumuman.length },
              { href: "/siswa/magang", label: "PKL", icon: GraduationCap, color: "#00D67F" },
              { href: "/siswa/ujian-ukk", label: "UKK", icon: FileText, color: "#C3F84A", dark: true },
              { href: "/siswa/catatan-siswa", label: "Catatan", icon: NotebookPen, color: "#0064E0" },
            ].map((s, i) => (
              <motion.div key={s.href}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.05 }}
                whileTap={{ scale: 0.92 }}
              >
                <Link href={s.href} className="flex flex-col items-center gap-1.5">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: `linear-gradient(155deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 55%), ${s.color}`,
                      boxShadow: `0 5px 10px -3px ${s.color}80, inset 0 2px 2px rgba(255,255,255,0.5), inset 0 -3px 4px rgba(0,0,0,0.18)`,
                    }}>
                    <s.icon size={19} style={{ color: s.dark ? "#1C2B33" : "#fff" }} />
                    {!!s.badge && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                        {s.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-center text-[9.5px] font-semibold leading-tight text-slate-600 dark:text-slate-300">{s.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: CheckCircle2, label: "Hadir", value: absensi.hadir },
            { icon: Thermometer, label: "Sakit", value: absensi.sakit },
            { icon: MinusCircle, label: "Alpa", value: absensi.alpa },
            { icon: TrendingUp, label: "Kehadiran", value: `${absensi.persentase}%` },
          ].map((s, i) => {
            const bg = WALLET_GRADIENTS[i];
            const onText = WALLET_ON_TEXT[i];
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.4 + i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-2.5 overflow-hidden rounded-2xl p-3 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)]"
                style={{ background: bg, color: onText }}
              >
                <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full" style={{ backgroundColor: `${onText}26` }} />
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${onText}33` }}>
                  <s.icon size={16} style={{ color: onText }} />
                </span>
                <div className="relative flex min-w-0 items-baseline gap-1.5">
                  <p className="text-sm font-extrabold leading-none">{s.value}</p>
                  <p className="truncate text-[10px] leading-none" style={{ color: `${onText}D9` }}>{s.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1C2B33]">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Statistik Absensi</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Rekap kehadiran semester ini</p>
          <StatisticRainbow
            hadir={absensi.hadir} sakit={absensi.sakit}
            izin={absensi.izin} alpha={absensi.alpa}
            total={absensi.total}
          />
        </div>

        <div className="rounded-3xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1C2B33]">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Pengumuman Terbaru</h2>
            <ViewAll href="/siswa/pengumuman" />
          </div>
          {data.pengumuman.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada pengumuman</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700/40">
              {data.pengumuman.slice(0, 3).map((p) => (
                <li key={p.id}
                  onClick={() => setSelectedSlug(p.slug)}
                  className="flex cursor-pointer items-center gap-3 px-5 py-3.5 active:bg-slate-50 dark:active:bg-slate-700/20">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${kColor(p.kategori)}18` }}>
                    <Bell size={14} style={{ color: kColor(p.kategori) }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-semibold text-slate-800 dark:text-white">{p.judul}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{p.author.nama} · {timeAgo(p.createdAt)}</p>
                  </div>
                  <ChevronRight size={15} className="shrink-0 text-slate-300" />
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
      </div>

      <div className="hidden space-y-5 lg:block">

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <GreetingHero nama={user.nama} role={user.role} kelas={data.kelas} />
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatsCard icon={CheckCircle} label="Hadir"     value={absensi.hadir}      sub="Hari tercatat hadir" index={0} delay={0.05} />
          <StatsCard icon={Thermometer} label="Sakit"     value={absensi.sakit}      sub="Hari izin sakit" index={1} delay={0.10} />
          <StatsCard icon={XCircle}     label="Alpa"      value={absensi.alpa}       sub="Hari tanpa keterangan" index={2} delay={0.15} />
          <StatsCard icon={TrendingUp}  label="Kehadiran" value={absensi.persentase} suffix="%" sub="Persentase keseluruhan" index={3} delay={0.20} />
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-5">

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="col-span-12 rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1C2B33] xl:col-span-4"
          >
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Statistik Absensi</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Rekap kehadiran semester ini</p>
            <StatisticRainbow
              hadir={absensi.hadir} sakit={absensi.sakit}
              izin={absensi.izin} alpha={absensi.alpa}
              total={absensi.total}
            />
            <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-700/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${P}18` }}>
                <Calendar size={16} style={{ color: P }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{data.kelas}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Wali: {data.waliKelas ?? "—"}</p>
              </div>
            </div>
          </motion.div>

          <SectionCard title="Pengumuman Terbaru" icon={Megaphone} iconColor={P}
            action={
              <div className="flex items-center gap-2">
                {data.pengumuman.length > 0 &&
                  <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${P}18`, color: P }}>{data.pengumuman.length}</span>
                }
                <ViewAll href="/siswa/pengumuman" />
              </div>
            }
            delay={0.3} className="col-span-12 xl:col-span-8" bodyClass="px-0 py-0">
            {data.pengumuman.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada pengumuman</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {data.pengumuman.slice(0, 5).map((p, i) => (
                  <motion.li key={p.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
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
                    <span className="shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-bold"
                      style={{ background: `${kColor(p.kategori)}18`, color: kColor(p.kategori) }}>{p.kategori}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <QuickAccessGrid cards={CARDS.map((c) => ({ ...c, footerLeftLabel: "Kelas", footerRightLabel: "Siswa" }))} />

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
