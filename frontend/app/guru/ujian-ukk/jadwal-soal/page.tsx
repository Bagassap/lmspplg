"use client";

import { isTaskAktif, formatRentang, daftarTanggal } from "@/lib/ukkWaktu";
import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  CalendarDays, FileText, BookOpen, Loader2,
  ChevronLeft, ChevronRight, X, Search,
} from "lucide-react";
import { todayJakarta } from "@/components/absensi-harian/shared";
import { AppTabs, APP_ACCENT, APP_SOFT } from "@/components/app/AppUI";
import { icon3dStyle, toneAt } from "@/components/shared/Icon3D";
import { useIsAppMode } from "@/lib/pwaInstall";

const SoalPdfViewer = dynamic(() => import("./SoalPdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-[#5D900F] dark:text-[#C4B5FD]" />
    </div>
  ),
});

interface Soal { id: string; judul: string; deskripsi?: string; fileUrl: string; fileName: string; }
interface Tahapan { id: string; hariKe: number; judul: string; tanggal: string; tanggalSelesai?: string | null; jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string; keterangan?: string; soal: Soal[]; }
interface Submisi { id: string; tahapan?: { id: string; judul: string }; fileUrl: string; fileName: string; status: "TERKIRIM"|"DITERIMA"|"REVISI"; submittedAt: string; soal: { id: string; judul: string }; siswa: { id: string; nama: string; user: { id: string; nama: string } }; }

function formatTgl(s: string) { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }); }

const ROW_PALETTES = [
  { bg:"#F1EDFA", text:"#3E03B3",  bar:"#3E03B3",  gradient:"#3E03B3" },
  { bg:"#F1EDFA", text:"#F26A3D",  bar:"#F26A3D",  gradient:"#F26A3D" },
  { bg:"#F1EDFA", text:"#F26A3D",  bar:"#F26A3D",  gradient:"#F26A3D" },
  { bg:"#FFFFFF", text:"#F26A3D",  bar:"#F26A3D",  gradient:"#F26A3D" },
  { bg:"#F1EDFA", text:"#0EA5E9",  bar:"#0EA5E9",  gradient:"#3E03B3" },
];
function rowPalette(i: number) { return ROW_PALETTES[i % ROW_PALETTES.length]; }

const SUBMISI_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  DITERIMA: { label: "Diterima", color: "#3E03B3", bg: "#F1EDFA" },
  REVISI: { label: "Revisi", color: "#3E03B3", bg: "#FFFFFF" },
  TERKIRIM: { label: "Menunggu", color: "#3E03B3", bg: "#F1EDFA" },
};

function SubmisiList({ items }: { items: Submisi[] }) {
  if (items.length === 0) {
    return <div className="px-4 py-6 text-center text-xs text-slate-400">Belum ada siswa yang mengumpulkan</div>;
  }
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
      {items.map((s) => {
        const cfg = SUBMISI_STATUS_CFG[s.status];
        return (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "#3E03B3" }}>
              {(s.siswa?.user?.nama || s.siswa?.nama)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {s.siswa?.user?.nama || s.siswa?.nama}
              </p>
              <p className="text-[10px] text-slate-400">{s.fileName}</p>
            </div>
            <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
            <a href={s.fileUrl.startsWith("http") ? s.fileUrl : `/api${s.fileUrl}`}
              target="_blank" rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-[#F1EDFA] dark:bg-slate-700 text-[#3E03B3] dark:text-[#C4B5FD]">
              <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 fill-current"><path d="M6.18 15L3.12 9.72 9.24 0h5.51L8.63 9.72 6.18 15zm5.82 0H7.76l2.45-4.28h7.13L14.89 15h-2.89zM12 7.5l2.89-5h2.89L21 7.5h-5.78L12 7.5zM20.88 15l-2.45-4.28h2.01L24 15h-3.12z"/></svg>
              {s.fileUrl.startsWith("http") ? "GDrive" : "Unduh"}
            </a>
          </div>
        );
      })}
    </div>
  );
}


