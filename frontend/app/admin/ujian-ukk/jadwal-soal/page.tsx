"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, FileText, Trash2, Plus, Clock,
  MapPin, User, Send, CheckCircle,
  AlertCircle, X, Pencil, BookOpen, ChevronLeft,
  ChevronRight, CloudUpload, Loader2, Search,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/shared/ToastSystem";
import { todayJakarta } from "@/components/absensi-harian/shared";
import { AppTabs, APP_ACCENT, APP_SOFT } from "@/components/app/AppUI";
import { icon3dStyle, toneAt } from "@/components/shared/Icon3D";
import { useIsAppMode } from "@/lib/pwaInstall";

const SoalPdfViewer = dynamic(() => import("./SoalPdfViewer"), { ssr: false, loading: () => (
  <div className="flex-1 flex items-center justify-center py-20">
    <Loader2 size={28} className="animate-spin text-[#5D900F] dark:text-[#C4B5FD]"/>
  </div>
)});

const PRIMARY = "#3E03B3";

const PALETTE = [
  { bg: "#E0F2FE", text: "#0284C7", bar: "#0EA5E9", gradient: "#0EA5E9" },
  { bg: "#E3F8EF", text: "#059669", bar: "#10B981", gradient: "#10B981" },
  { bg: "#F1EDFA", text: "#7C3AED", bar: "#7C3AED", gradient: "#7C3AED" },
  { bg: "#FFE9E2", text: "#F26A3D", bar: "#F26A3D", gradient: "#F26A3D" },
];
function rowPalette(idx: number) { return PALETTE[idx % PALETTE.length]; }

type StatusSubmisi = "TERKIRIM" | "DITERIMA" | "REVISI";

interface Soal { id: string; judul: string; deskripsi?: string; fileUrl: string; fileName: string; _count?: { submisi: number }; }
interface Tahapan { id: string; hariKe: number; judul: string; tanggal: string; jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string; keterangan?: string; soal: Soal[]; }
interface Submisi { id: string; fileUrl: string; fileName: string; catatan?: string; pesanRevisi?: string; status: StatusSubmisi; submittedAt: string; soal: { id: string; judul: string }; siswa: { id: string; nama: string; user: { id: string; nama: string } }; }
function formatTgl(s: string) { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }); }
function statusBadge(s: StatusSubmisi) {
  if (s === "DITERIMA") return { bg: "#F1EDFA", text: "#3E03B3", icon: <CheckCircle size={10} /> };
  if (s === "REVISI")   return { bg: "#F2F2F2", text: "#0F172A", icon: <AlertCircle size={10} /> };
  return { bg: "#F1EDFA", text: "#3E03B3", icon: <Clock size={10} /> };
}
function roleAvatar(role: string) { const m: Record<string, string> = { ADMIN: "#3E03B3", GURU: "#3E03B3", SISWA: "#F26A3D" }; return m[role] ?? "#64748b"; }

