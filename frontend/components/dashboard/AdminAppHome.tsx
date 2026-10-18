"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck, Megaphone, Users, BookOpen, NotebookPen, Briefcase, FileText, Settings,
  GraduationCap, School, CheckCircle2, FileSignature, Thermometer, XCircle, Bell, ChevronRight,
} from "lucide-react";
import { Rocket } from "@/components/app/Rocket";
import { AppCard, AppEmpty, AppSectionTitle, APP_ACCENT, APP_HERO, APP_ORANGE } from "@/components/app/AppUI";
import { icon3dStyle, toneAt } from "@/components/shared/Icon3D";
import { timeAgo } from "@/components/dashboard/ActivityList";

type Pengumuman = {
  id: string; judul: string; slug: string; kategori: string; isPinned: boolean; createdAt: string;
  author: { id: string; nama: string; role: string };
  _count: { komentar: number };
};

export type AdminHomeData = {
  totalSiswa: number; totalGuru: number; totalKelas: number;
  kehadiran: { hadir: number; izin: number; sakit: number; alpa: number; total: number; persen: number };
  pengumuman: Pengumuman[];
  kehadiranPerKelas: { kelas: string; totalSiswa: number; hadir: number; tidakHadir: number; persentase: number }[];
};

const QUICK = [
  { href: "/admin/absensi-harian", label: "Absensi", icon: ClipboardCheck, tone: "emerald" as const },
  { href: "/admin/data-siswa", label: "Data Siswa", icon: Users, tone: "sky" as const },
  { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone, tone: "amber" as const },
  { href: "/admin/materi", label: "Materi", icon: BookOpen, tone: "violet" as const },
  { href: "/admin/catatan-siswa", label: "Catatan", icon: NotebookPen, tone: "indigo" as const },
  { href: "/admin/magang/penempatan", label: "PKL", icon: Briefcase, tone: "emerald" as const },
  { href: "/admin/ujian-ukk/jadwal-soal", label: "UKK", icon: FileText, tone: "sky" as const },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings, tone: "amber" as const },
];

/**
 * Beranda admin untuk aplikasi terpasang (PWA). Header (avatar, sapaan, lonceng)
 * ditangani Topbar; komponen ini berisi banner kehadiran, aksi cepat, ringkasan
 * data, kehadiran per kelas, dan pengumuman terbaru.
 */
export function AdminAppHome({ data, onOpenPengumuman }: { data: AdminHomeData; onOpenPengumuman: (slug: string) => void }) {
  const k = data.kehadiran;
  const ringkas = [
    { label: "Siswa", value: data.totalSiswa, icon: GraduationCap, tone: "indigo" as const },
    { label: "Guru", value: data.totalGuru, icon: Users, tone: "sky" as const },
    { label: "Kelas", value: data.totalKelas, icon: School, tone: "amber" as const },
  ];
  const rekap = [
    { label: "Hadir", value: k.hadir, icon: CheckCircle2, tone: "emerald" as const },
    { label: "Izin", value: k.izin, icon: FileSignature, tone: "sky" as const },
    { label: "Sakit", value: k.sakit, icon: Thermometer, tone: "amber" as const },
    { label: "Alpa", value: k.alpa, icon: XCircle, tone: "violet" as const },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/admin/absensi-harian" className="relative flex items-center overflow-hidden rounded-3xl px-5 py-6" style={{ background: APP_HERO }}>
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative z-10 flex-1">
            <p className="text-xs font-semibold text-white/80">Kehadiran hari ini</p>
            <p className="mt-0.5 text-[34px] font-extrabold leading-none tabular-nums text-white">{k.persen}%</p>
            <p className="mt-1.5 text-sm font-semibold text-white">{k.hadir} dari {data.totalSiswa} siswa hadir</p>
          </div>
          <div className="relative z-10 -my-2 h-24 w-24 shrink-0">
            <Rocket />
          </div>
        </Link>
      </motion.div>

      <section>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Akses Cepat</h2>
        <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-4">
          {QUICK.map((a, i) => (
            <motion.div key={a.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + i * 0.04 }} whileTap={{ scale: 0.94 }}>
              <Link href={a.href} className="flex flex-col items-center gap-2">
                <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(a.tone)}>
                  <a.icon size={26} color="#fff" />
                </span>
                <span className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300">{a.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Ringkasan Data</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {ringkas.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(r.tone)}>
                <r.icon size={26} color="#fff" />
              </span>
              <span className="text-lg font-extrabold leading-none text-slate-900 dark:text-white">{r.value}</span>
              <span className="-mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Rekap Kehadiran</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {rekap.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(r.tone)}>
                <r.icon size={26} color="#fff" />
              </span>
              <span className="text-lg font-extrabold leading-none text-slate-900 dark:text-white">{r.value}</span>
              <span className="-mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <AppSectionTitle>Kehadiran per Kelas</AppSectionTitle>
        {data.kehadiranPerKelas.length === 0 ? (
          <AppEmpty icon={School} title="Belum ada data kehadiran kelas" />
        ) : (
          data.kehadiranPerKelas.map((c, i) => (
            <AppCard key={c.kelas} className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(toneAt(i))}>
                <School size={22} color="#fff" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{c.kelas}</p>
                  <span className="shrink-0 text-sm font-extrabold" style={{ color: "#F26A3D" }}>{c.persentase}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-full rounded-full" style={{ width: `${c.persentase}%`, background: APP_ACCENT }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{c.hadir} hadir dari {c.totalSiswa} siswa</p>
              </div>
            </AppCard>
          ))
        )}
      </section>

      <section className="space-y-3">
        <AppSectionTitle action={<Link href="/admin/pengumuman" className="text-xs font-bold" style={{ color: APP_ORANGE }}>Lihat Semua</Link>}>
          Pengumuman Terbaru
        </AppSectionTitle>
        {data.pengumuman.length === 0 ? (
          <AppEmpty icon={Bell} title="Belum ada pengumuman" />
        ) : (
          data.pengumuman.slice(0, 4).map((p, i) => (
            <AppCard key={p.id} onClick={() => onOpenPengumuman(p.slug)} className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(toneAt(i + 1))}>
                <Megaphone size={22} color="#fff" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{p.judul}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{p.author.nama} • {timeAgo(p.createdAt)}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-300" />
            </AppCard>
          ))
        )}
      </section>
    </div>
  );
}
