"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Briefcase, ChevronRight, ClipboardCheck, ClipboardList, FileText, Megaphone } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { icon3dStyle, type Tone3D } from "@/components/shared/Icon3D";
import { Rocket } from "@/components/app/Rocket";
import { useSiswaFitur } from "@/components/dashboard/useDashboardMenu";

type Role = "ADMIN" | "GURU" | "SISWA";

type Menu = { label: string; href: string; icon: typeof Briefcase; tone: Tone3D; bg: string; clr: string };

function sapaan(): string {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (h < 11) return "Selamat pagi,";
  if (h < 15) return "Selamat siang,";
  if (h < 18) return "Selamat sore,";
  return "Selamat malam,";
}

export function MobileHome({ role, ringkasan }: {
  role: Role;
  ringkasan: { label: string; value: string };
}) {
  const base = `/${role.toLowerCase()}`;
  const fitur = useSiswaFitur(role === "SISWA");
  const [me, setMe] = useState<{ nama: string; fotoProfil?: string | null } | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let batal = false;
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!batal && d) setMe(d); }).catch(() => {});
    fetch("/api/notifications/unread-count", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!batal) setUnread(d?.count ?? 0); }).catch(() => {});
    return () => { batal = true; };
  }, []);

  const menu: Menu[] = [
    { label: "Absen", href: `${base}/absensi-harian`, icon: ClipboardCheck, tone: "emerald", bg: "#E4F5EC", clr: "#22A06B" },
    { label: "Tugas", href: `${base}/materi?tab=tugas`, icon: ClipboardList, tone: "sky", bg: "#E0F2FE", clr: "#0EA5E9" },
    { label: "UKK", href: role === "SISWA" ? fitur.ukkHref : `${base}/ujian-ukk/jadwal-soal`, icon: FileText, tone: "violet", bg: "#F1EDFA", clr: "#3E03B3" },
    { label: "PKL", href: role === "SISWA" ? fitur.magangHref : `${base}/magang/penempatan`, icon: Briefcase, tone: "amber", bg: "#FFE9E2", clr: "#F26A3D" },
  ];

  const nama = me?.nama ?? "";
  const namaDepan = nama.split(" ")[0] ?? "";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Avatar src={me?.fotoProfil} nama={nama || "?"} sizePx={46} fallbackBg={avatarColorFor(nama || "?")} textClassName="text-sm font-extrabold" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">{sapaan()}</p>
          <p className="truncate text-xl font-extrabold leading-tight text-slate-900 dark:text-white">{namaDepan} 👋</p>
        </div>
        <Link href={`${base}/notifikasi`} aria-label="Notifikasi"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.08)] dark:bg-slate-800 dark:text-slate-200">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="relative flex items-center gap-3 overflow-hidden rounded-3xl px-5 py-5"
        style={{ background: "linear-gradient(135deg, #2D0281 0%, #3E03B3 100%)" }}>
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative min-w-0 flex-1">
          <p className="text-xs font-semibold text-white/70">{ringkasan.label}</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-white">{ringkasan.value}</p>
        </div>
        <Link href={`${base}/absensi-harian`}
          className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-[#F26A3D] px-4 text-sm font-bold text-white">
          <ClipboardCheck size={16} /> {role === "SISWA" ? "Absen" : "Lihat"}
        </Link>
      </motion.div>

      <Link href={`${base}/absensi-harian`}
        className="relative flex items-center gap-3 overflow-hidden rounded-3xl px-5 py-3"
        style={{ background: "#FFE9E2" }}>
        <p className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Jangan lupa absen hari ini</p>
        <ArrowRight size={16} className="shrink-0 text-[#F26A3D]" />
        <span className="h-14 w-14 shrink-0"><Rocket /></span>
      </Link>

      <section>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Menu Utama</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {menu.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }} whileTap={{ scale: 0.97 }}>
              <Link href={m.href} className="flex h-full flex-col justify-between gap-6 rounded-3xl p-4" style={{ background: m.bg }}>
                <span className="flex h-16 w-16 items-center justify-center self-center rounded-[22px]" style={icon3dStyle(m.tone)}>
                  <m.icon size={28} color="#fff" />
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{m.label}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: m.clr }}>
                    <ArrowRight size={15} />
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <Link href={`${base}/pengumuman`}
        className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:bg-slate-800">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#E0F2FE", color: "#0EA5E9" }}>
          <Megaphone size={18} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">Pengumuman</span>
        <ChevronRight size={18} className="shrink-0 text-slate-400" />
      </Link>
    </div>
  );
}
