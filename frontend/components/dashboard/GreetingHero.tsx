"use client";

import { motion } from "framer-motion";

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "Admin",  cls: "bg-[#F1EDFA] text-[#3E03B3] dark:bg-[#000000]/30 dark:text-[#8F6DD3]" },
  GURU:  { label: "Guru",   cls: "bg-[#F1EDFA] text-[#3E03B3] dark:bg-[#000000]/30 dark:text-[#8F6DD3]" },
  SISWA: { label: "Siswa",  cls: "bg-[#F1EDFA] text-[#3E03B3] dark:bg-[#000000]/30 dark:text-[#8F6DD3]" },
};

function jakartaHour(): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
}

function getGreeting(): { emoji: string; text: string } {
  const h = jakartaHour();
  if (h < 5)  return { emoji: "🌙", text: "Selamat Malam" };
  if (h < 11) return { emoji: "☀️", text: "Selamat Pagi" };
  if (h < 15) return { emoji: "🌤️", text: "Selamat Siang" };
  if (h < 18) return { emoji: "🌅", text: "Selamat Sore" };
  return { emoji: "🌙", text: "Selamat Malam" };
}

function getFirstName(nama: string) {
  return nama.trim().split(/\s+/)[0] ?? nama;
}

export default function GreetingHero({
  nama,
  role,
  kelas,
}: {
  nama: string;
  role: string;
  kelas?: string;
}) {
  const { emoji, text } = getGreeting();
  const firstName   = getFirstName(nama);
  const badge       = ROLE_BADGE[role] ?? ROLE_BADGE.SISWA;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white px-6 py-7 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:px-8 md:py-8">
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-nowrap items-center gap-1.5 sm:flex-wrap sm:gap-2">
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 300, delay: 0.05 }}
              className="shrink-0 select-none text-xl sm:text-3xl"
            >
              {emoji}
            </motion.span>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex min-w-0 flex-nowrap items-baseline gap-1.5 sm:flex-wrap sm:gap-2"
            >
              <h1 className="min-w-0 truncate text-base font-extrabold leading-tight text-slate-800 dark:text-white sm:text-xl md:text-2xl">
                {text},{" "}
                <span className="text-slate-500 dark:text-slate-300">{firstName}!</span>
              </h1>
              <span className={`hidden shrink-0 rounded-lg px-2.5 py-0.5 text-[10px] font-bold sm:inline-block ${badge.cls}`}>
                {badge.label}
              </span>
              {kelas && (
                <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300 sm:px-2.5 sm:text-[10px]">
                  {kelas}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
