"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck, Megaphone, Users, NotebookPen, GraduationCap, CheckCircle2,
  FileSignature, Thermometer, XCircle, Bell, ChevronRight,
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

export type GuruHomeData = {
  kelasWali: { id: string; nama: string }[];
  siswaAmpu: number;
  kehadiran: { hadir: number; izin: number; sakit: number; alpa: number; total: number; persen: number };
  pengumuman: Pengumuman[];
};

const QUICK = [
  { href: "/guru/absensi-harian", label: "Absensi", icon: ClipboardCheck, tone: "emerald" as const },
  { href: "/guru/data-siswa", label: "Data Siswa", icon: Users, tone: "sky" as const },
  { href: "/guru/pengumuman", label: "Pengumuman", icon: Megaphone, tone: "amber" as const },
  { href: "/guru/catatan-siswa", label: "Catatan", icon: NotebookPen, tone: "violet" as const },
];

/**
 * Beranda guru untuk aplikasi terpasang (PWA). Header (avatar, sapaan, lonceng)
 * ditangani Topbar; komponen ini berisi banner kehadiran, aksi cepat, ringkasan,
 * kelas wali, dan pengumuman terbaru.
 */
export function GuruAppHome({ data, onOpenPengumuman }: { data: GuruHomeData; onOpenPengumuman: (slug: string) => void }) {
  const k = data.kehadiran;
  const rekap = [
    { label: "Hadir", value: k.hadir, icon: CheckCircle2, tone: "emerald" as const },
    { label: "Izin", value: k.izin, icon: FileSignature, tone: "sky" as const },
    { label: "Sakit", value: k.sakit, icon: Thermometer, tone: "amber" as const },
    { label: "Alpa", value: k.alpa, icon: XCircle, tone: "violet" as const },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/guru/absensi-harian" className="relative flex items-center overflow-hidden rounded-3xl px-5 py-6" style={{ background: APP_HERO }}>
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative z-10 flex-1">
            <p className="text-xs font-semibold text-white/80">Kehadiran hari ini</p>
            <p className="mt-0.5 text-[34px] font-extrabold leading-none tabular-nums text-white">{k.persen}%</p>
            <p className="mt-1.5 text-sm font-semibold text-white">{k.hadir} siswa hadir dari {data.siswaAmpu} siswa diampu</p>
          </div>
          <div className="relative z-10 -my-2 h-24 w-24 shrink-0">
            <Rocket />
          </div>
        </Link>
      </motion.div>

      <section>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Akses Cepat</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {QUICK.map((a, i) => (
            <motion.div key={a.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }} whileTap={{ scale: 0.94 }}>
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
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Rekap Kehadiran</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {rekap.map((r, i) => (
            <motion.div key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }} className="flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(r.tone)}>
                <r.icon size={26} color="#fff" />
              </span>
              <span className="text-lg font-extrabold leading-none text-slate-900 dark:text-white">{r.value}</span>
              <span className="-mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{r.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <AppSectionTitle>Kelas Wali Saya</AppSectionTitle>
        {data.kelasWali.length === 0 ? (
          <AppEmpty icon={GraduationCap} title="Anda belum menjadi wali kelas" />
        ) : (
          data.kelasWali.map((kls, i) => (
            <AppCard key={kls.id} className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(toneAt(i))}>
                <GraduationCap size={24} color="#fff" />
              </span>
              <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{kls.nama}</p>
            </AppCard>
          ))
        )}
      </section>

      <section className="space-y-3">
        <AppSectionTitle action={<Link href="/guru/pengumuman" className="text-xs font-bold" style={{ color: APP_ORANGE }}>Lihat Semua</Link>}>
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