function Calendar({ tahapanList }: { tahapanList: Tahapan[] }) {
  const [tYear, tMonth, tDate] = todayJakarta().split("-").map(Number);
  const today = new Date(tYear, tMonth - 1, tDate);

  const ukkDateObjs = tahapanList
    .map((t) => { const d = new Date(t.tanggal); d.setHours(0,0,0,0); return d; })
    .sort((a, b) => a.getTime() - b.getTime());
  const ukkDateStrings = new Set(ukkDateObjs.map((d) => d.toDateString()));

  function getMondayOf(d: Date) {
    const day = d.getDay(); 
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
  }, [tahapanList.length]); 

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const week: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const monthLabel = weekStart.toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

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
                  background: isUkk ? "#3E03B3" : "transparent",
                  color:      isUkk ? "#fff" : isToday ? "#3E03B3" : "inherit",
                  fontWeight: isUkk || isToday ? 700 : 400,
                }}>
                {d.getDate()}
              </div>
              {isUkk && tasks.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 hidden group-hover:flex flex-col gap-0.5 z-20 pointer-events-none">
                  {tasks.map((tk) => (
                    <div key={tk.id}
                      className="whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-lg text-white"
                      style={{ background: "#3E03B3" }}>
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

interface TahapanForm { hariKe: number; judul: string; tanggal: string; jamMulai: string; jamSelesai: string; lokasi: string; penguji: string; keterangan: string; }

const INPUT_CLS = "w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-[#3E03B3] focus:ring-2 focus:ring-[#3E03B3] dark:focus:ring-[#00AAFA]/30 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500";

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

            <div className="app-sheet-header relative flex items-center gap-4 overflow-hidden bg-[#3E03B3] px-6 py-5">
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

            <form onSubmit={submit} className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 88px)" }}>
              <div className="px-6 py-5 space-y-5">

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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700/60"/></div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-600 uppercase">Waktu & Tempat</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <CalendarDays size={11}/> Tanggal
                  </label>
                  <input required type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)}
                    className={INPUT_CLS}/>
                </div>

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

                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <MapPin size={11}/> Lokasi
                  </label>
                  <input required value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)}
                    placeholder="mis. Lab Komputer 1"
                    className={INPUT_CLS}/>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700/60"/></div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-600 uppercase">Detail</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <User size={11}/> Penguji
                  </label>
                  <input value={form.penguji} onChange={(e) => set("penguji", e.target.value)}
                    placeholder="Nama penguji (opsional)"
                    className={INPUT_CLS}/>
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 block">Keterangan</label>
                  <textarea value={form.keterangan} onChange={(e) => set("keterangan", e.target.value)} rows={3}
                    placeholder="Catatan tambahan (opsional)..."
                    className={INPUT_CLS + " resize-none"}/>
                </div>
              </div>

              <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700/60 flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Batal
                </button>
                <motion.button type="submit" disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "#3E03B3" }}>
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

