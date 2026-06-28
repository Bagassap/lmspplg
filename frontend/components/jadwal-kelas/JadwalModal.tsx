"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Trash2, CalendarDays, BookOpen, GraduationCap,
  User, Clock, MapPin, Sparkles, ChevronDown, Eye,
  Globe, Database, Calculator, Languages, BookText,
  Lightbulb, Code2, Palette, Network, Smartphone,
  GitBranch, BookHeart,
} from "lucide-react";
import type { JadwalItem } from "./WeeklyCalendar";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export type GuruItem = { id: string; user: { id: string; nama: string } };

// ─── Accent palette ───────────────────────────────────────────────────────────

const ACCENTS = [
  { strip: "#977DFF", light: "#F0EDFF", icon: "#E8E2FF", text: "#5B3FBD" },
  { strip: "#0033FF", light: "#EBF0FF", icon: "#DCE8FF", text: "#002BD4" },
  { strip: "#0600AF", light: "#EAECFF", icon: "#D5D9FF", text: "#0500A0" },
  { strip: "#C7B8FF", light: "#FAF8FF", icon: "#EEE8FF", text: "#6B51D1" },
  { strip: "#5C7CFA", light: "#EDF1FF", icon: "#DEE6FF", text: "#3A5BD9" },
  { strip: "#8B5CF6", light: "#F5F0FF", icon: "#EDE8FF", text: "#6D28D9" },
  { strip: "#3B82F6", light: "#EFF6FF", icon: "#DBEAFE", text: "#1D4ED8" },
  { strip: "#6366F1", light: "#EDEFFF", icon: "#E0E7FF", text: "#4338CA" },
];

function accentFor(name: string) {
  let h = 0;
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) & 0x7fffffff);
  return ACCENTS[h % ACCENTS.length];
}

