"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, FileText, Download, Trash2, Plus, Clock,
  MapPin, User, ChevronDown, ChevronUp, Send, CheckCircle,
  AlertCircle, X, Pencil, Upload, BookOpen, ChevronLeft,
  ChevronRight, CloudUpload, Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/shared/ToastSystem";

const SoalPdfViewer = dynamic(() => import("./SoalPdfViewer"), { ssr: false, loading: () => (
  <div className="flex-1 flex items-center justify-center py-20">
    <Loader2 size={28} className="animate-spin text-amber-500"/>
  </div>
)});

const PRIMARY = "#4F8EF7";

// Boltz dashboard palette
const PALETTE = [
  { bg: "#EEF4FF", text: "#4F8EF7",  bar: "#4F8EF7",  gradient: "linear-gradient(135deg,#4F8EF7,#6366F1)" },
  { bg: "#ECFDF5", text: "#10B981",  bar: "#10B981",  gradient: "linear-gradient(135deg,#10B981,#0D9488)" },
  { bg: "#FFF1F2", text: "#EF4444",  bar: "#EF4444",  gradient: "linear-gradient(135deg,#EF4444,#F97316)" },
  { bg: "#FFFBEB", text: "#F59E0B",  bar: "#F59E0B",  gradient: "linear-gradient(135deg,#F59E0B,#EF4444)" },
  { bg: "#F0F0FF", text: "#6366F1",  bar: "#6366F1",  gradient: "linear-gradient(135deg,#6366F1,#8B5CF6)" },
];
function rowPalette(idx: number) { return PALETTE[idx % PALETTE.length]; }

type StatusSubmisi = "TERKIRIM" | "DITERIMA" | "REVISI";

interface Soal { id: string; judul: string; deskripsi?: string; fileUrl: string; fileName: string; _count?: { submisi: number }; }
interface Tahapan { id: string; hariKe: number; judul: string; tanggal: string; jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string; keterangan?: string; soal: Soal[]; }
interface Submisi { id: string; fileUrl: string; fileName: string; catatan?: string; pesanRevisi?: string; status: StatusSubmisi; submittedAt: string; soal: { id: string; judul: string }; siswa: { id: string; nama: string; user: { id: string; nama: string } }; }
interface DiskusiItem { id: string; konten: string; createdAt: string; user: { id: string; nama: string; role: string }; replies: DiskusiItem[]; }

function formatTgl(s: string) { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
function formatTime(s: string) { return new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); }
function statusBadge(s: StatusSubmisi) {
  if (s === "DITERIMA") return { bg: "#ECFDF5", text: "#10B981", icon: <CheckCircle size={10} /> };
  if (s === "REVISI")   return { bg: "#FFFBEB", text: "#F59E0B", icon: <AlertCircle size={10} /> };
  return { bg: "#EEF4FF", text: "#4F8EF7", icon: <Clock size={10} /> };
}
function roleAvatar(role: string) { const m: Record<string, string> = { ADMIN: "#6366F1", GURU: "#4F8EF7", SISWA: "#10B981" }; return m[role] ?? "#64748b"; }

// ── Calendar ──────────────────────────────────────────────────────────────────