function TambahFileModal({ open, onClose, onUpload, tahapanList, title, warna, showTahapan }: {
  open: boolean; onClose: () => void; onUpload: (fd: FormData) => Promise<void>;
  tahapanList: Tahapan[]; title: string; warna: string; showTahapan?: boolean;
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
    if (!file || (showTahapan && !tid)) return;
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

            <div className="app-sheet-header relative px-6 py-5 overflow-hidden" style={{background: warna, color: "#FFFFFF"}}>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none" style={{backgroundColor: warna === "#F26A3D" ? "#FFFFFF1A" : "#FFFFFF1A"}}/>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">{title}</h2>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80" style={{backgroundColor: warna === "#F26A3D" ? "#FFFFFF26" : "#FFFFFF26"}}>
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
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-[#8F6DD3]"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Keterangan</label>
                <textarea value={keterangan} onChange={(e)=>setKeterangan(e.target.value)} rows={3}
                  placeholder="Keterangan tambahan (opsional)..."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none resize-none focus:border-[#8F6DD3]"/>
              </div>
              <div onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-5 text-center cursor-pointer hover:border-[#8F6DD3] transition-colors">
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{background: warna, color: "#FFFFFF"}}>
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
                className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-[#8F6DD3] transition-colors">
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

export default function AdminJadwalSoalPage() {
  const router = useRouter();
  const appMode = useIsAppMode();
  const [tahapanList, setTahapanList] = useState<Tahapan[]>([]);
  const [filePool,    setFilePool]    = useState<Tahapan | null>(null); 
  const [submisiList, setSubmisiList] = useState<Submisi[]>([]);
  const [totalSiswaAll, setTotalSiswaAll] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [openTahapan, setOpenTahapan]               = useState(false);
  const [openSoal, setOpenSoal]                     = useState(false);
  const [openJadwalModal, setOpenJadwalModal]       = useState(false);
  const [openSoalModal, setOpenSoalModal]           = useState(false);
  const [openTambahJadwal, setOpenTambahJadwal]     = useState(false);
  const [openTambahSoal, setOpenTambahSoal]         = useState(false);
  const [editTarget, setEditTarget]                 = useState<Tahapan | null>(null);
  const [tab, setTab]                               = useState<"active"|"completed">("active");
  const [taskSearch, setTaskSearch]                 = useState("");
  const [submisiModalTahapan, setSubmisiModalTahapan] = useState<Tahapan | null>(null);
  const [soalJadwalIdx, setSoalJadwalIdx]           = useState(0);
  const [soalSoalIdx,   setSoalSoalIdx]             = useState(0);
  const toast = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([
      fetch("/api/ujian-ukk/tahapan").then((r) => r.json()),
      fetch("/api/ujian-ukk/submisi").then((r) => r.json()),
    ]);
    const all: Tahapan[]  = Array.isArray(t) ? t : [];
    setFilePool(all.find(x => x.hariKe === 0) ?? null);       
    setTahapanList(all.filter(x => x.hariKe !== 0));           
    setSubmisiList(Array.isArray(s) ? s : []);
    setLoading(false);
    const nowCheck = new Date();
    const todayCheck = todayJakarta();
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
  useEffect(() => {
    fetch("/api/dashboard/admin", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTotalSiswaAll(Number(d?.totalSiswa) || 0))
      .catch(() => {});
  }, []);

  async function saveTahapan(data: TahapanForm) {
    const url  = editTarget ? `/api/ujian-ukk/tahapan/${editTarget.id}` : "/api/ujian-ukk/tahapan";
    const meth = editTarget ? "PUT" : "POST";
    const r = await fetch(url, { method: meth, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, hariKe: Number(data.hariKe) }) });
    if (r.ok) {
      toast.success(editTarget ? "Task diperbarui" : "Task ditambahkan", "");
      setOpenTahapan(false);
      setEditTarget(null);
      await loadAll();
      const tgl = data.tanggal;
      const todayS = todayJakarta();
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

  const jadwalFiles = (filePool?.soal ?? []).filter(s => s.deskripsi?.startsWith("__jadwal__:"));
  const soalFiles   = (filePool?.soal ?? []).filter(s => !s.deskripsi?.startsWith("__jadwal__:"));
  const totalSoal   = soalFiles.length;
  const now       = new Date();
  const todayStr  = todayJakarta();
  const active    = tahapanList.filter((t) => {
    const tglStr = t.tanggal.slice(0, 10);
    if (tglStr > todayStr) return true;   
    if (tglStr < todayStr) return false;  
    const [h, m] = t.jamSelesai.split(":").map(Number);
    const selesai = new Date(); selesai.setHours(h, m, 0, 0);
    return now < selesai;                 
  });
  const completed = tahapanList.filter((t) => !active.includes(t));
  const shown     = (tab === "active" ? active : completed)
    .filter((t) => t.judul.toLowerCase().includes(taskSearch.trim().toLowerCase()));
  const terima    = submisiList.filter((s) => s.status === "DITERIMA").length;
  const revisi    = submisiList.filter((s) => s.status === "REVISI").length;
  const menunggu  = submisiList.filter((s) => s.status === "TERKIRIM").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col xl:flex-row gap-6">

        <div className="flex-1 min-w-0 space-y-6">

          <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
                style={{ background: "linear-gradient(145deg, #0EA5E9 0%, #3E03B3 55%, #2D0281 100%)" }}>
                <FileText size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden"/>
                <FileText size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block"/>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Ujian Kompetensi Keahlian</span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">UKK</h1>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {openJadwalModal && (()=>{
              const allSoal = jadwalFiles;
              const curSoal = allSoal[soalJadwalIdx] ?? null;
              return (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className={`fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm ${appMode ? "items-end" : "items-center p-4"}`}
                onClick={(e)=>{if(e.target===e.currentTarget)setOpenJadwalModal(false)}}>
                <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                  transition={{type:"spring",damping:26,stiffness:340}}
                  className={`w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden ${appMode ? "rounded-t-[28px]" : "rounded-3xl"}`}
                  style={{maxHeight:"92vh"}}>

                  <div className="flex items-start gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-8 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#F1EDFA] flex items-center justify-center shrink-0">
                      <CalendarDays size={26} className="text-[#3E03B3]"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {allSoal.length > 1 && <span className="text-sm text-slate-500">{soalJadwalIdx+1} / {allSoal.length}</span>}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {curSoal ? curSoal.judul : "Jadwal UKK"}
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-500">{curSoal?.fileName ?? (allSoal.length === 0 ? "Belum ada file jadwal" : `${allSoal.length} info UKK`)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {allSoal.length > 1 && (
                        <>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.max(0,i-1))} disabled={soalJadwalIdx===0}
                            className="w-10 h-10 rounded-full bg-[#F1EDFA] flex items-center justify-center text-[#3E03B3] disabled:opacity-40 transition-colors">
                            <ChevronLeft size={18}/>
                          </button>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalJadwalIdx===allSoal.length-1}
                            className="w-10 h-10 rounded-full bg-[#F1EDFA] flex items-center justify-center text-[#3E03B3] disabled:opacity-40 transition-colors">
                            <ChevronRight size={18}/>
                          </button>
                        </>
                      )}
                      {curSoal && (
                        <button onClick={async()=>{ await deleteSoal(curSoal.id); setSoalJadwalIdx(i=>Math.max(0,i-1)); }}
                          className="w-10 h-10 rounded-full bg-[#FFE9E2] flex items-center justify-center text-[#E8562B] transition-colors" title="Hapus jadwal ini">
                          <Trash2 size={14}/>
                        </button>
                      )}
                      <button onClick={()=>{ setOpenJadwalModal(false); setOpenTambahJadwal(true); }}
                        className="flex items-center gap-1.5 text-sm font-bold px-5 h-10 rounded-full bg-[#3E03B3] text-white transition-colors">
                        <Plus size={13}/> Tambah
                      </button>
                      <button onClick={()=>setOpenJadwalModal(false)}
                        className="w-10 h-10 rounded-full bg-[#F1EDFA] flex items-center justify-center text-[#3E03B3] transition-colors">
                        <X size={18}/>
                      </button>
                    </div>
                  </div>

                  {curSoal ? (
                    <SoalPdfViewer soal={curSoal} onClose={()=>setOpenJadwalModal(false)}/>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800">
                        <FileText size={30} className="text-[#3E03B3]"/>
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

          <AnimatePresence>
            {openSoalModal && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className={`fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm ${appMode ? "items-end" : "items-center p-4"}`}
                onClick={(e)=>{if(e.target===e.currentTarget)setOpenSoalModal(false)}}>
                <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                  transition={{type:"spring",damping:26,stiffness:340}}
                  className={`w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden ${appMode ? "rounded-t-[28px]" : "rounded-3xl"}`}
                  style={{maxHeight:"92vh"}}>
                  {(()=>{
                    const allSoal = soalFiles;
                    const curSoal = allSoal[soalSoalIdx] ?? null;
                    return (
                      <>
                        <div className="flex items-start gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-8 shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-[#F1EDFA] flex items-center justify-center shrink-0">
                            <FileText size={26} className="text-[#3E03B3]"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {allSoal.length > 1 && <span className="text-sm text-slate-500">{soalSoalIdx+1} / {allSoal.length}</span>}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {curSoal ? curSoal.judul : "Soal UKK"}
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-500">{curSoal?.fileName ?? `${totalSoal} soal tersedia`}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {allSoal.length > 1 && (
                              <>
                                <button onClick={()=>setSoalSoalIdx(i=>Math.max(0,i-1))} disabled={soalSoalIdx===0}
                                  className="w-10 h-10 rounded-full bg-[#F1EDFA] flex items-center justify-center text-[#3E03B3] disabled:opacity-40 transition-colors">
                                  <ChevronLeft size={18}/>
                                </button>
                                <button onClick={()=>setSoalSoalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalSoalIdx===allSoal.length-1}
                                  className="w-10 h-10 rounded-full bg-[#F1EDFA] flex items-center justify-center text-[#3E03B3] disabled:opacity-40 transition-colors">
                                  <ChevronRight size={18}/>
                                </button>
                              </>
                            )}
                            {curSoal && (
                              <button onClick={async()=>{ await deleteSoal(curSoal.id); setSoalSoalIdx(i=>Math.max(0,i-1)); }}
                                className="w-10 h-10 rounded-full bg-[#FFE9E2] flex items-center justify-center text-[#E8562B] transition-colors" title="Hapus soal ini">
                                <Trash2 size={14}/>
                              </button>
                            )}
                            <button onClick={()=>{ setOpenSoalModal(false); setOpenTambahSoal(true); }}
                              className="flex items-center gap-1.5 text-sm font-bold px-5 h-10 rounded-full bg-[#3E03B3] text-white transition-colors">
                              <CloudUpload size={13}/> Tambah
                            </button>
                            <button onClick={()=>setOpenSoalModal(false)}
                              className="w-10 h-10 rounded-full bg-[#F1EDFA] flex items-center justify-center text-[#3E03B3] transition-colors">
                              <X size={18}/>
                            </button>
                          </div>
                        </div>

                        {curSoal ? (
                          <SoalPdfViewer soal={curSoal} onClose={()=>setOpenSoalModal(false)}/>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800">
                              <FileText size={30} className="text-[#3E03B3]"/>
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

          <div className="mb-8 grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
            <div>
            <div className="hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800 lg:block">
              <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</p>
                <div className="flex flex-col gap-4">
              <button type="button" onClick={() => { setSoalJadwalIdx(0); setOpenJadwalModal(true); }}
                className="relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-left text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "#3E03B3", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                  <CalendarDays size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-xl font-black leading-tight">Jadwal<span className="text-white/70"> UKK</span></p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">{jadwalFiles.length} file jadwal · TA 2026/2027</p>
                </div>
              </button>

              <button type="button" onClick={() => { setSoalSoalIdx(0); setOpenSoalModal(true); }}
                className="relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "#F26A3D", color: "#FFFFFF", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                  <FileText size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-xl font-black leading-tight">Soal<span className="text-white/70"> UKK</span></p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">{totalSoal} soal diunggah · TA 2026/2027</p>
                </div>
              </button>
                </div>
              </div>

              {appMode && (
                <div className="space-y-5 lg:hidden">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Ujian Kompetensi Keahlian</p>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">UKK</h1>
                  </div>
                  <section>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Berkas UKK</h2>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { label: "Jadwal UKK", sub: `${jadwalFiles.length} file`, icon: CalendarDays, tone: "sky" as const, onClick: () => { setSoalJadwalIdx(0); setOpenJadwalModal(true); } },
                        { label: "Soal UKK", sub: `${totalSoal} soal`, icon: FileText, tone: "violet" as const, onClick: () => { setSoalSoalIdx(0); setOpenSoalModal(true); } },
                      ].map((b) => (
                        <button key={b.label} type="button" onClick={b.onClick}
                          className="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] active:scale-[0.97] dark:bg-[#1E293B]">
                          <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(b.tone)}>
                            <b.icon size={26} color="#fff" />
                          </span>
                          <span className="text-[15px] font-bold text-slate-900 dark:text-white">{b.label}</span>
                          <span className="-mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{b.sub}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}
              <div className={appMode ? "hidden" : "contents"}>
              <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
                <div className="app-header-row relative flex items-center px-4 pb-3 pt-4">
                  <button type="button" onClick={() => router.push("/admin/dashboard")}
                    className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
                    <ChevronLeft size={18} />
                  </button>
                  <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">UKK</h1>
                </div>
                <div className="rounded-t-[28px] bg-[#FFFFFF] px-4 pb-1 pt-3 dark:bg-[#1E293B]">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button type="button" onClick={() => { setSoalJadwalIdx(0); setOpenJadwalModal(true); }}
                      className="relative flex h-24 flex-col justify-between overflow-hidden rounded-2xl px-3 py-3 text-left text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.98]"
                      style={{ background: "#3E03B3" }}>
                      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
                      <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-white/20">
                        <CalendarDays size={14} />
                      </div>
                      <div className="relative min-w-0">
                        <p className="truncate text-sm font-black leading-tight">Jadwal UKK</p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-white/75">{jadwalFiles.length} file jadwal</p>
                      </div>
                    </button>
                    <button type="button" onClick={() => { setSoalSoalIdx(0); setOpenSoalModal(true); }}
                      className="relative flex h-24 flex-col justify-between overflow-hidden rounded-2xl px-3 py-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.98]"
                      style={{ background: "#F26A3D", color: "#FFFFFF" }}>
                      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
                      <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-white/20">
                        <FileText size={14} />
                      </div>
                      <div className="relative min-w-0">
                        <p className="truncate text-sm font-black leading-tight">Soal UKK</p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-white/75">{totalSoal} soal diunggah</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>

              <div className="flex flex-col gap-6">

          {appMode && (
            <div className="space-y-4 lg:hidden">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Task UKK</h2>
                <button type="button" onClick={() => { setEditTarget(null); setOpenTahapan(true); }}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white active:scale-95" style={{ background: APP_ACCENT }}>
                  <Plus size={14} /> Tambah
                </button>
              </div>
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Cari task..."
                  className="w-full rounded-full bg-slate-100 py-3.5 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#3E03B3]/30 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <AppTabs
                tabs={[["active", `Aktif (${active.length})`], ["completed", `Selesai (${completed.length})`]] as const}
                value={tab} onChange={setTab} layoutId="app-ukk-admin-tab" />
              {loading ? (
                <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />)}</div>
              ) : shown.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: APP_SOFT, color: APP_ACCENT }}><CalendarDays size={24} /></span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {taskSearch.trim() ? `Tidak ada task dengan nama "${taskSearch.trim()}"` : tab === "active" ? "Tidak ada task aktif" : "Tidak ada task selesai"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {shown.map((t, idx) => (
                    <li key={t.id} className="rounded-3xl bg-white p-3 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                      <button type="button" onClick={() => setSubmisiModalTahapan(t)} className="flex w-full items-center gap-4 text-left active:opacity-80">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-white" style={icon3dStyle(toneAt(idx))}>{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{t.judul}</p>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{formatTgl(t.tanggal)} · {t.jamMulai}–{t.jamSelesai} · {t.lokasi}</p>
                          <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "#FFE9E2", color: "#F26A3D" }}>
                            {submisiList.length} pengumpulan
                          </span>
                        </div>
                      </button>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => { setEditTarget(t); setOpenTahapan(true); }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold" style={{ background: "#FFE9E2", color: "#F26A3D" }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button type="button" onClick={() => deleteTahapan(t.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-50 py-2.5 text-xs font-bold text-red-600">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className={`flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${appMode ? "max-lg:hidden" : ""}`}>
            <div className="px-5 pt-5 pb-0" style={{background:"rgba(62,3,179,0.05)"}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"#3E03B3"}}>
                    <BookOpen size={14} className="text-white"/>
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">My Task</p>
                </div>
                <button onClick={() => { setEditTarget(null); setOpenTahapan(true); }}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-sm sm:px-4"
                  style={{background:"#3E03B3"}}>
                  <Plus size={13} /> <span className="hidden sm:inline">Tambah Task</span>
                </button>
              </div>
              <div className="relative mb-3">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
                <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Cari nama task..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#8F6DD3] focus:ring-2 focus:ring-[#F1EDFA] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:ring-[#000000]/30" />
              </div>
              <div className="flex gap-6 border-b border-slate-100 dark:border-slate-700">
                <button onClick={() => setTab("active")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="active" ? "border-[#00AAFA] text-[#3E03B3] dark:text-[#8F6DD3]" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                  Active Task
                  {tab==="active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{backgroundColor:"#3E03B3"}}>{active.length}</span>}
                </button>
                <button onClick={() => setTab("completed")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="completed" ? "border-[#F26A3D] text-[#5D900F] dark:text-[#C4B5FD]" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                  Completed
                  {tab==="completed" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{backgroundColor:"#F26A3D"}}>{completed.length}</span>}
                </button>
              </div>
            </div>

            <div className="max-h-[330px] overflow-auto">
              {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Memuat data...</div>}
              {!loading && shown.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <CalendarDays size={32} className="mx-auto mb-3 text-slate-200"/>
                  <p className="text-sm text-slate-400">{taskSearch.trim() ? `Tidak ada task dengan nama "${taskSearch.trim()}"` : tab==="active" ? "Tidak ada task aktif" : "Tidak ada task selesai"}</p>
                </div>
              )}
              {!loading && shown.length > 0 && (
                <>
                <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-170 text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-700/40 dark:bg-slate-700/60">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Task</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tanggal</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Waktu</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Lokasi</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Terkumpul</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((t, idx) => {
                      const rp  = rowPalette(idx);
                      const sudahKumpul = submisiList.length;
                      const pct = Math.min(Math.round((sudahKumpul / Math.max(submisiList.length || 12, 1)) * 100), 100);
                      return (
                        <tr key={t.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{background:rp.gradient}}>
                                <span className="text-xs font-bold" style={{color: rp.gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF"}}>{idx+1}</span>
                              </div>
                              <p className="max-w-[160px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.judul}</p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatTgl(t.tanggal)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.jamMulai}–{t.jamSelesai}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.lokasi}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div className="h-full rounded-full" style={{width:`${pct}%`, background:rp.gradient}}/>
                              </div>
                              <span className="text-xs font-bold" style={{color:rp.bar}}>{pct}%</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setSubmisiModalTahapan(t)}
                                className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all"
                                style={{borderColor:rp.bar, color:rp.bar, backgroundColor:rp.bg}}>
                                <BookOpen size={11}/>
                                Lihat
                                {sudahKumpul > 0 && (
                                  <span className="rounded-lg px-1.5 py-0.5 text-[9px] font-bold text-white" style={{backgroundColor:rp.bar}}>{sudahKumpul}</span>
                                )}
                              </button>
                              <button onClick={() => { setEditTarget(t); setOpenTahapan(true); }}
                                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                                <Pencil size={12}/>
                              </button>
                              <button onClick={() => deleteTahapan(t.id)}
                                className="rounded-lg p-1.5 text-slate-300 hover:bg-[#F6FEE8] hover:text-[#5D900F] hover:dark:text-[#C4B5FD] dark:hover:bg-[#48700B]/20">
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-700/40">
                  {shown.map((t, idx) => {
                    const rp = rowPalette(idx);
                    const sudahKumpul = submisiList.length;
                    const pct = Math.min(Math.round((sudahKumpul / Math.max(submisiList.length || 12, 1)) * 100), 100);
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: rp.gradient }}>
                          <span className="text-xs font-bold" style={{ color: rp.gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF" }}>{idx + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.judul}</p>
                          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{formatTgl(t.tanggal)} · {t.jamMulai}–{t.jamSelesai} · {t.lokasi}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: rp.gradient }} />
                            </div>
                            <span className="text-[11px] font-bold" style={{ color: rp.bar }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button onClick={() => setSubmisiModalTahapan(t)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold"
                            style={{ color: rp.bar, backgroundColor: rp.bg }}>
                            <BookOpen size={11} />
                            {sudahKumpul > 0 && sudahKumpul}
                          </button>
                          <button onClick={() => { setEditTarget(t); setOpenTahapan(true); }}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => deleteTahapan(t.id)}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-[#F6FEE8] hover:text-[#5D900F] hover:dark:text-[#C4B5FD] dark:hover:bg-[#48700B]/20">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </div>
          </div>
          </div>

        </div>

      </div>

      <AnimatePresence>
        {submisiModalTahapan && (() => {
          const sm = submisiModalTahapan;
          const rows = submisiList;
          const sudahSiswa = new Set(rows.map((x) => x.siswa?.id ?? x.id)).size;
          return (
            <motion.div key="submisi-modal-overlay"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className={`fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm ${appMode ? "items-end" : "items-center p-4"}`}
              onClick={(e) => { if (e.target === e.currentTarget) setSubmisiModalTahapan(null); }}>
              <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
                className={`bg-white dark:bg-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden ${appMode ? "rounded-t-[28px]" : "rounded-2xl"}`}>

                <div className="app-sheet-header relative p-6 shrink-0"
                  style={{background:"#3E03B3"}}>
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
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 text-xs font-semibold text-white">
                      <MapPin size={10}/>{sm.lokasi}
                    </span>
                    {sm.penguji && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 text-xs font-semibold text-white">
                        <User size={10}/>{sm.penguji}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 text-xs font-semibold text-white">
                      <CalendarDays size={10}/>{formatTgl(sm.tanggal)}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 text-xs font-semibold text-white">
                      <Clock size={10}/>{sm.jamMulai}–{sm.jamSelesai}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 shrink-0 divide-x divide-y divide-slate-100 border-b border-slate-100 dark:divide-slate-700 dark:border-slate-700 sm:divide-y-0">
                  {[
                    { label: "Sudah mengumpulkan", val: sudahSiswa, color: "#3E03B3" },
                    { label: "Belum mengumpulkan", val: Math.max(0, totalSiswaAll - sudahSiswa), color: "#E8562B" },
                  ].map((st, i) => (
                    <div key={i} className="p-4 text-center">
                      <p className="text-3xl font-extrabold" style={{color:st.color}}>{st.val}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{st.label}</p>
                    </div>
                  ))}
                </div>

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
                      <div key={s.id} className="flex flex-col gap-3 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                        <div className="flex items-center gap-3 sm:contents">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{backgroundColor: isDone ? "#F26A3D" : sc.text}}>
                            {nama[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{nama}</p>
                            <p className="text-xs text-slate-400 truncate">{s.soal?.judul ?? "—"} · {formatTgl(s.submittedAt)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:contents sm:pl-0">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                          style={{backgroundColor: sc.bg, color: sc.text}}>
                          ✓ Terkumpul
                        </span>
                        <a href={s.fileUrl.startsWith("http") ? s.fileUrl : `http://localhost:3001${s.fileUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 bg-[#F1EDFA] dark:bg-[#3E03B3]/30 text-[#3E03B3] dark:text-[#C4B5FD]">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                            <path d="M6.18 15L3.12 9.72 9.24 0h5.51L8.63 9.72 6.18 15zm5.82 0H7.76l2.45-4.28h7.13L14.89 15h-2.89zM12 7.5l2.89-5h2.89L21 7.5h-5.78L12 7.5zM20.88 15l-2.45-4.28h2.01L24 15h-3.12z"/>
                          </svg>
                          GDrive
                        </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 shrink-0 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500">Project yang dikumpulkan siswa otomatis tercatat selesai.</p>
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
        warna="#3E03B3"
        showTahapan={false}
      />

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
        warna="#3E03B3"
        showTahapan={false}
      />

    </div>
  );
}