// ─── Subject icon ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SubjectIcon({ name, ...props }: { name: string; size?: number; style?: any; className?: string }) {
  const n = name.toLowerCase();
  const Icon =
    n.includes("web") || n.includes("html") || n.includes("javascript") ? Globe
    : n.includes("basis data") || n.includes("database") || n.includes("sql") ? Database
    : n.includes("matemat") ? Calculator
    : n.includes("inggris") || n.includes("english") ? Languages
    : n.includes("indonesia") ? BookText
    : n.includes("pkk") || n.includes("kewirausahaan") || n.includes("kreatif") ? Lightbulb
    : n.includes("pemrograman") || n.includes("coding") || n.includes("algoritma") ? Code2
    : n.includes("desain") || n.includes("grafis") ? Palette
    : n.includes("jaringan") || n.includes("network") ? Network
    : n.includes("mobile") || n.includes("android") ? Smartphone
    : n.includes("git") || n.includes("struktur data") ? GitBranch
    : n.includes("agama") || n.includes("quran") ? BookHeart
    : BookOpen;
  return <Icon {...props} />;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label, required, optional, icon: Icon, children,
}: {
  label: string; required?: boolean; optional?: boolean;
  icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
        <Icon size={10} className="text-[#6334F4]/70" />
        {label}
        {required && <span className="text-[#FF3644] normal-case">*</span>}
        {optional && <span className="font-normal normal-case text-gray-400">(opsional)</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-all hover:border-gray-300 focus:border-[#6334F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6334F4]/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:bg-slate-800";

const SELECT =
  "w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-2.5 pr-9 text-sm text-gray-800 transition-all hover:border-gray-300 focus:border-[#6334F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6334F4]/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:bg-slate-800";

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  mode: "add" | "edit";
  item?: JadwalItem;
  preHari?: string;
  preJam?: string;
  gurus: GuruItem[];
  saving: boolean;
  onSave: (data: Record<string, string | undefined>) => void;
  onDelete?: () => void;
  onClose: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function JadwalModal({
  open, mode, item, preHari, preJam, gurus, saving, onSave, onDelete, onClose,
}: Props) {
  const [form, setForm] = useState({
    hari:          item?.hari          ?? preHari ?? "Senin",
    jamMulai:      item?.jamMulai      ?? preJam  ?? "07:00",
    jamSelesai:    item?.jamSelesai    ?? "08:30",
    mataPelajaran: item?.mataPelajaran ?? "",
    kelas:         item?.kelas         ?? "",
    guruId:        item?.guru.id       ?? gurus[0]?.id ?? "",
    ruangan:       item?.ruangan       ?? "",
  });

  useEffect(() => {
    if (!form.guruId && gurus.length > 0) setForm((p) => ({ ...p, guruId: gurus[0].id }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gurus]);

  useEffect(() => {
    setForm({
      hari:          item?.hari          ?? preHari ?? "Senin",
      jamMulai:      item?.jamMulai      ?? preJam  ?? "07:00",
      jamSelesai:    item?.jamSelesai    ?? "08:30",
      mataPelajaran: item?.mataPelajaran ?? "",
      kelas:         item?.kelas         ?? "",
      guruId:        item?.guru.id       ?? gurus[0]?.id ?? "",
      ruangan:       item?.ruangan       ?? "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      hari: form.hari, jamMulai: form.jamMulai, jamSelesai: form.jamSelesai,
      mataPelajaran: form.mataPelajaran, kelas: form.kelas,
      guruId: form.guruId, ruangan: form.ruangan || undefined,
    });
  }

  // ── Derived preview values ──
  const ac       = accentFor(form.mataPelajaran || "default");
  const guru     = gurus.find((g) => g.id === form.guruId);
  const guruName = guru?.user.nama ?? "";
  const initials = guruName.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

  const dur = (() => {
    const [sh, sm] = form.jamMulai.split(":").map(Number);
    const [eh, em] = form.jamSelesai.split(":").map(Number);
    const d = (eh * 60 + em) - (sh * 60 + sm);
    if (d <= 0) return null;
    const h = Math.floor(d / 60), m = d % 60;
    return `${h > 0 ? `${h}j ` : ""}${m > 0 ? `${m}m` : ""}`.trim();
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            initial={{ scale: 0.95, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 24 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ── Gradient header ── */}
            <div
              className="relative overflow-hidden px-6 py-5"
              style={{ background: "linear-gradient(135deg, #6334F4 0%, #4318B8 100%)" }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-6 right-14 h-20 w-20 rounded-full bg-white/8" />

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <CalendarDays size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">
                      {mode === "add" ? "Jadwal Baru" : "Mode Edit"}
                    </p>
                    <h2 className="text-base font-extrabold leading-tight text-white">
                      {mode === "add" ? "Tambah Jadwal" : (item?.mataPelajaran ?? "Edit Jadwal")}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white/80 transition-all hover:bg-white/25 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Live preview panel ── */}
            <div className="border-b border-gray-100 bg-linear-to-b from-gray-50 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-900">
              <div className="mb-2.5 flex items-center gap-1.5">
                <Eye size={10} className="text-gray-400 dark:text-slate-600" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-600">
                  Pratinjau
                </p>
              </div>

              {/* Preview card */}
              <div className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {/* Colored strip */}
                <div className="w-1 shrink-0" style={{ backgroundColor: ac.strip }} />

                <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">
                  {/* Row 1: icon + subject name + badges */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: ac.icon }}
                    >
                      <SubjectIcon
                        name={form.mataPelajaran || "default"}
                        size={16}
                        style={{ color: ac.strip }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                        {form.mataPelajaran || (
                          <span className="font-normal italic text-gray-400 dark:text-slate-500">
                            Nama mata pelajaran...
                          </span>
                        )}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {form.kelas ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: ac.light, color: ac.text }}
                          >
                            {form.kelas}
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-gray-400 dark:text-slate-600">Kelas…</span>
                        )}
                        {form.ruangan && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-slate-700 dark:text-slate-400">
                            <MapPin size={8} />
                            {form.ruangan}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: hari·jam | guru */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Time pill */}
                    <div
                      className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: ac.light, color: ac.text }}
                    >
                      <Clock size={9} />
                      <span>{form.hari}</span>
                      <span className="opacity-40">·</span>
                      <span>{form.jamMulai}–{form.jamSelesai}</span>
                      {dur && (
                        <span className="ml-0.5 rounded-full bg-white/50 px-1.5 text-[9px]">{dur}</span>
                      )}
                    </div>

                    {/* Guru chip */}
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${ac.strip}, ${ac.text})` }}
                      >
                        {initials}
                      </div>
                      <span className="max-w-27.5 truncate text-[11px] text-gray-600 dark:text-slate-400">
                        {guruName
                          ? guruName.split(" ").slice(0, 2).join(" ")
                          : <span className="italic text-gray-400 dark:text-slate-600">Pilih guru…</span>
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Form fields (scrollable) ── */}
            <div className="max-h-[40vh] overflow-y-auto">
              <form id="jadwal-form" onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

                {/* Mata Pelajaran */}
                <Field label="Mata Pelajaran" required icon={BookOpen}>
                  <input
                    type="text" required
                    value={form.mataPelajaran}
                    onChange={(e) => set("mataPelajaran", e.target.value)}
                    placeholder="Contoh: Pemrograman Web"
                    className={INPUT}
                  />
                </Field>

                {/* Kelas + Hari */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kelas" required icon={GraduationCap}>
                    <input
                      type="text" required
                      value={form.kelas}
                      onChange={(e) => set("kelas", e.target.value)}
                      placeholder="XII RPL 1"
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Hari" icon={CalendarDays}>
                    <div className="relative">
                      <select value={form.hari} onChange={(e) => set("hari", e.target.value)} className={SELECT}>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </Field>
                </div>

                {/* Guru */}
                <Field label="Guru Pengampu" required icon={User}>
                  <div className="relative">
                    <select required value={form.guruId} onChange={(e) => set("guruId", e.target.value)} className={SELECT}>
                      <option value="">— Pilih Guru —</option>
                      {gurus.map((g) => (
                        <option key={g.id} value={g.id}>{g.user.nama}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </Field>

                {/* Jam Mulai + Selesai */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jam Mulai" required icon={Clock}>
                    <input type="time" required value={form.jamMulai} onChange={(e) => set("jamMulai", e.target.value)} className={INPUT} />
                  </Field>
                  <Field label="Jam Selesai" required icon={Clock}>
                    <input type="time" required value={form.jamSelesai} onChange={(e) => set("jamSelesai", e.target.value)} className={INPUT} />
                  </Field>
                </div>

                {/* Ruangan */}
                <Field label="Ruangan" optional icon={MapPin}>
                  <input
                    type="text"
                    value={form.ruangan}
                    onChange={(e) => set("ruangan", e.target.value)}
                    placeholder="Contoh: Lab Komputer 1"
                    className={INPUT}
                  />
                </Field>
              </form>
            </div>

            {/* ── Footer (always visible) ── */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-slate-800">
              {onDelete ? (
                <motion.button
                  type="button" onClick={onDelete}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-bold text-[#FF3644] transition-colors hover:bg-[#FF3644] hover:text-white dark:border-red-900/40 dark:bg-red-900/20 dark:hover:bg-[#FF3644]"
                >
                  <Trash2 size={13} />
                  Hapus
                </motion.button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button" onClick={onClose}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <motion.button
                  type="submit" form="jadwal-form" disabled={saving}
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 24px #6334F455" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-md transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "#6334F4" }}
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Menyimpan…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      {mode === "add" ? "Tambah" : "Simpan"}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