function Calendar({ tahapanList }: { tahapanList: Tahapan[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ukkDateObjs = tahapanList
    .map((t) => { const d = new Date(t.tanggal); d.setHours(0,0,0,0); return d; })
    .sort((a, b) => a.getTime() - b.getTime());
  const ukkDateStrings = new Set(ukkDateObjs.map((d) => d.toDateString()));

  // Minggu aktif: mulai Senin dari minggu yg mengandung UKK pertama, fallback minggu sekarang
  function getMondayOf(d: Date) {
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    mon.setHours(0,0,0,0);
    return mon;
  }

  const initMonday = getMondayOf(ukkDateObjs[0] ?? today);
  const [weekStart, setWeekStart] = useState<Date>(initMonday);

  useEffect(() => {
    setWeekStart(getMondayOf(ukkDateObjs[0] ?? today));
  }, [tahapanList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const week: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Label bulan — tampilkan bulan/tahun dari hari pertama minggu
  const monthLabel = weekStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  // Peta tanggal → tahapan
  const byDate: Record<string, Tahapan[]> = {};
  for (const t of tahapanList) {
    const key = new Date(t.tanggal).toDateString();
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(t);
  }

  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">{monthLabel}</span>
        <div className="flex gap-1">
          <button onClick={prevWeek}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <ChevronLeft size={13} />
          </button>
          <button onClick={nextWeek}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Day name + date — 7 kolom */}
      <div className="grid grid-cols-7">
        {week.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const isUkk   = ukkDateStrings.has(d.toDateString());
          const tasks   = byDate[d.toDateString()] ?? [];
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 relative group">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{dayNames[i]}</span>
              <div
                className="w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all cursor-default select-none"
                style={{
                  background: isUkk ? "#4F8EF7" : "transparent",
                  color:      isUkk ? "#fff" : isToday ? "#4F8EF7" : "inherit",
                  fontWeight: isUkk || isToday ? 700 : 400,
                }}>
                {d.getDate()}
              </div>
              {/* Tooltip */}
              {isUkk && tasks.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 hidden group-hover:flex flex-col gap-0.5 z-20 pointer-events-none">
                  {tasks.map((tk) => (
                    <div key={tk.id}
                      className="whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-lg text-white"
                      style={{ background: "#4F8EF7" }}>
                      {tk.judul}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Diskusi ────────────────────────────────────────────────────────────────────

const ROLE_CHIP: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: "#EEF2FF", text: "#6366F1", label: "Admin" },
  GURU:  { bg: "#EFF6FF", text: "#3B82F6", label: "Guru"  },
  SISWA: { bg: "#F0FDF4", text: "#16A34A", label: "Siswa" },
};
const BUBBLE_COLORS = [
  { bubble: "#EEF2FF", text: "#4338CA", avatar: "linear-gradient(135deg,#6366F1,#818CF8)" },
  { bubble: "#F0FDF4", text: "#15803D", avatar: "linear-gradient(135deg,#10B981,#34D399)" },
  { bubble: "#FFF7ED", text: "#C2410C", avatar: "linear-gradient(135deg,#F97316,#FBBF24)" },
  { bubble: "#FDF4FF", text: "#7E22CE", avatar: "linear-gradient(135deg,#A855F7,#EC4899)" },
  { bubble: "#ECFEFF", text: "#0E7490", avatar: "linear-gradient(135deg,#06B6D4,#3B82F6)" },
];
function bubbleFor(id: string) { let h=0; for(const c of id) h=(h*31+c.charCodeAt(0))>>>0; return BUBBLE_COLORS[h%BUBBLE_COLORS.length]; }

function DiskusiActivity({ currentUserId }: { currentUserId: string }) {
  const [list, setList] = useState<DiskusiItem[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; nama: string } | null>(null);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => { const r = await fetch("/api/ujian-ukk/diskusi"); if (r.ok) setList(await r.json()); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [list]);

  async function send() {
    if (!input.trim()) return;
    setSending(true);
    const body: Record<string, string> = { konten: input.trim() };
    if (replyTo) body.parentId = replyTo.id;
    const r = await fetch("/api/ujian-ukk/diskusi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSending(false);
    if (r.ok) { setInput(""); setReplyTo(null); load(); } else toast.error("Gagal mengirim", "");
  }

  async function hapus(id: string) { const r = await fetch(`/api/ujian-ukk/diskusi/${id}`, { method: "DELETE" }); if (r.ok) load(); }

  const all = list.flatMap((d) => [d, ...d.replies]);
  const totalMsg = all.length;

  return (
    <div className="flex flex-col rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden" style={{ minHeight: 0 }}>
      {/* ── Gradient header ── */}
      <div className="relative px-5 py-4 shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)" }}>
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none"/>
        <div className="absolute -bottom-6 right-20 w-28 h-28 rounded-full bg-white/8 pointer-events-none"/>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Send size={15} className="text-white"/>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Forum</p>
              <p className="text-sm font-extrabold text-white">Diskusi UKK</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-white leading-none">{totalMsg}</p>
            <p className="text-[10px] text-white/60 font-semibold">pesan</p>
          </div>
        </div>
      </div>

      {/* ── Message list ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white dark:bg-slate-800" style={{ minHeight: 0 }}>
        {all.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6366F122,#EC489922)" }}>
              <Send size={22} className="text-purple-300"/>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Belum ada diskusi</p>
            <p className="text-xs text-slate-400 mt-1">Mulai percakapan di bawah</p>
          </div>
        )}
        {all.map((d) => {
          const bc   = bubbleFor(d.user.id);
          const chip = ROLE_CHIP[d.user.role] ?? { bg:"#F1F5F9", text:"#64748B", label:d.user.role };
          const isReply = list.every(top => top.id !== d.id);
          return (
            <motion.div key={d.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              className={`flex gap-2.5 ${isReply ? "ml-8" : ""}`}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-sm"
                style={{ background: bc.avatar }}>
                {d.user.nama[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {/* Name + role + time */}
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{d.user.nama}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: chip.bg, color: chip.text }}>{chip.label}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{formatTime(d.createdAt)}</span>
                </div>
                {/* Bubble */}
                <div className="rounded-2xl rounded-tl-none px-3 py-2 inline-block max-w-full"
                  style={{ backgroundColor: bc.bubble }}>
                  <p className="text-xs leading-relaxed break-words" style={{ color: bc.text }}>{d.konten}</p>
                </div>
                {/* Actions */}
                <div className="flex gap-3 mt-1">
                  <button onClick={() => setReplyTo({ id: d.id, nama: d.user.nama })}
                    className="text-[10px] font-semibold text-slate-400 hover:text-indigo-500 transition-colors">
                    Balas
                  </button>
                  {d.user.id === currentUserId && (
                    <button onClick={() => hapus(d.id)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors">
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ backgroundColor: "#EEF2FF", color: "#6366F1" }}>
            <ChevronRight size={11}/> Balas ke <strong>{replyTo.nama}</strong>
            <button onClick={() => setReplyTo(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={11}/></button>
          </div>
        )}
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Tulis pesan..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all placeholder:text-slate-300"/>
          <button onClick={send} disabled={sending || !input.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white shrink-0 disabled:opacity-40 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
            {sending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Tambah/Edit Tahapan ─────────────────────────────────────────────────

interface TahapanForm { hariKe: number; judul: string; tanggal: string; jamMulai: string; jamSelesai: string; lokasi: string; penguji: string; keterangan: string; }

const INPUT_CLS = "w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500";

function TahapanModal({ open, onClose, onSave, initial }: { open: boolean; onClose: () => void; onSave: (d: TahapanForm) => Promise<void>; initial?: Partial<TahapanForm>; }) {
  const [form, setForm] = useState<TahapanForm>({ hariKe: 1, judul: "", tanggal: "", jamMulai: "08:00", jamSelesai: "12:00", lokasi: "", penguji: "", keterangan: "", ...initial });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.judul;
  useEffect(() => { if (open) setForm({ hariKe: 1, judul: "", tanggal: "", jamMulai: "08:00", jamSelesai: "12:00", lokasi: "", penguji: "", keterangan: "", ...initial }); }, [open, initial]);
  function set(k: keyof TahapanForm, v: string | number) { setForm((p) => ({ ...p, [k]: v })); }
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div initial={{ scale: 0.93, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 24 }} transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "92vh" }}>

            {/* ── Gradient header ── */}
            <div className="relative flex items-center gap-4 px-6 py-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1,#818CF8)" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none"/>
              <div className="absolute -bottom-6 right-20 w-28 h-28 rounded-full bg-white/7 pointer-events-none"/>
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
                <CalendarDays size={20} className="text-white"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">My Task</p>
                <h2 className="text-base font-extrabold text-white mt-0.5">{isEdit ? "Edit Task UKK" : "Tambah Task UKK"}</h2>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors shrink-0">
                <X size={16}/>
              </button>
            </div>

            {/* ── Form body ── */}
            <form onSubmit={submit} className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 88px)" }}>
              <div className="px-6 py-5 space-y-5">

                {/* Judul + Hari Ke */}
                <div className="grid grid-cols-[1fr_96px] gap-3">
                  <div>
                    <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 block">Judul Task</label>
                    <input required value={form.judul} onChange={(e) => set("judul", e.target.value)}
                      placeholder="mis. UKK Internal Hari 1"
                      className={INPUT_CLS}/>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 block">Hari Ke</label>
                    <input type="number" min={1} max={3} value={form.hariKe} onChange={(e) => set("hariKe", parseInt(e.target.value))}
                      className={INPUT_CLS + " text-center font-bold"}/>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700/60"/></div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-600 uppercase">Waktu & Tempat</span>
                  </div>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <CalendarDays size={11}/> Tanggal
                  </label>
                  <input required type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)}
                    className={INPUT_CLS}/>
                </div>

                {/* Jam */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                      <Clock size={11}/> Jam Mulai
                    </label>
                    <input type="time" value={form.jamMulai} onChange={(e) => set("jamMulai", e.target.value)}
                      className={INPUT_CLS}/>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                      <Clock size={11}/> Jam Selesai
                    </label>
                    <input type="time" value={form.jamSelesai} onChange={(e) => set("jamSelesai", e.target.value)}
                      className={INPUT_CLS}/>
                  </div>
                </div>

                {/* Lokasi */}
                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <MapPin size={11}/> Lokasi
                  </label>
                  <input required value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)}
                    placeholder="mis. Lab Komputer 1"
                    className={INPUT_CLS}/>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700/60"/></div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-600 uppercase">Detail</span>
                  </div>
                </div>

                {/* Penguji */}
                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <User size={11}/> Penguji
                  </label>
                  <input value={form.penguji} onChange={(e) => set("penguji", e.target.value)}
                    placeholder="Nama penguji (opsional)"
                    className={INPUT_CLS}/>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 block">Keterangan</label>
                  <textarea value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} rows={3}
                    placeholder="Catatan tambahan (opsional)..."
                    className={INPUT_CLS + " resize-none"}/>
                </div>
              </div>

              {/* ── Footer actions ── */}
              <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700/60 flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Batal
                </button>
                <motion.button type="submit" disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}>
                  {saving ? <><Loader2 size={14} className="animate-spin"/> Menyimpan...</> : <><Send size={13}/> {isEdit ? "Perbarui" : "Simpan Task"}</>}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Modal Tambah File (Jadwal / Soal) — form sederhana ────────────────────────

function TambahFileModal({ open, onClose, onUpload, tahapanList, title, gradient, showTahapan }: {
  open: boolean; onClose: () => void; onUpload: (fd: FormData) => Promise<void>;
  tahapanList: Tahapan[]; title: string; gradient: string; showTahapan?: boolean;
}) {
  const [judul, setJudul]           = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tahapanId, setTahapanId]   = useState("");
  const [file, setFile]             = useState<File | null>(null);
  const [saving, setSaving]         = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setJudul(""); setKeterangan(""); setFile(null); setTahapanId(tahapanList[0]?.id ?? ""); }
  }, [open, tahapanList]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const tid = showTahapan ? tahapanId : (tahapanList[0]?.id ?? "");
    if (!file || !tid) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("tahapanId", tid);
    fd.append("judul", judul);
    fd.append("deskripsi", keterangan);
    fd.append("file", file);
    await onUpload(fd);
    setSaving(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}>
          <motion.div initial={{scale:0.95,opacity:0,y:16}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0,y:16}}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e)=>e.stopPropagation()}>

            {/* Gradient header */}
            <div className="relative px-6 py-5 overflow-hidden" style={{background: gradient}}>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none"/>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white">{title}</h2>
                <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white hover:bg-white/25">
                  <X size={14}/>
                </button>
              </div>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4">
              {showTahapan && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Tahapan UKK</label>
                  <select required value={tahapanId} onChange={(e)=>setTahapanId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none">
                    <option value="">Pilih tahapan...</option>
                    {tahapanList.map((t)=><option key={t.id} value={t.id}>{t.judul}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Judul</label>
                <input required value={judul} onChange={(e)=>setJudul(e.target.value)}
                  placeholder="Masukkan judul..."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Keterangan</label>
                <textarea value={keterangan} onChange={(e)=>setKeterangan(e.target.value)} rows={3}
                  placeholder="Keterangan tambahan (opsional)..."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none resize-none focus:border-blue-400"/>
              </div>
              <div onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 transition-colors">
                <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e)=>setFile(e.target.files?.[0]??null)}/>
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={16} style={{color:PRIMARY}}/>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <CloudUpload size={26} className="mx-auto text-slate-300 mb-1.5"/>
                    <p className="text-sm text-slate-500">Klik untuk upload <span className="font-semibold">PDF</span></p>
                  </>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Batal
                </button>
                <button type="submit" disabled={saving || !file || (showTahapan ? !tahapanId : false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{background: gradient}}>
                  {saving ? "Mengupload..." : "Upload"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Modal Upload Soal ─────────────────────────────────────────────────────────

function UploadSoalModal({ open, onClose, onUpload, tahapanList }: { open: boolean; onClose: () => void; onUpload: (f: FormData) => Promise<void>; tahapanList: Tahapan[]; }) {
  const [tahapanId, setTahapanId] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setTahapanId(""); setJudul(""); setDeskripsi(""); setFile(null); } }, [open]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !tahapanId) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("tahapanId", tahapanId); fd.append("judul", judul); fd.append("deskripsi", deskripsi); fd.append("file", file);
    await onUpload(fd);
    setSaving(false);
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Upload Soal</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X size={16} className="text-slate-500" /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Tahapan UKK</label>
                <select required value={tahapanId} onChange={(e) => setTahapanId(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none">
                  <option value="">Pilih tahapan...</option>
                  {tahapanList.map((t) => <option key={t.id} value={t.id}>{t.judul}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Judul Soal</label>
                <input required value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Soal Praktik UKK Internal"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Deskripsi (opsional)</label>
                <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none resize-none" />
              </div>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                <input ref={fileRef} type="file" accept=".pdf,.zip" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <FileText size={16} style={{ color: PRIMARY }} /><span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div><CloudUpload size={28} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-500">Klik untuk upload PDF/ZIP</p></div>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300">Batal</button>
                <button type="submit" disabled={saving || !file || !tahapanId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: PRIMARY }}>
                  {saving ? "Mengupload..." : "Upload"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminJadwalSoalPage() {
  const [tahapanList, setTahapanList] = useState<Tahapan[]>([]);
  const [filePool,    setFilePool]    = useState<Tahapan | null>(null); // global container (hariKe:0)
  const [submisiList, setSubmisiList] = useState<Submisi[]>([]);
  const [loading, setLoading]         = useState(true);
  const [openTahapan, setOpenTahapan]               = useState(false);
  const [openSoal, setOpenSoal]                     = useState(false);
  const [openJadwalModal, setOpenJadwalModal]       = useState(false);
  const [openSoalModal, setOpenSoalModal]           = useState(false);
  const [openTambahJadwal, setOpenTambahJadwal]     = useState(false);
  const [openTambahSoal, setOpenTambahSoal]         = useState(false);
  const [editTarget, setEditTarget]                 = useState<Tahapan | null>(null);
  const [tab, setTab]                               = useState<"active"|"completed">("active");
  const [submisiModalTahapan, setSubmisiModalTahapan] = useState<Tahapan | null>(null);
  const [soalJadwalIdx, setSoalJadwalIdx]           = useState(0);
  const [soalSoalIdx,   setSoalSoalIdx]             = useState(0);
  const [revisiTarget,  setRevisiTarget]            = useState<Submisi | null>(null);
  const [pesanRevisi,   setPesanRevisi]             = useState("");
  const toast = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([
      fetch("/api/ujian-ukk/tahapan").then((r) => r.json()),
      fetch("/api/ujian-ukk/submisi").then((r) => r.json()),
    ]);
    const all: Tahapan[]  = Array.isArray(t) ? t : [];
    setFilePool(all.find(x => x.hariKe === 0) ?? null);       // global container
    setTahapanList(all.filter(x => x.hariKe !== 0));           // hanya real tasks
    setSubmisiList(Array.isArray(s) ? s : []);
    setLoading(false);
    // Auto-switch ke completed jika tidak ada task aktif
    const nowCheck = new Date();
    const todayCheck = nowCheck.toISOString().slice(0, 10);
    const tasks = all.filter(x => x.hariKe !== 0);
    const hasActive = tasks.some((tk) => {
      const tglStr = tk.tanggal.slice(0, 10);
      if (tglStr > todayCheck) return true;
      if (tglStr < todayCheck) return false;
      const [h, m] = tk.jamSelesai.split(":").map(Number);
      const selesai = new Date(); selesai.setHours(h, m, 0, 0);
      return nowCheck < selesai;
    });
    if (!hasActive && tasks.length > 0) setTab("completed");
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function saveTahapan(data: TahapanForm) {
    const url  = editTarget ? `/api/ujian-ukk/tahapan/${editTarget.id}` : "/api/ujian-ukk/tahapan";
    const meth = editTarget ? "PUT" : "POST";
    const r = await fetch(url, { method: meth, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, hariKe: Number(data.hariKe) }) });
    if (r.ok) {
      toast.success(editTarget ? "Task diperbarui" : "Task ditambahkan", "");
      setOpenTahapan(false);
      setEditTarget(null);
      await loadAll();
      // auto-switch ke tab yang sesuai agar task langsung terlihat
      const tgl = data.tanggal;
      const todayS = new Date().toISOString().slice(0, 10);
      if (tgl > todayS) {
        setTab("active");
      } else if (tgl < todayS) {
        setTab("completed");
      } else {
        const [h, m] = data.jamSelesai.split(":").map(Number);
        const selesai = new Date(); selesai.setHours(h, m, 0, 0);
        setTab(new Date() < selesai ? "active" : "completed");
      }
    } else {
      const e = await r.json().catch(() => ({}));
      const msg = Array.isArray(e.message) ? e.message.join(", ") : (e.message ?? "Terjadi kesalahan");
      toast.error("Gagal menyimpan", msg);
    }
  }

  async function deleteTahapan(id: string) {
    if (!await toast.confirm("Hapus tahapan ini?", "Semua soal terkait juga akan dihapus.")) return;
    const r = await fetch(`/api/ujian-ukk/tahapan/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Task dihapus", ""); loadAll(); }
  }

  async function uploadSoal(fd: FormData) {
    const r = await fetch("/api/ujian-ukk/soal", { method: "POST", body: fd });
    if (r.ok) { toast.success("Soal berhasil diupload", ""); setOpenSoal(false); loadAll(); }
    else toast.error("Gagal upload", "");
  }

  async function deleteSoal(id: string) {
    if (!await toast.confirm("Hapus soal ini?", "Soal yang dihapus tidak dapat dikembalikan.")) return;
    const r = await fetch(`/api/ujian-ukk/soal/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Soal dihapus", ""); loadAll(); }
  }

  async function updateStatus(id: string, status: StatusSubmisi, pesan?: string) {
    const r = await fetch(`/api/ujian-ukk/submisi/${id}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(pesan ? { pesanRevisi: pesan } : {}) }),
    });
    if (r.ok) { toast.success(status === "DITERIMA" ? "Project diterima!" : "Revisi dikirim ke siswa", ""); loadAll(); }
  }

  async function kirimRevisi() {
    if (!revisiTarget || !pesanRevisi.trim()) return;
    await updateStatus(revisiTarget.id, "REVISI", pesanRevisi.trim());
    setRevisiTarget(null);
    setPesanRevisi("");
  }

  const jadwalFiles = (filePool?.soal ?? []).filter(s => s.deskripsi?.startsWith("__jadwal__:"));
  const soalFiles   = (filePool?.soal ?? []).filter(s => !s.deskripsi?.startsWith("__jadwal__:"));
  const totalSoal   = soalFiles.length;
  const now       = new Date();
  const todayStr  = now.toISOString().slice(0, 10);
  const active    = tahapanList.filter((t) => {
    const tglStr = t.tanggal.slice(0, 10);
    if (tglStr > todayStr) return true;   // tanggal masa depan → aktif
    if (tglStr < todayStr) return false;  // tanggal sudah lewat → selesai
    // tanggal hari ini → cek jamSelesai
    const [h, m] = t.jamSelesai.split(":").map(Number);
    const selesai = new Date(); selesai.setHours(h, m, 0, 0);
    return now < selesai;                 // belum melewati jam selesai → aktif
  });
  const completed = tahapanList.filter((t) => !active.includes(t));
  const shown     = tab === "active" ? active : completed;
  const terima    = submisiList.filter((s) => s.status === "DITERIMA").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── Left Column ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{ background: "linear-gradient(135deg,#6334F4 0%,#8B5CF6 40%,#EC4899 80%,#F97316 100%)" }}>
            {/* decorative circles */}
            <div className="pointer-events-none absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10"/>
            <div className="pointer-events-none absolute -bottom-8 right-32 w-36 h-36 rounded-full bg-white/8"/>
            <div className="pointer-events-none absolute bottom-4 -left-6 w-24 h-24 rounded-full bg-white/6"/>

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* icon block */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
                  <FileText size={22} className="text-white sm:hidden"/>
                  <FileText size={26} className="text-white hidden sm:block"/>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Ujian Kompetensi Keahlian</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">Admin</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">Jadwal dan Soal</h1>
                  <p className="text-xs sm:text-sm text-white/70 mt-0.5 hidden sm:block">Kelola jadwal, soal, dan pantau pengumpulan siswa</p>
                </div>
              </div>

              {/* quick stats */}
              <div className="flex items-center gap-2 sm:gap-3">
                {[
                  { icon: CalendarDays, label: "Task",  val: tahapanList.length },
                  { icon: FileText,     label: "Soal",  val: totalSoal },
                  { icon: Send,         label: "Kumpul",val: submisiList.length },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex flex-col items-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/15 backdrop-blur-sm min-w-[56px] sm:min-w-[64px]">
                    <Icon size={13} className="text-white/70 mb-1"/>
                    <p className="text-lg sm:text-xl font-extrabold text-white leading-none">{val}</p>
                    <p className="text-[10px] text-white/60 font-semibold mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* ── Modal Jadwal — langsung PDF viewer seperti MateriPreviewModal ── */}
          <AnimatePresence>
            {openJadwalModal && (()=>{
              const allSoal = jadwalFiles;
              const curSoal = allSoal[soalJadwalIdx] ?? null;
              return (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e)=>{if(e.target===e.currentTarget)setOpenJadwalModal(false)}}>
                <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                  transition={{type:"spring",damping:26,stiffness:340}}
                  className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                  style={{maxHeight:"92vh"}}>

                  {/* Gradient header — amber */}
                  <div className="relative flex items-start gap-4 px-6 py-5 overflow-hidden shrink-0"
                    style={{background:"linear-gradient(135deg,#F59E0B,#F97316)"}}>
                    <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none"/>
                    <div className="absolute -bottom-6 right-24 w-24 h-24 rounded-full bg-white/8 pointer-events-none"/>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
                      <CalendarDays size={22} className="text-white"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white/95">Jadwal UKK</span>
                        {allSoal.length > 1 && <span className="text-[10px] text-white/60">{soalJadwalIdx+1} / {allSoal.length}</span>}
                      </div>
                      <h2 className="mt-1 text-lg font-extrabold text-white leading-snug line-clamp-2">
                        {curSoal ? curSoal.judul : "Jadwal UKK"}
                      </h2>
                      <p className="mt-0.5 text-[11px] text-white/70">{curSoal?.fileName ?? (allSoal.length === 0 ? "Belum ada file jadwal" : `${allSoal.length} info UKK`)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {allSoal.length > 1 && (
                        <>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.max(0,i-1))} disabled={soalJadwalIdx===0}
                            className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40 transition-colors">
                            <ChevronLeft size={16}/>
                          </button>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalJadwalIdx===allSoal.length-1}
                            className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40 transition-colors">
                            <ChevronRight size={16}/>
                          </button>
                        </>
                      )}
                      {curSoal && (
                        <button onClick={async()=>{ await deleteSoal(curSoal.id); setSoalJadwalIdx(i=>Math.max(0,i-1)); }}
                          className="w-8 h-8 rounded-xl bg-red-500/70 flex items-center justify-center text-white hover:bg-red-500 transition-colors" title="Hapus jadwal ini">
                          <Trash2 size={14}/>
                        </button>
                      )}
                      <button onClick={()=>{ setOpenJadwalModal(false); setOpenTambahJadwal(true); }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                        <Plus size={13}/> Tambah
                      </button>
                      <button onClick={()=>setOpenJadwalModal(false)}
                        className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors">
                        <X size={16}/>
                      </button>
                    </div>
                  </div>

                  {/* Langsung PDF viewer */}
                  {curSoal ? (
                    <SoalPdfViewer soal={curSoal} onClose={()=>setOpenJadwalModal(false)}/>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#F59E0B22,#F9731622)"}}>
                        <FileText size={30} className="text-amber-400"/>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada file jadwal</p>
                        <p className="mt-1 text-sm text-slate-400">Klik "Tambah" untuk mengupload file jadwal PDF</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* ── Modal Soal ── */}
          <AnimatePresence>
            {openSoalModal && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e)=>{if(e.target===e.currentTarget)setOpenSoalModal(false)}}>
                <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                  transition={{type:"spring",damping:26,stiffness:340}}
                  className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                  style={{maxHeight:"92vh"}}>
                  {(()=>{
                    const allSoal = soalFiles;
                    const curSoal = allSoal[soalSoalIdx] ?? null;
                    return (
                      <>
                        {/* Gradient header — indigo */}
                        <div className="relative flex items-start gap-4 px-6 py-5 overflow-hidden shrink-0"
                          style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)"}}>
                          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none"/>
                          <div className="absolute -bottom-6 right-24 w-24 h-24 rounded-full bg-white/8 pointer-events-none"/>
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
                            <FileText size={22} className="text-white"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white/95">Soal UKK</span>
                              {allSoal.length > 1 && <span className="text-[10px] text-white/60">{soalSoalIdx+1} / {allSoal.length}</span>}
                            </div>
                            <h2 className="mt-1 text-lg font-extrabold text-white leading-snug line-clamp-2">
                              {curSoal ? curSoal.judul : "Soal UKK"}
                            </h2>
                            <p className="mt-0.5 text-[11px] text-white/70">{curSoal?.fileName ?? `${totalSoal} soal tersedia`}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {allSoal.length > 1 && (
                              <>
                                <button onClick={()=>setSoalSoalIdx(i=>Math.max(0,i-1))} disabled={soalSoalIdx===0}
                                  className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40 transition-colors">
                                  <ChevronLeft size={16}/>
                                </button>
                                <button onClick={()=>setSoalSoalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalSoalIdx===allSoal.length-1}
                                  className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40 transition-colors">
                                  <ChevronRight size={16}/>
                                </button>
                              </>
                            )}
                            {curSoal && (
                              <button onClick={async()=>{ await deleteSoal(curSoal.id); setSoalSoalIdx(i=>Math.max(0,i-1)); }}
                                className="w-8 h-8 rounded-xl bg-red-500/70 flex items-center justify-center text-white hover:bg-red-500 transition-colors" title="Hapus soal ini">
                                <Trash2 size={14}/>
                              </button>
                            )}
                            <button onClick={()=>{ setOpenSoalModal(false); setOpenTambahSoal(true); }}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                              <CloudUpload size={13}/> Tambah
                            </button>
                            <button onClick={()=>setOpenSoalModal(false)}
                              className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors">
                              <X size={16}/>
                            </button>
                          </div>
                        </div>

                        {/* Langsung PDF viewer */}
                        {curSoal ? (
                          <SoalPdfViewer soal={curSoal} onClose={()=>setOpenSoalModal(false)}/>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#6366F122,#4F46E522)"}}>
                              <FileText size={30} className="text-indigo-400"/>
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada soal</p>
                              <p className="mt-1 text-sm text-slate-400">Klik "Tambah" untuk mengupload soal PDF</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Layout utama: kiri (2 card + My Task) | kanan (Diskusi penuh) ── */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">

            {/* Kolom kiri — flex-1 */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Baris 1: Jadwal + Soal — selalu horizontal */}
              <div className="flex gap-3">

                {/* Card Jadwal */}
                <button onClick={() => { setSoalJadwalIdx(0); setOpenJadwalModal(true); }}
                  className="flex-1 relative overflow-hidden rounded-2xl text-white text-left focus:outline-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] p-4 sm:p-5"
                  style={{background:"linear-gradient(135deg,#F59E0B,#F97316)", boxShadow:"0 8px 28px rgba(245,158,11,0.45)"}}>
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="absolute -right-2 -bottom-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="relative flex items-center justify-between gap-2">
                    {/* Kiri: icon + info */}
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <CalendarDays size={14} className="text-white"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold tracking-widest uppercase text-white/60 leading-none mb-0.5">Akses Cepat</p>
                          <p className="text-xs sm:text-sm font-extrabold text-white leading-none truncate">Jadwal UKK</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div>
                          <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">Thn Ajaran</p>
                          <p className="text-[10px] sm:text-xs font-bold text-white/90">2024/2025</p>
                        </div>
                        <div className="w-px h-4 bg-white/25 shrink-0"/>
                        <div>
                          <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">Pengelola</p>
                          <p className="text-[10px] sm:text-xs font-bold text-white/90">Admin PPLG</p>
                        </div>
                      </div>
                    </div>
                    {/* Kanan: angka */}
                    <div className="relative text-right shrink-0">
                      <p className="text-4xl sm:text-5xl font-black leading-none">{jadwalFiles.length}</p>
                      <p className="text-[10px] text-white/70 mt-1 font-medium">info</p>
                    </div>
                  </div>
                </button>

                {/* Card Soal */}
                <button onClick={() => { setSoalSoalIdx(0); setOpenSoalModal(true); }}
                  className="flex-1 relative overflow-hidden rounded-2xl text-white text-left focus:outline-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] p-4 sm:p-5"
                  style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)", boxShadow:"0 8px 28px rgba(99,102,241,0.45)"}}>
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="absolute -right-2 -bottom-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="relative flex items-center justify-between gap-2">
                    {/* Kiri: icon + info */}
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-white"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold tracking-widest uppercase text-white/60 leading-none mb-0.5">Akses Cepat</p>
                          <p className="text-xs sm:text-sm font-extrabold text-white leading-none truncate">Soal UKK</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div>
                          <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">Thn Ajaran</p>
                          <p className="text-[10px] sm:text-xs font-bold text-white/90">2024/2025</p>
                        </div>
                        <div className="w-px h-4 bg-white/25 shrink-0"/>
                        <div>
                          <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">Pengelola</p>
                          <p className="text-[10px] sm:text-xs font-bold text-white/90">Admin PPLG</p>
                        </div>
                      </div>
                    </div>
                    {/* Kanan: angka */}
                    <div className="relative text-right shrink-0">
                      <p className="text-4xl sm:text-5xl font-black leading-none">{totalSoal}</p>
                      <p className="text-[10px] text-white/70 mt-1 font-medium">soal</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Baris 2: My Task */}
          <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="px-5 pt-5 pb-0" style={{background:"linear-gradient(135deg,rgba(79,142,247,0.06) 0%,rgba(99,102,241,0.06) 50%,rgba(16,185,129,0.06) 100%)"}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#4F8EF7,#6366F1)"}}>
                    <BookOpen size={14} className="text-white"/>
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">My Task</p>
                </div>
                <button onClick={() => { setEditTarget(null); setOpenTahapan(true); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white shadow-sm"
                  style={{background:"linear-gradient(135deg,#4F8EF7,#6366F1)"}}>
                  <Plus size={13} /> Tambah Task
                </button>
              </div>
              <div className="flex gap-6 border-b border-slate-100 dark:border-slate-700">
                <button onClick={() => setTab("active")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="active" ? "border-blue-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                  style={tab==="active"?{color:"#4F8EF7"}:{}}>
                  Active Task
                  {tab==="active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{backgroundColor:"#4F8EF7"}}>{active.length}</span>}
                </button>
                <button onClick={() => setTab("completed")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="completed" ? "border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                  style={tab==="completed"?{color:"#10B981"}:{}}>
                  Completed
                  {tab==="completed" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{backgroundColor:"#10B981"}}>{completed.length}</span>}
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Memuat data...</div>}
              {!loading && shown.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <CalendarDays size={32} className="mx-auto mb-3 text-slate-200"/>
                  <p className="text-sm text-slate-400">{tab==="active" ? "Tidak ada task aktif" : "Tidak ada task selesai"}</p>
                </div>
              )}
              {shown.map((t, idx) => {
                const rp  = rowPalette(idx);
                const sudahKumpul = submisiList.length;
                const pct = Math.min(Math.round((sudahKumpul / Math.max(submisiList.length || 12, 1)) * 100), 100);
                // chip warna unik per info
                const chipDate  = {bg:"#EFF6FF", clr:"#3B82F6"};
                const chipTime  = {bg:"#F0FDF4", clr:"#16A34A"};
                const chipLoc   = {bg:"#FFF7ED", clr:"#EA580C"};
                const chipUser  = {bg:"#FDF4FF", clr:"#9333EA"};
                return (
                  <motion.div key={t.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:idx*0.05}}>
                    <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3 border-l-4 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700/20"
                      style={{borderLeftColor:rp.bar}}>
                      {/* Step circle */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                        style={{background:rp.gradient}}>
                        <span className="text-sm font-bold text-white">{idx+1}</span>
                      </div>

                      {/* Info — takes all remaining space */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mb-1.5">{t.judul}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{backgroundColor:chipDate.bg, color:chipDate.clr}}>
                            <CalendarDays size={10}/>{formatTgl(t.tanggal)}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{backgroundColor:chipTime.bg, color:chipTime.clr}}>
                            <Clock size={10}/>{t.jamMulai}–{t.jamSelesai}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{backgroundColor:chipLoc.bg, color:chipLoc.clr}}>
                            <MapPin size={10}/>{t.lokasi}
                          </span>
                          {t.penguji && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                              style={{backgroundColor:chipUser.bg, color:chipUser.clr}}>
                              <User size={10}/>{t.penguji}
                            </span>
                          )}
                        </div>

                        {/* Progress — visible on mobile too, below chips */}
                        <div className="mt-2.5 sm:hidden">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400">Terkumpul</span>
                            <span className="text-[10px] font-bold" style={{color:rp.bar}}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background:rp.gradient}}/>
                          </div>
                        </div>

                        {/* Actions on mobile — below info */}
                        <div className="flex items-center gap-2 mt-2.5 sm:hidden">
                          <button onClick={() => setSubmisiModalTahapan(t)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                            style={{borderColor:rp.bar, color:rp.bar, backgroundColor:rp.bg}}>
                            <BookOpen size={11}/>
                            Lihat
                            {sudahKumpul > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor:rp.bar}}>
                                {sudahKumpul}
                              </span>
                            )}
                          </button>
                          <button onClick={() => { setEditTarget(t); setOpenTahapan(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-300 hover:text-slate-600">
                            <Pencil size={13}/>
                          </button>
                          <button onClick={() => deleteTahapan(t.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>

                      {/* Progress — desktop only */}
                      <div className="w-28 shrink-0 hidden sm:block">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400">Terkumpul</span>
                          <span className="text-[10px] font-bold" style={{color:rp.bar}}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background:rp.gradient}}/>
                        </div>
                      </div>

                      {/* Actions — desktop only */}
                      <button onClick={() => setSubmisiModalTahapan(t)}
                        className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 transition-all"
                        style={{borderColor:rp.bar, color:rp.bar, backgroundColor:rp.bg}}>
                        <BookOpen size={11}/>
                        Lihat
                        {sudahKumpul > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor:rp.bar}}>
                            {sudahKumpul}
                          </span>
                        )}
                      </button>

                      <div className="hidden sm:flex gap-0.5 shrink-0">
                        <button onClick={() => { setEditTarget(t); setOpenTahapan(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-300 hover:text-slate-600">
                          <Pencil size={12}/>
                        </button>
                        <button onClick={() => deleteTahapan(t.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          </div>

            </div>{/* end kolom kiri */}

            {/* Kolom kanan: Diskusi — merentang penuh */}
            <div className="w-full lg:w-80 shrink-0">
              <DiskusiActivity currentUserId="" />
            </div>

          </div>{/* end layout utama */}

        </div>

      </div>

      {/* ── Modal Rekap Pengumpulan per-Tahapan ── */}
      <AnimatePresence>
        {submisiModalTahapan && (() => {
          const sm = submisiModalTahapan;
          const rows = submisiList;
          const cntDiterima = rows.filter(s => s.status === "DITERIMA").length;
          const cntRevisi   = rows.filter(s => s.status === "REVISI").length;
          const cntMenunggu = rows.filter(s => s.status === "TERKIRIM").length;
          return (
            <motion.div key="submisi-modal-overlay"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setSubmisiModalTahapan(null); }}>
              <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="relative p-6 shrink-0"
                  style={{background:"linear-gradient(135deg,#6334F4 0%,#8B5CF6 40%,#EC4899 80%,#F97316 100%)"}}>
                  <div className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10"/>
                  <button onClick={() => setSubmisiModalTahapan(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                    <X size={16} className="text-white"/>
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-white"/>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Rekap Pengumpulan</p>
                      <h3 className="text-lg font-extrabold text-white">{sm.judul}</h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white">
                      <MapPin size={10}/>{sm.lokasi}
                    </span>
                    {sm.penguji && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white">
                        <User size={10}/>{sm.penguji}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white">
                      <CalendarDays size={10}/>{formatTgl(sm.tanggal)}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white">
                      <Clock size={10}/>{sm.jamMulai}–{sm.jamSelesai}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 shrink-0 border-b border-slate-100 dark:border-slate-700">
                  {[
                    { label: "Total",    val: rows.length,   color: "#6334F4" },
                    { label: "Diterima", val: cntDiterima,   color: "#10B981" },
                    { label: "Revisi",   val: cntRevisi,     color: "#F59E0B" },
                    { label: "Menunggu", val: cntMenunggu,   color: "#4F8EF7" },
                  ].map((st, i) => (
                    <div key={i} className="p-4 text-center border-r last:border-r-0 border-slate-100 dark:border-slate-700">
                      <p className="text-2xl font-extrabold" style={{color:st.color}}>{st.val}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{st.label}</p>
                    </div>
                  ))}
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/30">
                  {rows.length === 0 ? (
                    <div className="py-16 text-center">
                      <AlertCircle size={36} className="mx-auto mb-3 text-slate-200"/>
                      <p className="text-sm font-semibold text-slate-400">Belum ada siswa yang mengumpulkan</p>
                      <p className="text-xs text-slate-300 mt-1">Siswa harus mengirimkan link Google Drive</p>
                    </div>
                  ) : rows.map((s) => {
                    const sc    = statusBadge(s.status);
                    const nama  = s.siswa?.user?.nama || s.siswa?.nama || "Siswa";
                    const isDone = s.status === "DITERIMA";
                    return (
                      <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{backgroundColor: isDone ? "#10B981" : sc.text}}>
                          {nama[0]?.toUpperCase() ?? "?"}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{nama}</p>
                          <p className="text-xs text-slate-400 truncate">{s.soal?.judul ?? "—"} · {formatTgl(s.submittedAt)}</p>
                        </div>
                        {/* Status badge */}
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                          style={{backgroundColor: sc.bg, color: sc.text}}>
                          {isDone ? "✓ UKK Selesai" : s.status === "REVISI" ? "⚠ Perlu Revisi" : "⏳ Menunggu Review"}
                        </span>
                        {/* GDrive */}
                        <a href={s.fileUrl.startsWith("http") ? s.fileUrl : `http://localhost:3001${s.fileUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0"
                          style={{color:"#4285F4", backgroundColor:"#EFF6FF"}}>
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                            <path d="M6.18 15L3.12 9.72 9.24 0h5.51L8.63 9.72 6.18 15zm5.82 0H7.76l2.45-4.28h7.13L14.89 15h-2.89zM12 7.5l2.89-5h2.89L21 7.5h-5.78L12 7.5zM20.88 15l-2.45-4.28h2.01L24 15h-3.12z"/>
                          </svg>
                          GDrive
                        </a>
                        {/* Action buttons */}
                        {isDone ? (
                          <span className="text-xs font-bold text-emerald-500 shrink-0">Selesai ✓</span>
                        ) : (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => updateStatus(s.id, "DITERIMA")}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white shadow-sm transition-transform hover:scale-105"
                              style={{background:"linear-gradient(135deg,#10B981,#059669)"}}>
                              <CheckCircle size={12}/> Terima
                            </button>
                            <button onClick={() => { setRevisiTarget(s); setPesanRevisi(""); }}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white shadow-sm transition-transform hover:scale-105"
                              style={{background:"linear-gradient(135deg,#F59E0B,#F97316)"}}>
                              <AlertCircle size={12}/> Revisi
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer legend + close */}
                <div className="px-6 py-4 shrink-0 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-semibold text-amber-500">Revisi</span> → siswa kirim ulang, dokumen lama tergantikan ·{" "}
                    <span className="font-semibold text-emerald-500">Terima</span> → UKK selesai
                  </p>
                  <button onClick={() => setSubmisiModalTahapan(null)}
                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 shrink-0 transition-colors">
                    Tutup
                  </button>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <TahapanModal open={openTahapan} onClose={() => { setOpenTahapan(false); setEditTarget(null); }} onSave={saveTahapan}
        initial={editTarget ? { hariKe: editTarget.hariKe, judul: editTarget.judul, tanggal: editTarget.tanggal.slice(0, 10), jamMulai: editTarget.jamMulai, jamSelesai: editTarget.jamSelesai, lokasi: editTarget.lokasi, penguji: editTarget.penguji ?? "", keterangan: editTarget.keterangan ?? "" } : undefined} />
      <UploadSoalModal open={openSoal} onClose={() => setOpenSoal(false)} onUpload={uploadSoal} tahapanList={tahapanList} />

      {/* Form Tambah Jadwal — judul + keterangan + PDF (dari modal Jadwal) */}
      <TambahFileModal
        open={openTambahJadwal}
        onClose={() => { setOpenTambahJadwal(false); setOpenJadwalModal(true); }}
        onUpload={async (fd) => {
          const desc = (fd.get("deskripsi") as string) || "";
          fd.set("deskripsi", "__jadwal__:" + desc);
          await uploadSoal(fd);
          setOpenTambahJadwal(false);
          setOpenJadwalModal(true);
        }}
        tahapanList={filePool ? [filePool] : []}
        title="Tambah Jadwal"
        gradient="linear-gradient(135deg,#F59E0B,#F97316)"
        showTahapan={false}
      />

      {/* Form Upload Soal — judul + keterangan + PDF, tanpa pilih tahapan */}
      <TambahFileModal
        open={openTambahSoal}
        onClose={() => { setOpenTambahSoal(false); setOpenSoalModal(true); }}
        onUpload={async (fd) => {
          await uploadSoal(fd);
          setOpenTambahSoal(false);
          setOpenSoalModal(true);
        }}
        tahapanList={filePool ? [filePool] : []}
        title="Upload Soal"
        gradient="linear-gradient(135deg,#6366F1,#4F46E5)"
        showTahapan={false}
      />

      {/* ── Modal Pesan Revisi ── */}
      <AnimatePresence>
        {revisiTarget && (
          <motion.div key="revisi-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e)=>{if(e.target===e.currentTarget){setRevisiTarget(null);setPesanRevisi("");}}}>
            <motion.div initial={{scale:0.95,opacity:0,y:12}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0,y:12}}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e)=>e.stopPropagation()}>

              {/* Header */}
              <div className="relative px-6 py-5 overflow-hidden"
                style={{background:"linear-gradient(135deg,#F59E0B,#F97316)"}}>
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none"/>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} className="text-white"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Kirim Revisi</p>
                    <h3 className="text-base font-extrabold text-white leading-snug">{revisiTarget.siswa?.nama ?? revisiTarget.siswa?.user?.nama}</h3>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                  <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0"/>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    Siswa akan menerima notifikasi revisi dan <strong>wajib mengirim ulang</strong> project mereka.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Pesan Revisi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={pesanRevisi}
                    onChange={(e)=>setPesanRevisi(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan catatan revisi untuk siswa, misalnya: &quot;Tampilan UI belum responsif, perbaiki layout mobile dan tambahkan validasi form login.&quot;"
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none resize-none focus:border-amber-400 placeholder:text-slate-400"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{pesanRevisi.length} karakter</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={()=>{setRevisiTarget(null);setPesanRevisi("");}}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Batal
                </button>
                <button onClick={kirimRevisi} disabled={!pesanRevisi.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:brightness-110"
                  style={{background:"linear-gradient(135deg,#F59E0B,#F97316)"}}>
                  <span className="flex items-center justify-center gap-2">
                    <AlertCircle size={14}/> Kirim Revisi
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
