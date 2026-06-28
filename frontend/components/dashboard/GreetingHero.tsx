"use client";

import { motion } from "framer-motion";
import { LiveClock } from "@/components/shared/LiveClock";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOTIVASI = [
  "Semangat mengajar hari ini!",
  "Hari yang baik untuk belajar hal baru.",
  "Produktivitas dimulai dari langkah pertama.",
  "Setiap hari adalah kesempatan untuk berkembang.",
  "Bersama membangun generasi yang unggul.",
  "Ilmu yang diajarkan dengan hati selalu berbekas.",
  "Tetap semangat — pelajar Indonesia butuh yang terbaik.",
];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "Admin",  cls: "bg-white/20 text-white" },
  GURU:  { label: "Guru",   cls: "bg-white/20 text-white" },
  SISWA: { label: "Siswa",  cls: "bg-white/20 text-white" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): { emoji: string; text: string } {
  const h = new Date().getHours();
  if (h < 5)  return { emoji: "🌙", text: "Selamat Malam" };
  if (h < 11) return { emoji: "☀️", text: "Selamat Pagi" };
  if (h < 15) return { emoji: "🌤️", text: "Selamat Siang" };
  if (h < 18) return { emoji: "🌅", text: "Selamat Sore" };
  return { emoji: "🌙", text: "Selamat Malam" };
}

function getFirstName(nama: string) {
  return nama.trim().split(/\s+/)[0] ?? nama;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const motivasi    = MOTIVASI[new Date().getDay() % MOTIVASI.length];

  return (
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
      style={{ background: "linear-gradient(135deg,#6334F4 0%,#8B5CF6 40%,#EC4899 80%,#F97316 100%)" }}
    >
      {/* Dekorasi circles */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-14 right-28 h-52 w-52 rounded-full bg-white/6" />
      <div className="pointer-events-none absolute top-3 left-[45%] h-24 w-24 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-white/5" />
      {/* Subtle mesh overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(0,0,0,0.12) 0%, transparent 50%)",
        }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          {/* Emoji + salam */}
          <div className="flex flex-wrap items-center gap-2">
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 300, delay: 0.05 }}
              className="select-none text-2xl sm:text-3xl"
            >
              {emoji}
            </motion.span>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-wrap items-baseline gap-2"
            >
              <h1 className="text-lg font-extrabold leading-tight text-white sm:text-xl md:text-2xl">
                {text},{" "}
                <span className="text-white/90">{firstName}!</span>
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                {badge.label}
              </span>
              {kelas && (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white/80">
                  {kelas}
                </span>
              )}
            </motion.div>
          </div>

          {/* Motivasi */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-1.5 text-xs text-white/65 sm:text-sm"
          >
            {motivasi}
          </motion.p>
        </div>

        {/* LiveClock — di bawah greeting di mobile, pojok kanan di desktop */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="shrink-0 self-start"
        >
          <LiveClock variant="header" />
        </motion.div>
      </div>
    </div>
  );
}
