"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, CalendarDays, Clock, MapPin, User, ClipboardList,
} from "lucide-react";

type JadwalDetail = {
  id: string;
  mataPelajaran: string;
  kelas: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruangan?: string | null;
  guru: { id: string; user: { id: string; nama: string } };
};

const TABS = [
  { key: "materi", label: "Materi", icon: BookOpen },
  { key: "tugas", label: "Tugas", icon: ClipboardList },
] as const;

export default function SiswaJadwalDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const [jadwal, setJadwal] = useState<JadwalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jadwal-kelas/${id}`)
      .then((r) => r.json())
      .then((d) => setJadwal(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-5">

      {/* ── Back + Jadwal info card ── */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-[#6334F4] hover:text-[#6334F4] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-purple-500 dark:hover:text-purple-400"
        >
          <ArrowLeft size={16} />
        </motion.button>

        {loading ? (
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-4 w-44 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
            </div>
          </div>
        ) : jadwal ? (
          <div
            className="relative flex flex-1 flex-wrap items-center gap-3 overflow-hidden rounded-2xl py-3 pl-4 pr-5 shadow-md"
            style={{ backgroundColor: "#6334F4" }}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-white">{jadwal.mataPelajaran}</p>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white/90">
                {jadwal.kelas}
              </span>
            </div>
            <div className="relative ml-auto flex flex-wrap items-center gap-3 text-[11px] text-white/70">
              <span className="flex items-center gap-1"><CalendarDays size={11} />{jadwal.hari}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{jadwal.jamMulai}–{jadwal.jamSelesai}</span>
              <span className="flex items-center gap-1"><User size={11} />{jadwal.guru.user.nama}</span>
              {jadwal.ruangan && (
                <span className="flex items-center gap-1"><MapPin size={11} />{jadwal.ruangan}</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Jadwal tidak ditemukan</p>
        )}
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-1.5 rounded-2xl border border-gray-100 bg-gray-50/80 p-1.5 dark:border-slate-700 dark:bg-slate-800/50">
        {TABS.map((tab) => {
          const href = `/siswa/jadwal-kelas/${id}/${tab.key}`;
          const isActive = pathname.endsWith(`/${tab.key}`);
          return (
            <Link
              key={tab.key}
              href={href}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                isActive
                  ? "text-[#6334F4] dark:text-purple-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="siswa-detail-tab-bg"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-slate-700"
                  transition={{ type: "spring", damping: 22, stiffness: 320 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <tab.icon size={15} />
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Tab page content ── */}
      {children}
    </div>
  );
}