export default function GuruJadwalSoalPage() {
  const router = useRouter();
  const appMode = useIsAppMode();
  const [tahapanList, setTahapanList] = useState<Tahapan[]>([]);
  const [semuaTahapan, setSemuaTahapan] = useState<Tahapan[]>([]);
  const [submisiList, setSubmisiList] = useState<Submisi[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"active"|"completed"|"all">("all");
  const [taskSearch, setTaskSearch]   = useState("");
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
    const all: Tahapan[] = Array.isArray(t) ? t : [];
    const list = all.filter(x => x.hariKe !== 0);
    setSemuaTahapan(all);
    setTahapanList(list);
    setSubmisiList(Array.isArray(s) ? s : []);
    setLoading(false);
    const nowCheck = new Date();
    const todayCheck = todayJakarta();
    const hasActive = list.some(tk => isTaskAktif(tk));
    if (!hasActive && list.length > 0) setTab("completed");
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  function toggleExpand(id: string) { setExpanded(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }); }

  const now      = new Date();
  const todayStr = todayJakarta();
  const active   = tahapanList.filter(t => isTaskAktif(t));
  const completed = tahapanList.filter(t => !active.includes(t));
  const shown     = (tab === "all" ? tahapanList : tab === "active" ? active : completed)
    .filter((t) => t.judul.toLowerCase().includes(taskSearch.trim().toLowerCase()));
  const totalSoal = semuaTahapan.flatMap(t=>t.soal).filter(s=>!s.deskripsi?.startsWith("__jadwal__:")).length;

  return (
    <div className="space-y-6">

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
              const allSoal = semuaTahapan.flatMap(t=>t.soal).filter(s=>s.deskripsi?.startsWith("__jadwal__:"));
              const curSoal = allSoal[soalJadwalIdx] ?? null;
              return (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  className={`fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm ${appMode ? "items-end" : "items-center p-4"}`}
                  onClick={e=>{if(e.target===e.currentTarget)setOpenJadwalModal(false)}}>
                  <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                    transition={{type:"spring",damping:26,stiffness:340}}
                    className={`w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden ${appMode ? "rounded-t-[28px]" : "rounded-3xl"}`}
                    style={{maxHeight:"92vh"}}>
                    <div className="flex items-start gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-8 shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#F1EDFA] text-[#3E03B3]">
                        <CalendarDays size={26}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className={`text-xl sm:text-2xl font-extrabold leading-snug line-clamp-2 text-slate-900 dark:text-white`}>
                          {curSoal ? curSoal.judul : "Jadwal UKK"}
                        </h2>
                        <p className={`mt-0.5 text-sm text-slate-500`}>{curSoal?.fileName ?? (allSoal.length===0 ? "Belum ada file jadwal" : `${allSoal.length} info UKK`)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {allSoal.length > 1 && (<>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.max(0,i-1))} disabled={soalJadwalIdx===0}
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}>
                            <ChevronLeft size={18}/>
                          </button>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalJadwalIdx===allSoal.length-1}
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}>
                            <ChevronRight size={18}/>
                          </button>
                        </>)}
                        <button onClick={()=>setOpenJadwalModal(false)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#F1EDFA] text-[#3E03B3]`}>
                          <X size={18}/>
                        </button>
                      </div>
                    </div>
                    {curSoal ? (
                      <SoalPdfViewer soal={curSoal} onClose={()=>setOpenJadwalModal(false)}/>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                        <FileText size={30} className="text-[#5D900F] dark:text-[#C4B5FD]"/>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada file jadwal</p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <AnimatePresence>
            {openSoalModal && (()=>{
              const allSoal = semuaTahapan.flatMap(t=>t.soal).filter(s=>!s.deskripsi?.startsWith("__jadwal__:"));
              const curSoal = allSoal[soalSoalIdx] ?? null;
              return (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  className={`fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm ${appMode ? "items-end" : "items-center p-4"}`}
                  onClick={e=>{if(e.target===e.currentTarget)setOpenSoalModal(false)}}>
                  <motion.div initial={{scale:0.93,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.93,opacity:0,y:24}}
                    transition={{type:"spring",damping:26,stiffness:340}}
                    className={`w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden ${appMode ? "rounded-t-[28px]" : "rounded-3xl"}`}
                    style={{maxHeight:"92vh"}}>
                    <div className="flex items-start gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-8 shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#F1EDFA] text-[#3E03B3]">
                        <FileText size={22}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className={`text-xl sm:text-2xl font-extrabold leading-snug line-clamp-2 text-slate-900 dark:text-white`}>
                          {curSoal ? curSoal.judul : "Soal UKK"}
                        </h2>
                        <p className={`mt-0.5 text-sm text-slate-500`}>{curSoal?.fileName ?? `${totalSoal} soal tersedia`}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {allSoal.length > 1 && (<>
                          <button onClick={()=>setSoalSoalIdx(i=>Math.max(0,i-1))} disabled={soalSoalIdx===0}
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}>
                            <ChevronLeft size={18}/>
                          </button>
                          <button onClick={()=>setSoalSoalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalSoalIdx===allSoal.length-1}
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}>
                            <ChevronRight size={18}/>
                          </button>
                        </>)}
                        <button onClick={()=>setOpenSoalModal(false)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#F1EDFA] text-[#3E03B3]`}>
                          <X size={18}/>
                        </button>
                      </div>
                    </div>
                    {curSoal ? (
                      <SoalPdfViewer soal={curSoal} onClose={()=>setOpenSoalModal(false)}/>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                        <FileText size={30} className="text-[#3E03B3]"/>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada soal</p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {(()=>{ const jadwalFiles = semuaTahapan.flatMap(t=>t.soal).filter(s=>s.deskripsi?.startsWith("__jadwal__:")); return (
          <>
          <div className="mb-8 grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
            <div>
            <div className="hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800 lg:block">
              <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</p>
                <div className="flex flex-col gap-4">
              <button type="button" onClick={()=>{ setSoalJadwalIdx(0); setOpenJadwalModal(true); }}
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

              <button type="button" onClick={()=>{ setSoalSoalIdx(0); setOpenSoalModal(true); }}
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
                <div className="relative flex items-center px-4 pb-3 pt-4">
                  <button type="button" onClick={() => router.push("/guru/dashboard")}
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
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Task UKK</h2>
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Cari task..."
                  className="w-full rounded-full bg-slate-100 py-3.5 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#3E03B3]/30 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <AppTabs
                tabs={[["all", "Semua"], ["active", "Aktif"], ["completed", "Selesai"]] as const}
                value={tab} onChange={setTab} layoutId="app-ukk-guru-tab" />
              {loading ? (
                <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />)}</div>
              ) : shown.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: APP_SOFT, color: APP_ACCENT }}><CalendarDays size={24} /></span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {taskSearch.trim() ? `Tidak ada task dengan nama "${taskSearch.trim()}"` : tab === "active" ? "Tidak ada task aktif" : tab === "completed" ? "Tidak ada task selesai" : "Belum ada task"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {shown.map((t, idx) => {
                    const exp = expanded.has(t.id);
                    const submisiTahapan = submisiList.filter((x) => x.tahapan?.id === t.id);
                    return (
                      <li key={t.id} className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                        <button type="button" onClick={() => toggleExpand(t.id)} className="flex w-full items-center gap-4 p-3 text-left active:opacity-80">
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-white" style={icon3dStyle(toneAt(idx))}>{idx + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{t.judul}</p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{formatRentang(t)} · {t.jamMulai}–{t.jamSelesai} · {t.lokasi}</p>
                            <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "#FFE9E2", color: "#F26A3D" }}>
                              {submisiTahapan.length} pengumpulan
                            </span>
                          </div>
                          <ChevronRight size={18} className={`shrink-0 text-slate-300 transition-transform ${exp ? "rotate-90" : ""}`} />
                        </button>
                        {exp && (
                          <div className="border-t border-slate-100 bg-slate-50/60 dark:border-slate-700/40 dark:bg-slate-700/20">
                            <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Hasil Kerja Siswa</div>
                            <SubmisiList items={submisiTahapan} />
                          </div>
                        )}
                      </li>
                    );
                  })}
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
                </div>
                <div className="relative mb-3">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
                  <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Cari nama task..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#8F6DD3] focus:ring-2 focus:ring-[#F1EDFA] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:ring-[#000000]/30" />
                </div>
                <div className="flex gap-5 border-b border-slate-100 dark:border-slate-700">
                  <button onClick={()=>setTab("all")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="all" ? "border-slate-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                    style={tab==="all"?{color:"#64748B"}:{}}>
                    Semua
                    {tab==="all" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{backgroundColor:"#64748B"}}>{tahapanList.length}</span>}
                  </button>
                  <button onClick={()=>setTab("active")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="active" ? "border-[#00AAFA] text-[#3E03B3] dark:text-[#8F6DD3]" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                    Aktif
                    {tab==="active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{backgroundColor:"#3E03B3"}}>{active.length}</span>}
                  </button>
                  <button onClick={()=>setTab("completed")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="completed" ? "border-[#F26A3D] text-[#5D900F] dark:text-[#C4B5FD]" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                    Selesai
                    {tab==="completed" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{backgroundColor:"#F26A3D"}}>{completed.length}</span>}
                  </button>
                </div>
              </div>

              <div className="max-h-[330px] overflow-auto">
                {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Memuat data...</div>}
                {!loading && shown.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <CalendarDays size={32} className="mx-auto mb-3 text-slate-200"/>
                    <p className="text-sm text-slate-400">{taskSearch.trim() ? `Tidak ada task dengan nama "${taskSearch.trim()}"` : tab==="active" ? "Tidak ada task aktif" : tab==="completed" ? "Tidak ada task selesai" : "Belum ada task"}</p>
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
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Penguji</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Terkumpul</th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((t, idx) => {
                        const rp  = rowPalette(idx);
                        const exp = expanded.has(t.id);
                        const submisiTahapan = submisiList.filter((x) => x.tahapan?.id === t.id);
                        const sudahKumpul = submisiTahapan.length;
                        const pct = Math.min(Math.round((sudahKumpul / Math.max(submisiList.length || 12, 1)) * 100), 100);
                        return (
                          <Fragment key={t.id}>
                            <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{background:rp.gradient}}>
                                    <span className="text-xs font-bold" style={{color: rp.gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF"}}>{idx+1}</span>
                                  </div>
                                  <p className="max-w-[160px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.judul}</p>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatRentang(t)}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.jamMulai}–{t.jamSelesai}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.lokasi}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.penguji || "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div className="h-full rounded-full" style={{width:`${pct}%`, background:rp.gradient}}/>
                                  </div>
                                  <span className="text-xs font-bold" style={{color:rp.bar}}>{pct}%</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right">
                                <button onClick={()=>toggleExpand(t.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all"
                                  style={{borderColor:rp.bar, color:rp.bar, backgroundColor:rp.bg}}>
                                  <BookOpen size={11}/>
                                  Lihat
                                  {sudahKumpul > 0 && (
                                    <span className="rounded-lg px-1.5 py-0.5 text-[9px] font-bold text-white" style={{backgroundColor:rp.bar}}>{sudahKumpul}</span>
                                  )}
                                </button>
                              </td>
                            </tr>
                            {exp && (
                              <tr className="border-b border-slate-100 dark:border-slate-700/40">
                                <td colSpan={7} className="bg-slate-50/50 p-0 dark:bg-slate-700/20">
                                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-700">
                                    <span>Hasil Kerja Siswa</span>
                                    <span className="text-[10px] normal-case font-semibold">{submisiTahapan.length} pengumpulan</span>
                                  </div>
                                  <SubmisiList items={submisiTahapan} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>

                  <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-700/40">
                    {shown.map((t, idx) => {
                      const rp = rowPalette(idx);
                      const exp = expanded.has(t.id);
                      const submisiTahapan = submisiList.filter((x) => x.tahapan?.id === t.id);
                      const sudahKumpul = submisiTahapan.length;
                      const pct = Math.min(Math.round((sudahKumpul / Math.max(submisiList.length || 12, 1)) * 100), 100);
                      return (
                        <div key={t.id}>
                          <button type="button" onClick={() => toggleExpand(t.id)} className="flex w-full items-center gap-3 p-3 text-left">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: rp.gradient }}>
                              <span className="text-xs font-bold" style={{ color: rp.gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF" }}>{idx + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.judul}</p>
                              <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{formatRentang(t)} · {t.jamMulai}–{t.jamSelesai} · {t.lokasi}</p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: rp.gradient }} />
                                </div>
                                <span className="text-[11px] font-bold" style={{ color: rp.bar }}>{pct}%</span>
                              </div>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold"
                              style={{ color: rp.bar, backgroundColor: rp.bg }}>
                              {sudahKumpul > 0 && sudahKumpul}
                              <BookOpen size={11} />
                            </span>
                          </button>
                          {exp && (
                            <div className="border-t border-slate-100 bg-slate-50/50 dark:border-slate-700/40 dark:bg-slate-700/20">
                              <div className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <span>Hasil Kerja Siswa</span>
                                <span className="text-[10px] normal-case font-semibold">{submisiTahapan.length} pengumpulan</span>
                              </div>
                              <SubmisiList items={submisiTahapan} />
                            </div>
                          )}
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

          </>
          )})()}

    </div>
  );
}
