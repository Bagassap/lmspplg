"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, ClipboardCheck, Megaphone, GraduationCap, FileText,
  ClipboardList, Clock, CheckCircle2,
} from "lucide-react";
import { icon3dStyle, TONE_ORDER } from "@/components/shared/Icon3D";
import { formatTgl, isTugasActive, type TugasItem } from "@/components/tugas/types";
import type { MateriItem } from "@/components/materi/MateriFormModal";
import { useSiswaFitur } from "@/components/dashboard/useDashboardMenu";
import { Rocket } from "@/components/app/Rocket";
import { APP_HERO, APP_ORANGE } from "@/components/app/AppUI";

const ACCENT = "#3E03B3";
const PURPLE = "#3E03B3";
const MAX_ITEMS = 5;

type Tab = "materi" | "tugas";

const QUICK_ACTIONS = [
  { key: "absensi", href: "/siswa/absensi-harian", label: "Absensi", icon: ClipboardCheck, tone: "emerald" as const },
  { key: "pengumuman", href: "/siswa/pengumuman", label: "Pengumuman", icon: Megaphone, tone: "sky" as const },
  { key: "magang", href: "/siswa/magang", label: "PKL", icon: GraduationCap, tone: "amber" as const },
  { key: "ukk", href: "/siswa/ujian-ukk", label: "UKK", icon: FileText, tone: "violet" as const },
];

function relDeadline(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Berakhir";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${Math.max(hours, 1)} jam lagi`;
  return `${Math.floor(hours / 24)} hari lagi`;
}

function MetaIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${color}22`, color }}>
      {children}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-700/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700/60" />
            <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-700/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Beranda siswa untuk aplikasi terpasang (PWA). Header (avatar, sapaan, lonceng)
 * ditangani Topbar; komponen ini berisi banner absen, aksi cepat, dan daftar
 * Materi/Tugas.
 */
export function SiswaAppHome() {
  const fitur = useSiswaFitur();
  const [tab, setTab] = useState<Tab>("materi");
  const [materi, setMateri] = useState<MateriItem[] | null>(null);
  const [tugas, setTugas] = useState<TugasItem[] | null>(null);

  useEffect(() => {
    fetch("/api/materi").then((r) => r.json()).then((d) => setMateri(Array.isArray(d) ? d : [])).catch(() => setMateri([]));
    fetch("/api/tugas").then((r) => r.json()).then((d) => setTugas(Array.isArray(d) ? d : [])).catch(() => setTugas([]));
  }, []);

  const materiList = useMemo(
    () => [...(materi ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [materi],
  );
  const tugasList = useMemo(() => {
    const all = tugas ?? [];
    const aktif = all.filter(isTugasActive).sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
    const lewat = all.filter((t) => !isTugasActive(t)).sort((a, b) => +new Date(b.deadline) - +new Date(a.deadline));
    return [...aktif, ...lewat];
  }, [tugas]);

  const loading = tab === "materi" ? materi === null : tugas === null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link
          href="/siswa/absensi-harian"
          className="relative flex items-center overflow-hidden rounded-3xl px-5 py-6"
          style={{ background: APP_HERO }}
        >
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative z-10 flex-1">
            <svg viewBox="0 0 28 22" className="absolute -left-1 -top-3 h-5 w-6" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 9 L9 12" />
              <path d="M7 3 L11 8" />
              <path d="M14 1 L14 7" />
            </svg>
            <p className="text-[22px] font-extrabold leading-tight text-white">
              Jangan Lupa
              <br />
              Absen Hari Ini
            </p>
          </div>
          <div className="relative z-10 -my-2 h-24 w-24 shrink-0">
            <Rocket />
          </div>
        </Link>
      </motion.div>

      <section>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Akses Cepat</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a, i) => (
            <motion.div
              key={a.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.94 }}
            >
              <Link href={a.key === "magang" ? fitur.magangHref : a.key === "ukk" ? fitur.ukkHref : a.href} className="flex flex-col items-center gap-2">
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
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Materi &amp; Tugas</h2>

        <div className="mt-4 flex gap-7 border-b border-slate-200 dark:border-slate-700/60">
          {([["materi", "Materi"], ["tugas", "Tugas"]] as const).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="relative pb-3 text-[15px] font-semibold transition-colors"
                style={{ color: active ? ACCENT : "#94a3b8" }}
              >
                {label}
                {active && (
                  <motion.span layoutId="app-home-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ background: "#F26A3D" }} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {loading ? (
            <ListSkeleton />
          ) : tab === "materi" ? (
            materiList.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada materi</p>
            ) : (
              <ul className="space-y-5">
                {materiList.slice(0, MAX_ITEMS).map((m, i) => (
                  <li key={m.id}>
                    <Link href={`/siswa/materi/${m.id}`} className="flex items-center gap-4 active:opacity-70">
                      <span
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                        style={icon3dStyle(TONE_ORDER[i % TONE_ORDER.length])}
                      >
                        <BookOpen size={26} color="#fff" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MetaIcon color={PURPLE}><FileText size={11} /></MetaIcon>
                            <span className="truncate">{m.mapel}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <MetaIcon color="#F26A3D"><Clock size={11} /></MetaIcon>
                            {formatTgl(m.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-slate-900 dark:text-white">{m.judul}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : tugasList.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada tugas</p>
          ) : (
            <ul className="space-y-5">
              {tugasList.slice(0, MAX_ITEMS).map((t, i) => {
                const terkumpul = (t.submisi?.length ?? 0) > 0;
                const aktif = isTugasActive(t);
                return (
                  <li key={t.id}>
                    <Link
                      href="/siswa/materi?tab=tugas"
                      className="flex items-center gap-4 active:opacity-70"
                    >
                      <span
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                        style={icon3dStyle(TONE_ORDER[(i + 2) % TONE_ORDER.length])}
                      >
                        <ClipboardList size={26} color="#fff" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MetaIcon color={PURPLE}><FileText size={11} /></MetaIcon>
                            <span className="truncate">{t.mapel}</span>
                          </span>
                          {terkumpul ? (
                            <span className="flex shrink-0 items-center gap-1.5 font-semibold text-[#5D900F]">
                              <MetaIcon color="#3E03B3"><CheckCircle2 size={11} /></MetaIcon>
                              Terkumpul
                            </span>
                          ) : (
                            <span className="flex shrink-0 items-center gap-1.5" style={{ color: aktif ? undefined : "#94a3b8" }}>
                              <MetaIcon color="#F26A3D"><Clock size={11} /></MetaIcon>
                              {relDeadline(t.deadline)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-slate-900 dark:text-white">{t.judul}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && (tab === "materi" ? materiList : tugasList).length > MAX_ITEMS && (
            <Link href="/siswa/materi" className="mt-6 block rounded-2xl py-3 text-center text-sm font-bold" style={{ background: "#F1EDFA", color: ACCENT }}>
              Lihat Semua
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
