"use client";

import { motion } from "framer-motion";
import {
  Briefcase, Lock, MapPin, CalendarCheck, BarChart3,
  FileText, Clock, Sparkles,
} from "lucide-react";

const features = [
  { icon: MapPin,        label: "Penempatan",  desc: "Lokasi & data DU/DI" },
  { icon: CalendarCheck, label: "Absensi",     desc: "Catatan kehadiran" },
  { icon: BarChart3,     label: "Monitoring",  desc: "Progres harian" },
  { icon: FileText,      label: "Rekap",       desc: "Laporan akhir" },
];

const steps = [
  { label: "Persiapan",    active: false, done: true  },
  { label: "Magang Aktif", active: true,  done: false },
  { label: "Selesai",      active: false, done: false },
];

interface Props { role?: "guru" | "siswa"; }

export default function MagangComingSoon({ role = "siswa" }: Props) {
  const isGuru = role === "guru";

  return (
    <div className="w-full flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">

          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#6334F4,#8B5CF6,#EC4899,#F97316)" }}/>

          <div className="px-6 sm:px-10 py-10 flex flex-col items-center text-center gap-6">

            <div className="relative w-20 h-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-violet-300 dark:border-violet-500/40"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_6px_#8B5CF6]"/>
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-3 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg,#6334F4,#8B5CF6,#EC4899)" }}
              >
                <Briefcase size={22} className="text-white" strokeWidth={1.8}/>
              </motion.div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <Lock size={10} className="text-red-500 dark:text-red-400"/>
              <span className="text-[11px] font-bold tracking-widest text-red-500 dark:text-red-400 uppercase">Belum Aktif</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
                Program{" "}
                <span style={{
                  background: "linear-gradient(135deg,#8B5CF6,#EC4899,#F97316)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Magang
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isGuru
                  ? "Menu ini akan aktif ketika program magang siswa resmi dimulai"
                  : "Menu ini akan aktif ketika jadwal magang kamu telah dimulai"}
              </p>
            </div>

            <div className="flex items-center justify-center w-full gap-0">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                        step.done
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15"
                          : step.active
                          ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10"
                          : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40"
                      }`}
                    >
                      {step.done ? (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#10B981" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : step.active ? (
                        <Lock size={12} className="text-violet-500 dark:text-violet-400"/>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"/>
                      )}
                    </motion.div>
                    <span className={`text-[11px] font-semibold ${
                      step.done
                        ? "text-emerald-500"
                        : step.active
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-slate-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 sm:w-16 h-px mx-2 mb-4 ${
                      step.done ? "bg-emerald-300 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-slate-700"
                    }`}/>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.08 }}
                  className="relative rounded-xl p-3 flex flex-col items-center gap-1.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700"
                >
                  <Lock size={9} className="absolute top-1.5 right-1.5 text-slate-300 dark:text-slate-600"/>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-500/10">
                    <f.icon size={15} className="text-violet-400 dark:text-violet-400 opacity-70"/>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{f.label}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center leading-tight hidden sm:block">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-start gap-3 px-4 py-4 rounded-xl text-left w-full bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20"
            >
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 mt-0.5">
                <Clock size={14} className="text-violet-600 dark:text-violet-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-0.5">
                  Menunggu Jadwal Magang
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isGuru
                    ? "Semua fitur pemantauan, absensi, dan rekap siswa akan tersedia setelah program magang resmi dibuka oleh admin."
                    : "Fitur penempatan, absensi harian, monitoring progres, dan rekap laporan akan terbuka setelah magang kamu resmi dimulai."}
                </p>
              </div>
            </motion.div>

            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <Sparkles size={12} className="text-violet-400"/>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Pantau pengumuman dari {isGuru ? "koordinator magang" : "pembimbing magang"} Anda
              </span>
              <Sparkles size={12} className="text-pink-400"/>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
