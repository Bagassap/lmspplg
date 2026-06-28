"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  CalendarDays, FileText, Send, BookOpen, Loader2,
  ChevronLeft, ChevronRight, X, Download,
  MapPin, Clock, User,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

const SoalPdfViewer = dynamic(() => import("./SoalPdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-amber-500" />
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Soal { id: string; judul: string; deskripsi?: string; fileUrl: string; fileName: string; }
interface Tahapan { id: string; hariKe: number; judul: string; tanggal: string; jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string; keterangan?: string; soal: Soal[]; }
interface Submisi { id: string; fileUrl: string; fileName: string; status: "TERKIRIM"|"DITERIMA"|"REVISI"; submittedAt: string; soal: { id: string; judul: string }; siswa: { id: string; nama: string; user: { id: string; nama: string } }; }
interface DiskusiItem { id: string; konten: string; createdAt: string; user: { id: string; nama: string; role: string }; replies: DiskusiItem[]; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTgl(s: string) { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }

const ROW_PALETTES = [
  { bg:"#EEF4FF", text:"#4F8EF7",  bar:"#4F8EF7",  gradient:"linear-gradient(135deg,#4F8EF7,#6366F1)" },
  { bg:"#ECFDF5", text:"#10B981",  bar:"#10B981",  gradient:"linear-gradient(135deg,#10B981,#0D9488)" },
  { bg:"#FFF1F2", text:"#EF4444",  bar:"#EF4444",  gradient:"linear-gradient(135deg,#EF4444,#F97316)" },
  { bg:"#FFFBEB", text:"#F59E0B",  bar:"#F59E0B",  gradient:"linear-gradient(135deg,#F59E0B,#EF4444)" },
  { bg:"#F0F0FF", text:"#6366F1",  bar:"#6366F1",  gradient:"linear-gradient(135deg,#6366F1,#8B5CF6)" },
];
function rowPalette(i: number) { return ROW_PALETTES[i % ROW_PALETTES.length]; }

const BUBBLE_COLORS = [
  { bubble:"#EEF2FF", text:"#4338CA", avatar:"linear-gradient(135deg,#6366F1,#818CF8)" },
  { bubble:"#F0FDF4", text:"#15803D", avatar:"linear-gradient(135deg,#10B981,#34D399)" },
  { bubble:"#FFF7ED", text:"#C2410C", avatar:"linear-gradient(135deg,#F97316,#FBBF24)" },
  { bubble:"#FDF4FF", text:"#7E22CE", avatar:"linear-gradient(135deg,#A855F7,#EC4899)" },
  { bubble:"#ECFEFF", text:"#0E7490", avatar:"linear-gradient(135deg,#06B6D4,#3B82F6)" },
];
function bubbleFor(id: string) { let h=0; for(const c of id) h=(h*31+c.charCodeAt(0))>>>0; return BUBBLE_COLORS[h % BUBBLE_COLORS.length]; }

// ─── Diskusi ─────────────────────────────────────────────────────────────────

function DiskusiActivity({ currentUserId }: { currentUserId: string }) {
  const [list, setList] = useState<DiskusiItem[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; nama: string } | null>(null);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const load = useCallback(async () => { const r = await fetch("/api/ujian-ukk/diskusi"); if (r.ok) setList(await r.json()); }, []);
  useEffect(() => { load(); }, [load]);

  async function send() {
    if (!input.trim()) return;
    setSending(true);
    const body: Record<string,string> = { konten: input.trim() };
    if (replyTo) body.parentId = replyTo.id;
    const r = await fetch("/api/ujian-ukk/diskusi", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    setSending(false);
    if (r.ok) { setInput(""); setReplyTo(null); load(); } else toast.error("Gagal mengirim","");
  }
  async function hapus(id: string) { await fetch(`/api/ujian-ukk/diskusi/${id}`, { method:"DELETE" }); load(); }

  const ROLE_LABELS: Record<string,string> = { ADMIN:"Admin", GURU:"Guru", SISWA:"Siswa" };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden" style={{minHeight:420}}>
      {/* Header gradient */}
      <div className="relative px-5 py-4 overflow-hidden shrink-0"
        style={{background:"linear-gradient(135deg,#6334F4 0%,#8B5CF6 50%,#EC4899 100%)"}}>
        <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10"/>
        <div className="pointer-events-none absolute -bottom-4 right-16 w-16 h-16 rounded-full bg-white/8"/>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Send size={14} className="text-white"/>
            </div>
            <h3 className="text-sm font-extrabold text-white">Diskusi UKK</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
            {list.flatMap(d=>[d,...d.replies]).length} pesan
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {list.flatMap(d=>[d,...d.replies]).length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Send size={24} className="text-slate-200 mb-2"/>
            <p className="text-xs text-slate-400">Belum ada diskusi.</p>
          </div>
        )}
        {list.flatMap(d=>[{...d, isReply:false},...d.replies.map(r=>({...r,isReply:true}))]).map((d) => {
          const bc = bubbleFor(d.user.id);
          const roleLabel = ROLE_LABELS[d.user.role] ?? d.user.role;
          return (
            <div key={d.id} className={`flex gap-2.5 ${d.isReply ? "pl-6" : ""}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                style={{background: bc.avatar}}>{d.user.nama[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{d.user.nama}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:bc.avatar}}>{roleLabel}</span>
                </div>
                <div className="rounded-2xl rounded-tl-none px-3 py-2" style={{backgroundColor: bc.bubble}}>
                  <p className="text-xs leading-relaxed" style={{color: bc.text}}>{d.konten}</p>
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setReplyTo({id:d.id, nama:d.user.nama})} className="text-[10px] text-slate-400 hover:text-violet-500">Balas</button>
                  {d.user.id === currentUserId && <button onClick={() => hapus(d.id)} className="text-[10px] text-slate-400 hover:text-red-500">Hapus</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-600 px-3 py-1.5 rounded-lg">
            Balas ke <strong>{replyTo.nama}</strong>
            <button onClick={() => setReplyTo(null)} className="ml-auto"><X size={11}/></button>
          </div>
        )}
        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Tulis pesan..." className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-violet-400"/>
          <button onClick={send} disabled={sending || !input.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white shrink-0 disabled:opacity-50"
            style={{background:"linear-gradient(135deg,#6334F4,#8B5CF6)"}}>
            <Send size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GuruJadwalSoalPage() {
  const [tahapanList, setTahapanList] = useState<Tahapan[]>([]);
  const [submisiList, setSubmisiList] = useState<Submisi[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"active"|"completed"|"all">("all");
  const [expanded, setExpanded]       = useState<Set<string>>(new Set());
  const [openJadwalModal, setOpenJadwalModal] = useState(false);
  const [openSoalModal,   setOpenSoalModal]   = useState(false);
  const [soalJadwalIdx,   setSoalJadwalIdx]   = useState(0);
  const [soalSoalIdx,     setSoalSoalIdx]     = useState(0);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([
      fetch("/api/ujian-ukk/tahapan").then(r => r.json()).catch(() => []),
      fetch("/api/ujian-ukk/submisi").then(r => r.json()).catch(() => []),
    ]);
    const list: Tahapan[] = Array.isArray(t) ? t : [];
    setTahapanList(list);
    setSubmisiList(Array.isArray(s) ? s : []);
    setLoading(false);
    const nowCheck = new Date();
    const todayCheck = nowCheck.toISOString().slice(0, 10);
    const hasActive = list.some(tk => {
      const tglStr = tk.tanggal?.slice(0, 10) ?? "";
      if (tglStr > todayCheck) return true;
      if (tglStr < todayCheck) return false;
      const [h, m] = (tk.jamSelesai ?? "23:59").split(":").map(Number);
      const selesai = new Date(); selesai.setHours(h, m, 0, 0);
      return nowCheck < selesai;
    });
    if (!hasActive && list.length > 0) setTab("completed");
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  function toggleExpand(id: string) { setExpanded(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }); }

  const now      = new Date();
  const todayStr = now.toISOString().slice(0,10);
  const active   = tahapanList.filter(t => {
    const tglStr = t.tanggal?.slice(0,10) ?? "";
    if (tglStr > todayStr) return true;
    if (tglStr < todayStr) return false;
    const [h,m] = (t.jamSelesai ?? "23:59").split(":").map(Number);
    const selesai = new Date(); selesai.setHours(h,m,0,0);
    return now < selesai;
  });
  const completed = tahapanList.filter(t => !active.includes(t));
  const shown     = tab === "all" ? tahapanList : tab === "active" ? active : completed;
  const totalSoal = tahapanList.flatMap(t=>t.soal).filter(s=>!s.deskripsi?.startsWith("__jadwal__:")).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── Left Column ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{background:"linear-gradient(135deg,#6334F4 0%,#8B5CF6 40%,#EC4899 80%,#F97316 100%)"}}>
            <div className="pointer-events-none absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10"/>
            <div className="pointer-events-none absolute -bottom-8 right-32 w-36 h-36 rounded-full bg-white/8"/>
            <div className="pointer-events-none absolute bottom-4 -left-6 w-24 h-24 rounded-full bg-white/6"/>
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
                  <FileText size={26} className="text-white"/>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Ujian Kompetensi Keahlian</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">Guru</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-white leading-tight">Jadwal &amp; Soal UKK</h1>
                  <p className="text-sm text-white/70 mt-0.5">Lihat jadwal, soal, dan pantau pengumpulan siswa</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {[
                  { icon: CalendarDays, label:"Task", val: tahapanList.length },
                  { icon: FileText,     label:"Soal",    val: totalSoal },
                  { icon: Send,         label:"Kumpul",  val: submisiList.length },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm min-w-16">
                    <Icon size={14} className="text-white/70 mb-1"/>
                    <p className="text-xl font-extrabold text-white leading-none">{val}</p>
                    <p className="text-[10px] text-white/60 font-semibold mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Jadwal Modal */}
          <AnimatePresence>
            {openJadwalModal && (()=>{
              const allSoal = tahapanList.flatMap(t=>t.soal).filter(s=>s.deskripsi?.startsWith("__jadwal__:"));
              const curSoal = allSoal[soalJadwalIdx] ?? null;
              return (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={e=>{if(e.target===e.currentTarget)setOpenJadwalModal(false)}}>
                  <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                    transition={{type:"spring",damping:26,stiffness:340}}
                    className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{maxHeight:"92vh"}}>
                    <div className="relative flex items-start gap-4 px-6 py-5 overflow-hidden shrink-0"
                      style={{background:"linear-gradient(135deg,#F59E0B,#F97316)"}}>
                      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none"/>
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <CalendarDays size={22} className="text-white"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white/95">Jadwal UKK</span>
                        <h2 className="mt-1 text-lg font-extrabold text-white leading-snug line-clamp-2">
                          {curSoal ? curSoal.judul : "Jadwal UKK"}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-white/70">{curSoal?.fileName ?? (allSoal.length===0 ? "Belum ada file jadwal" : `${allSoal.length} info UKK`)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {allSoal.length > 1 && (<>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.max(0,i-1))} disabled={soalJadwalIdx===0}
                            className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40">
                            <ChevronLeft size={16}/>
                          </button>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalJadwalIdx===allSoal.length-1}
                            className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40">
                            <ChevronRight size={16}/>
                          </button>
                        </>)}
                        <button onClick={()=>setOpenJadwalModal(false)}
                          className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30">
                          <X size={16}/>
                        </button>
                      </div>
                    </div>
                    {curSoal ? (
                      <SoalPdfViewer soal={curSoal} onClose={()=>setOpenJadwalModal(false)}/>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                        <FileText size={30} className="text-amber-300"/>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada file jadwal</p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Soal Modal */}
          <AnimatePresence>
            {openSoalModal && (()=>{
              const allSoal = tahapanList.flatMap(t=>t.soal).filter(s=>!s.deskripsi?.startsWith("__jadwal__:"));
              const curSoal = allSoal[soalSoalIdx] ?? null;
              return (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={e=>{if(e.target===e.currentTarget)setOpenSoalModal(false)}}>
                  <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                    transition={{type:"spring",damping:26,stiffness:340}}
                    className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{maxHeight:"92vh"}}>
                    <div className="relative flex items-start gap-4 px-6 py-5 overflow-hidden shrink-0"
                      style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)"}}>
                      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none"/>
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <FileText size={22} className="text-white"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white/95">Soal UKK</span>
                        <h2 className="mt-1 text-lg font-extrabold text-white leading-snug line-clamp-2">
                          {curSoal ? curSoal.judul : "Soal UKK"}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-white/70">{curSoal?.fileName ?? `${totalSoal} soal tersedia`}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {allSoal.length > 1 && (<>
                          <button onClick={()=>setSoalSoalIdx(i=>Math.max(0,i-1))} disabled={soalSoalIdx===0}
                            className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40">
                            <ChevronLeft size={16}/>
                          </button>
                          <button onClick={()=>setSoalSoalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalSoalIdx===allSoal.length-1}
                            className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30 disabled:opacity-40">
                            <ChevronRight size={16}/>
                          </button>
                        </>)}
                        <button onClick={()=>setOpenSoalModal(false)}
                          className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/30">
                          <X size={16}/>
                        </button>
                      </div>
                    </div>
                    {curSoal ? (
                      <SoalPdfViewer soal={curSoal} onClose={()=>setOpenSoalModal(false)}/>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                        <FileText size={30} className="text-indigo-300"/>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada soal</p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* ── Layout: kiri (2 card + My Task) | kanan (Diskusi) ── */}
          {(()=>{ const jadwalFiles = tahapanList.flatMap(t=>t.soal).filter(s=>s.deskripsi?.startsWith("__jadwal__:")); return (
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">

            {/* Kolom kiri */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* 2 Card sejajar */}
              <div className="flex gap-3">
                {/* Card Jadwal */}
                <button onClick={()=>{ setSoalJadwalIdx(0); setOpenJadwalModal(true); }}
                  className="flex-1 relative overflow-hidden rounded-2xl text-white text-left focus:outline-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] p-4 sm:p-5"
                  style={{background:"linear-gradient(135deg,#F59E0B,#F97316)", boxShadow:"0 8px 28px rgba(245,158,11,0.45)"}}>
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="absolute -right-2 -bottom-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="relative flex items-center justify-between gap-2">
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
                    <div className="relative text-right shrink-0">
                      <p className="text-4xl sm:text-5xl font-black leading-none">{jadwalFiles.length}</p>
                      <p className="text-[10px] text-white/70 mt-1 font-medium">info</p>
                    </div>
                  </div>
                </button>

                {/* Card Soal */}
                <button onClick={()=>{ setSoalSoalIdx(0); setOpenSoalModal(true); }}
                  className="flex-1 relative overflow-hidden rounded-2xl text-white text-left focus:outline-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] p-4 sm:p-5"
                  style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)", boxShadow:"0 8px 28px rgba(99,102,241,0.45)"}}>
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="absolute -right-2 -bottom-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
                  <div className="relative flex items-center justify-between gap-2">
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
                    <div className="relative text-right shrink-0">
                      <p className="text-4xl sm:text-5xl font-black leading-none">{totalSoal}</p>
                      <p className="text-[10px] text-white/70 mt-1 font-medium">soal</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* My Task */}
              <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="px-5 pt-5 pb-0" style={{background:"linear-gradient(135deg,rgba(79,142,247,0.06) 0%,rgba(99,102,241,0.06) 50%,rgba(16,185,129,0.06) 100%)"}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#4F8EF7,#6366F1)"}}>
                      <BookOpen size={14} className="text-white"/>
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">My Task</p>
                  </div>
                </div>
                <div className="flex gap-5 border-b border-slate-100 dark:border-slate-700">
                  <button onClick={()=>setTab("all")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="all" ? "border-violet-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                    style={tab==="all"?{color:"#8B5CF6"}:{}}>
                    Semua
                    {tab==="all" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{backgroundColor:"#8B5CF6"}}>{tahapanList.length}</span>}
                  </button>
                  <button onClick={()=>setTab("active")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="active" ? "border-blue-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                    style={tab==="active"?{color:"#4F8EF7"}:{}}>
                    Aktif
                    {tab==="active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{backgroundColor:"#4F8EF7"}}>{active.length}</span>}
                  </button>
                  <button onClick={()=>setTab("completed")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="completed" ? "border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                    style={tab==="completed"?{color:"#10B981"}:{}}>
                    Selesai
                    {tab==="completed" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold" style={{backgroundColor:"#10B981"}}>{completed.length}</span>}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Memuat data...</div>}
                {!loading && shown.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <CalendarDays size={32} className="mx-auto mb-3 text-slate-200"/>
                    <p className="text-sm text-slate-400">{tab==="active" ? "Tidak ada task aktif" : tab==="completed" ? "Tidak ada task selesai" : "Belum ada task"}</p>
                  </div>
                )}
                {shown.map((t, idx) => {
                  const rp  = rowPalette(idx);
                  const exp = expanded.has(t.id);
                  const submisiTahapan = submisiList.filter(s => t.soal.some(so => so.id === s.soal?.id));
                  const sudahKumpul = submisiTahapan.length;
                  const pct = Math.min(Math.round((sudahKumpul / Math.max(totalSoal,1))*100),100);
                  return (
                    <motion.div key={t.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:idx*0.05}}>
                      <div className="px-5 py-4 flex items-center gap-4 border-l-4 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700/20"
                        style={{borderLeftColor:rp.bar}}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                          style={{background:rp.gradient}}>
                          <span className="text-sm font-bold text-white">{idx+1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5">{t.judul}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{backgroundColor:"#EFF6FF",color:"#3B82F6"}}>
                              <CalendarDays size={10}/>{formatTgl(t.tanggal)}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{backgroundColor:"#F0FDF4",color:"#16A34A"}}>
                              <Clock size={10}/>{t.jamMulai}–{t.jamSelesai}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{backgroundColor:"#FFF7ED",color:"#EA580C"}}>
                              <MapPin size={10}/>{t.lokasi}
                            </span>
                            {t.penguji && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{backgroundColor:"#FDF4FF",color:"#9333EA"}}>
                                <User size={10}/>{t.penguji}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-32 shrink-0 hidden sm:block">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400">Terkumpul</span>
                            <span className="text-[10px] font-bold" style={{color:rp.bar}}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background:rp.gradient}}/>
                          </div>
                        </div>
                        <button onClick={()=>toggleExpand(t.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 transition-all"
                          style={{borderColor:rp.bar, color:rp.bar, backgroundColor:rp.bg}}>
                          <BookOpen size={11}/>
                          Lihat
                          {sudahKumpul > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor:rp.bar}}>
                              {sudahKumpul}
                            </span>
                          )}
                        </button>
                      </div>

                      <AnimatePresence>
                        {exp && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                            <div className="mx-5 mb-4 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50/50 dark:bg-slate-700/20">
                              <div className="px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <span>Hasil Kerja Siswa</span>
                                <span className="text-[10px] normal-case font-semibold">{submisiTahapan.length} pengumpulan</span>
                              </div>
                              {submisiTahapan.length === 0 ? (
                                <div className="px-4 py-6 text-center text-xs text-slate-400">Belum ada siswa yang mengumpulkan</div>
                              ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
                                  {submisiTahapan.map(s => {
                                    const statusCfg: Record<string,{label:string;color:string;bg:string}> = {
                                      DITERIMA:{ label:"Diterima", color:"#10B981", bg:"#ECFDF5" },
                                      REVISI:  { label:"Revisi",   color:"#F59E0B", bg:"#FEF3C7" },
                                      TERKIRIM:{ label:"Menunggu", color:"#6366F1", bg:"#EEF2FF" },
                                    };
                                    const cfg = statusCfg[s.status];
                                    return (
                                      <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                          style={{background:"linear-gradient(135deg,#6366F1,#8B5CF6)"}}>
                                          {(s.siswa?.user?.nama || s.siswa?.nama)?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                            {s.siswa?.user?.nama || s.siswa?.nama}
                                          </p>
                                          <p className="text-[10px] text-slate-400">{s.fileName}</p>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                          style={{color:cfg.color, backgroundColor:cfg.bg}}>{cfg.label}</span>
                                        <a href={s.fileUrl.startsWith("http") ? s.fileUrl : `http://localhost:3001${s.fileUrl}`}
                                          target="_blank" rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                                          style={{color:"#4285F4", backgroundColor:"#EFF6FF"}}>
                                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0"><path d="M6.18 15L3.12 9.72 9.24 0h5.51L8.63 9.72 6.18 15zm5.82 0H7.76l2.45-4.28h7.13L14.89 15h-2.89zM12 7.5l2.89-5h2.89L21 7.5h-5.78L12 7.5zM20.88 15l-2.45-4.28h2.01L24 15h-3.12z"/></svg>
                                          GDrive
                                        </a>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            </div>{/* end kolom kiri */}

            {/* Diskusi — merentang penuh */}
            <div className="w-full lg:w-80 shrink-0">
              <DiskusiActivity currentUserId=""/>
            </div>
          </div>
          )})()}

        </div>
      </div>
    </div>
  );
}
