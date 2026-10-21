"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  CalendarDays, FileText, Send, BookOpen, Loader2,
  ChevronLeft, ChevronRight, X, Search,
  MapPin, Clock, User, CheckCircle, AlertCircle, Link2, ExternalLink, PieChart,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
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
interface Tahapan { id: string; hariKe: number; judul: string; tanggal: string; jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string; keterangan?: string; soal: Soal[]; }
interface MySubmisi { id: string; fileUrl: string; fileName: string; catatan?: string; pesanRevisi?: string; status: "TERKIRIM"|"DITERIMA"|"REVISI"; submittedAt: string; soal: { id: string; judul: string }; }

function formatTgl(s: string) { return new Date(s).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric", timeZone: "Asia/Jakarta" }); }

function statusInfo(s: "TERKIRIM"|"DITERIMA"|"REVISI") {
  if (s === "DITERIMA") return { bg:"#F1EDFA", color:"#3E03B3", label:"Diterima",      icon: <CheckCircle size={10}/> };
  if (s === "REVISI")   return { bg:"#FFFFFF", color:"#3E03B3", label:"Perlu Revisi",  icon: <AlertCircle size={10}/> };
  return                       { bg:"#F1EDFA", color:"#3E03B3", label:"Menunggu Review", icon: <Clock size={10}/> };
}

const ROW_PALETTES = [
  { bg:"#F1EDFA", text:"#3E03B3",  bar:"#3E03B3",  gradient:"#3E03B3" },
  { bg:"#F1EDFA", text:"#F26A3D",  bar:"#F26A3D",  gradient:"#F26A3D" },
  { bg:"#F1EDFA", text:"#F26A3D",  bar:"#F26A3D",  gradient:"#F26A3D" },
  { bg:"#FFFFFF", text:"#F26A3D",  bar:"#F26A3D",  gradient:"#F26A3D" },
  { bg:"#F1EDFA", text:"#0EA5E9",  bar:"#0EA5E9",  gradient:"#3E03B3" },
];
function rowPalette(i: number) { return ROW_PALETTES[i % ROW_PALETTES.length]; }


function fileHref(url: string) {
  return url.startsWith("http") ? url : `/api${url}`;
}

function isValidDriveUrl(url: string) {
  return url.startsWith("https://drive.google.com/") || url.startsWith("https://docs.google.com/");
}

function SubmitModal({ open, onClose, soal, onSubmit }: {
  open: boolean; onClose: () => void; soal: Soal | null; onSubmit: (fd: FormData) => Promise<void>;
}) {
  const app = useIsAppMode();
  const [driveUrl, setDriveUrl] = useState("");
  const [catatan, setCatatan]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [urlError, setUrlError] = useState("");
  const [berkas, setBerkas] = useState<File | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setDriveUrl(""); setCatatan(""); setUrlError(""); setBerkas(null); } }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!soal) return;
    if (!berkas) {
      if (!driveUrl.trim()) { setUrlError("Upload file ZIP/RAR atau isi link Google Drive"); return; }
      if (!isValidDriveUrl(driveUrl.trim())) { setUrlError("Link harus dari Google Drive (drive.google.com atau docs.google.com)"); return; }
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("soalId", soal.id);
      if (berkas) fd.append("file", berkas);
      else fd.append("driveUrl", driveUrl.trim());
      if (catatan.trim()) fd.append("catatan", catatan.trim());
      await onSubmit(fd);
    } finally {
      setSaving(false);
    }
  }
  if (!soal) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className={`fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm ${app ? "items-end" : "items-center p-4"}`}
          onClick={onClose}>
          <motion.div initial={{scale:0.95,opacity:0,y:16}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0,y:16}}
            transition={{type:"spring",damping:26,stiffness:340}}
            className={`bg-white dark:bg-slate-800 w-full max-w-md shadow-2xl overflow-hidden ${app ? "rounded-t-[28px]" : "rounded-2xl"}`}
            onClick={e=>e.stopPropagation()}>
            <div className="relative px-6 py-5 overflow-hidden"
              style={{background: app ? "#F1EDFA" : "#F26A3D"}}>
              <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-black/10"/>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
                    <Link2 size={18} className="text-black"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Kirim Project</p>
                    <p className="text-base font-extrabold text-black leading-tight line-clamp-1">{soal.judul}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center text-black hover:bg-black/20">
                  <X size={15}/>
                </button>
              </div>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-[#F1EDFA] dark:bg-[#000000]/20 rounded-xl p-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background: app ? "#3E03B3" : "#3E03B3"}}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M6.18 15L3.12 9.72 9.24 0h5.51L8.63 9.72 6.18 15zm5.82 0H7.76l2.45-4.28h7.13L14.89 15h-2.89zM12 7.5l2.89-5h2.89L21 7.5h-5.78L12 7.5zM20.88 15l-2.45-4.28h2.01L24 15h-3.12z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2D0281] dark:text-[#8F6DD3]">Pastikan file sudah dishare</p>
                  <p className="text-[11px] text-[#00AAFA] dark:text-[#8F6DD3] mt-0.5">Set sharing Google Drive ke "Anyone with the link can view" sebelum kirim link.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Upload file (ZIP / RAR / 7Z / PDF)</label>
                <input ref={berkasRef} type="file" accept=".zip,.rar,.7z,.pdf,.doc,.docx,.ppt,.pptx" className="hidden"
                  onChange={e => { setBerkas(e.target.files?.[0] ?? null); setUrlError(""); }} />
                <button type="button" onClick={() => berkasRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl bg-[#F1EDFA] px-3 py-3 text-left dark:bg-slate-700/40">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#3E03B3]"><FileText size={16}/></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{berkas ? berkas.name : "Pilih file project (maks. 100 MB)"}</span>
                  {berkas && <span role="button" onClick={e => { e.stopPropagation(); setBerkas(null); if (berkasRef.current) berkasRef.current.value = ""; }} className="shrink-0 text-xs font-bold text-[#3E03B3]">Hapus</span>}
                </button>
                <p className="my-3 text-center text-[11px] font-semibold text-slate-400">— atau —</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Link Google Drive
                </label>
                <div className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-colors ${urlError ? "border-[#F26A3D] bg-[#F6FEE8] dark:bg-[#48700B]/10" : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus-within:border-[#F26A3D]"}${app ? " focus-within:border-[#3E03B3]" : ""}`}>
                  <Link2 size={15} className="text-slate-400 shrink-0"/>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={e=>{ setDriveUrl(e.target.value); setUrlError(""); }}
                    placeholder="https://drive.google.com/file/d/..."
                    className="flex-1 text-sm bg-transparent text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400"
                  />
                  {driveUrl && isValidDriveUrl(driveUrl) && (
                    <CheckCircle size={15} className="text-[#5D900F] dark:text-[#C4B5FD] shrink-0"/>
                  )}
                </div>
                {urlError && <p className="mt-1 text-[11px] text-[#5D900F] dark:text-[#C4B5FD]">{urlError}</p>}
              </div>

              {driveUrl && isValidDriveUrl(driveUrl) && (
                <a href={driveUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold text-[#5D900F] dark:text-[#C4B5FD] hover:text-[#48700B]">
                  <ExternalLink size={12}/> Cek link (buka di tab baru)
                </a>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Catatan (opsional)</label>
                <textarea value={catatan} onChange={e=>setCatatan(e.target.value)} rows={2}
                  placeholder="Tambahkan keterangan jika diperlukan..."
                  className={`w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none resize-none placeholder:text-slate-400 ${app ? "focus:border-[#3E03B3]" : "focus:border-[#F26A3D]"}`}/>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className={`flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 ${app ? "rounded-full" : "rounded-xl"}`}>
                  Batal
                </button>
                <button type="submit" disabled={saving || (!berkas && !driveUrl.trim())}
                  className={`flex-1 py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 ${app ? "rounded-full text-white" : "rounded-xl text-white"}`}
                  style={{background: app ? "#3E03B3" : "#F26A3D"}}>
                  {saving ? <><Loader2 size={14} className="animate-spin"/> Mengirim...</> : <><Send size={14}/> Kirim Project</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


export default function SiswaJadwalSoalPage() {
  const router = useRouter();
  const appMode = useIsAppMode();
  const [tahapanList, setTahapanList] = useState<Tahapan[]>([]);
  const [filePool,    setFilePool]    = useState<Tahapan | null>(null); 
  const [mySubmisi,   setMySubmisi]   = useState<MySubmisi[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,          setTab]         = useState<"active"|"completed"|"all">("all");
  const [taskSearch,   setTaskSearch]  = useState("");
  const [submitSoal,   setSubmitSoal]  = useState<Soal | null>(null);
  const [detailTarget, setDetailTarget] = useState<MySubmisi | null>(null);
  const [revisiModal,  setRevisiModal]  = useState<MySubmisi | null>(null);
  const [openJadwalModal, setOpenJadwalModal] = useState(false);
  const [openSoalModal,   setOpenSoalModal]   = useState(false);
  const [soalJadwalIdx,   setSoalJadwalIdx]   = useState(0);
  const [soalSoalIdx,     setSoalSoalIdx]     = useState(0);
  const toast = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([
      fetch("/api/ujian-ukk/tahapan").then(r => r.json()).catch(() => []),
      fetch("/api/ujian-ukk/submisi/saya").then(r => r.json()).catch(() => []),
    ]);
    const all: Tahapan[]  = Array.isArray(t) ? t : [];
    setFilePool(all.find(x => x.hariKe === 0) ?? null);
    const tasks = all.filter(x => x.hariKe !== 0);
    setTahapanList(tasks.length > 0 ? [tasks[0]] : []);
    setMySubmisi(Array.isArray(s) ? s : []);
    setLoading(false);
    const nowCheck = new Date();
    const todayCheck = todayJakarta();
    const hasActive = tasks.some(tk => {
      const tglStr = tk.tanggal?.slice(0, 10) ?? "";
      if (tglStr > todayCheck) return true;
      if (tglStr < todayCheck) return false;
      const [h, m] = (tk.jamSelesai ?? "23:59").split(":").map(Number);
      const selesai = new Date(); selesai.setHours(h, m, 0, 0);
      return nowCheck < selesai;
    });
    if (!hasActive && tasks.length > 0) setTab("completed");
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  async function doSubmit(fd: FormData) {
    try {
      const r = await fetch("/api/ujian-ukk/submisi", { method:"POST", body: fd });
      if (r.ok) { toast.success("Project berhasil dikirim!", "Guru akan mereview pengirimanmu."); setSubmitSoal(null); loadAll(); }
      else toast.error("Gagal mengirim", "Coba lagi");
    } catch {
      toast.error("Server tidak dapat dijangkau", "Periksa koneksi internet dan coba lagi.");
    }
  }

  const now      = new Date();
  const todayStr = todayJakarta();
  const active   = tahapanList.filter(t => {
    const tglStr = t.tanggal?.slice(0,10) ?? "";
    if (tglStr > todayStr) return true;
    if (tglStr < todayStr) return false;
    const [h,m] = (t.jamSelesai ?? "23:59").split(":").map(Number);
    const selesai = new Date(); selesai.setHours(h,m,0,0);
    return now < selesai;
  });
  const completed  = tahapanList.filter(t => !active.includes(t));
  const shown      = (tab === "all" ? tahapanList : tab === "active" ? active : completed)
    .filter((t) => t.judul.toLowerCase().includes(taskSearch.trim().toLowerCase()));
  const jadwalFiles = (filePool?.soal ?? []).filter(s => s.deskripsi?.startsWith("__jadwal__:"));
  const soalFiles   = (filePool?.soal ?? []).filter(s => !s.deskripsi?.startsWith("__jadwal__:"));
  const totalSoal   = soalFiles.length;
  const submisiMap = new Map(mySubmisi.filter(s=>s.soal?.id).map(s=>[s.soal.id, s]));
  const diterima   = mySubmisi.filter(s=>s.status==="DITERIMA").length;
  const revisiCnt  = mySubmisi.filter(s=>s.status==="REVISI").length;
  const menungguCnt = mySubmisi.filter(s=>s.status==="TERKIRIM").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col xl:flex-row gap-6">

        <div className="flex-1 min-w-0 space-y-6">

          <div className="relative hidden overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
                style={{ background: "linear-gradient(145deg, #0EA5E9 0%, #3E03B3 55%, #2D0281 100%)" }}>
                <FileText size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden"/>
                <FileText size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block"/>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Ujian Kompetensi Keahlian</span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">Jadwal dan Soal</h1>
              </div>
            </div>
          </div>

          <div className={`relative -m-4 lg:hidden ${appMode ? "hidden" : ""}`} style={{ background: "#3E03B3" }}>
            <div className="relative flex items-center px-4 pb-4 pt-4">
              <button type="button" onClick={() => router.push("/siswa/dashboard")}
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
                <ChevronLeft size={18} />
              </button>
              <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">UKK</h1>
            </div>
          </div>

          <AnimatePresence>
            {openJadwalModal && (()=>{
              const allSoal = jadwalFiles;
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}><ChevronLeft size={18}/></button>
                          <button onClick={()=>setSoalJadwalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalJadwalIdx===allSoal.length-1}
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}><ChevronRight size={18}/></button>
                        </>)}
                        <button onClick={()=>setOpenJadwalModal(false)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#F1EDFA] text-[#3E03B3]`}><X size={18}/></button>
                      </div>
                    </div>
                    {curSoal ? <SoalPdfViewer soal={curSoal} onClose={()=>setOpenJadwalModal(false)}/> : (
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
              const allSoal = soalFiles;
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}><ChevronLeft size={18}/></button>
                          <button onClick={()=>setSoalSoalIdx(i=>Math.min(allSoal.length-1,i+1))} disabled={soalSoalIdx===allSoal.length-1}
                            className={`w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 bg-[#F1EDFA] text-[#3E03B3]`}><ChevronRight size={18}/></button>
                        </>)}
                        <button onClick={()=>setOpenSoalModal(false)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#F1EDFA] text-[#3E03B3]`}><X size={18}/></button>
                      </div>
                    </div>
                    {curSoal ? <SoalPdfViewer soal={curSoal} onClose={()=>setOpenSoalModal(false)}/> : (
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

          <div className="mb-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr]">
            <div className={`rounded-3xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800 lg:col-start-1 lg:row-start-1 ${appMode ? "max-lg:hidden" : ""}`}>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</p>
                <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
              <button type="button" onClick={()=>{ setSoalJadwalIdx(0); setOpenJadwalModal(true); }}
                className="relative flex h-24 flex-col justify-between overflow-hidden rounded-2xl px-3 py-3 text-left text-white transition-all hover:scale-[1.01] active:scale-[0.99] lg:h-32 lg:px-5 lg:py-5"
                style={{ background: "#3E03B3", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 lg:h-9 lg:w-9 lg:rounded-2xl">
                  <CalendarDays size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-sm font-black leading-tight lg:text-xl">Jadwal<span className="text-white/70"> UKK</span></p>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-white/75 lg:text-[11px]">{jadwalFiles.length} file jadwal · TA 2026/2027</p>
                </div>
              </button>

              <button type="button" onClick={()=>{ setSoalSoalIdx(0); setOpenSoalModal(true); }}
                className="relative flex h-24 flex-col justify-between overflow-hidden rounded-2xl px-3 py-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] lg:h-32 lg:px-5 lg:py-5"
                style={{ background: "#F26A3D", color: "#FFFFFF", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 lg:h-9 lg:w-9 lg:rounded-2xl">
                  <FileText size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-sm font-black leading-tight lg:text-xl">Soal<span className="text-white/70"> UKK</span></p>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-white/75 lg:text-[11px]">{totalSoal} soal tersedia · TA 2026/2027</p>
                </div>
              </button>
                </div>
              </div>

              <div className="hidden flex-col gap-6 lg:flex">

          <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 pt-5 pb-0" style={{background:"rgba(62,3,179,0.05)"}}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"#3E03B3"}}>
                    <BookOpen size={14} className="text-white"/>
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">My Task</p>
                </div>
                <div className="relative mb-3">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
                  <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Cari nama task..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#8F6DD3] focus:ring-2 focus:ring-[#F1EDFA] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:ring-[#000000]/30" />
                </div>
                <div className="flex gap-5 border-b border-slate-100 dark:border-slate-700">
                  <button onClick={()=>setTab("all")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="all"?"border-slate-500":"text-slate-400 border-transparent hover:text-slate-600"}`}
                    style={tab==="all"?{color:"#64748B"}:{}}>
                    Semua
                    {tab==="all" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{backgroundColor:"#64748B"}}>{tahapanList.length}</span>}
                  </button>
                  <button onClick={()=>setTab("active")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="active"?"border-[#00AAFA] text-[#3E03B3] dark:text-[#8F6DD3]":"text-slate-400 border-transparent hover:text-slate-600"}`}>
                    Active Task
                    {tab==="active" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-lg text-white font-bold" style={{backgroundColor:"#3E03B3"}}>{active.length}</span>}
                  </button>
                  <button onClick={()=>setTab("completed")}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab==="completed"?"border-[#F26A3D] text-[#5D900F] dark:text-[#C4B5FD]":"text-slate-400 border-transparent hover:text-slate-600"}`}>
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
                    <p className="text-sm text-slate-400">{taskSearch.trim() ? `Tidak ada task dengan nama "${taskSearch.trim()}"` : tab==="active" ? "Tidak ada task aktif" : tab==="completed" ? "Tidak ada task selesai" : "Belum ada task tersedia"}</p>
                  </div>
                )}
                {!loading && shown.length > 0 && (
                  <table className="w-full min-w-170 text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-700/40 dark:bg-slate-700/60">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Task</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tanggal</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Waktu</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Lokasi</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Penguji</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Progress</th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((t, idx) => {
                        const rp        = rowPalette(idx);
                        const globalSoal = soalFiles[0] ?? null;
                        const myS       = globalSoal ? submisiMap.get(globalSoal.id) : undefined;
                        const isDiterima = myS?.status === "DITERIMA";
                        const isRevisi   = myS?.status === "REVISI";
                        const isTerkirim = myS?.status === "TERKIRIM";
                        const pct        = myS ? 100 : 0;

                        const btn = isDiterima
                          ? { label:"Diterima", icon:<CheckCircle size={11}/>, bg:"#F1EDFA", clr:"#3E03B3", border:"#F26A3D", onClick:()=>setDetailTarget(myS!) }
                          : isRevisi
                          ? { label:"Revisi", icon:<AlertCircle size={11}/>, bg:"#F2F2F2", clr:"#0F172A", border:"#0F172A", onClick:()=>setRevisiModal(myS!) }
                          : isTerkirim
                          ? { label:"Terkirim", icon:<CheckCircle size={11}/>, bg:"#F1EDFA", clr:"#3E03B3", border:"#3E03B3", onClick:()=>setDetailTarget(myS!) }
                          : { label:"Kirim", icon:<Send size={11}/>, bg:"#F1EDFA", clr:"#3E03B3", border:"#F26A3D", onClick:()=>(globalSoal ? setSubmitSoal(globalSoal) : toast.error("Project belum bisa dikirim", "Soal UKK belum diunggah oleh admin/guru.")) };

                        return (
                          <tr key={t.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{background: rp.gradient}}>
                                  <span className="text-xs font-bold" style={{color: rp.gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF"}}>{idx+1}</span>
                                </div>
                                <p className="max-w-[160px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.judul}</p>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatTgl(t.tanggal)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.jamMulai}–{t.jamSelesai}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.lokasi}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t.penguji || "—"}</td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                  <div className="h-full rounded-full" style={{width:`${pct}%`, background: isDiterima?"#F26A3D":isRevisi?"#F26A3D":rp.gradient}}/>
                                </div>
                                <span className="text-xs font-bold" style={{color: isDiterima?"#F26A3D":isRevisi?"#F26A3D":rp.bar}}>{pct}%</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              <button onClick={btn.onClick}
                                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-95"
                                style={{borderColor:btn.border, color:btn.clr, backgroundColor:btn.bg}}>
                                {btn.icon}{btn.label}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {appMode && (
            <div className="space-y-5 lg:hidden">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">UKK</p>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Jadwal &amp; Soal</h1>
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

              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Task UKK</h2>

              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Cari task..."
                  className="w-full rounded-full bg-slate-100 py-3.5 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#3E03B3]/30 dark:bg-slate-800 dark:text-slate-200" />
              </div>

              <AppTabs
                tabs={[["all", "Semua"], ["active", "Aktif"], ["completed", "Selesai"]] as const}
                value={tab} onChange={setTab} layoutId="app-ukk-tab" />

              {loading ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />)}
                </div>
              ) : shown.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: APP_SOFT, color: APP_ACCENT }}>
                    <CalendarDays size={24} />
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {taskSearch.trim() ? `Tidak ada task dengan nama "${taskSearch.trim()}"` : tab === "active" ? "Tidak ada task aktif" : tab === "completed" ? "Tidak ada task selesai" : "Belum ada task tersedia"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {shown.map((t, idx) => {
                    const globalSoal = soalFiles[0] ?? null;
                    const myS = globalSoal ? submisiMap.get(globalSoal.id) : undefined;
                    const isDiterima = myS?.status === "DITERIMA";
                    const isRevisi = myS?.status === "REVISI";
                    const isTerkirim = myS?.status === "TERKIRIM";
                    const btn = isDiterima
                      ? { label: "Diterima", icon: <CheckCircle size={12} />, bg: "#F1EDFA", clr: "#3E03B3", onClick: () => setDetailTarget(myS!) }
                      : isRevisi
                      ? { label: "Revisi", icon: <AlertCircle size={12} />, bg: APP_SOFT, clr: APP_ACCENT, onClick: () => setRevisiModal(myS!) }
                      : isTerkirim
                      ? { label: "Terkirim", icon: <CheckCircle size={12} />, bg: "#EEF2FF", clr: "#3E03B3", onClick: () => setDetailTarget(myS!) }
                      : { label: "Kirim", icon: <Send size={12} />, bg: APP_ACCENT, clr: "#FFFFFF", onClick: () => (globalSoal ? setSubmitSoal(globalSoal) : toast.error("Project belum bisa dikirim", "Soal UKK belum diunggah oleh admin/guru.")) };
                    return (
                      <li key={t.id} className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-white" style={icon3dStyle(toneAt(idx))}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{t.judul}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><CalendarDays size={10} />{formatTgl(t.tanggal)}</span>
                            <span className="flex items-center gap-1"><Clock size={10} />{t.jamMulai}–{t.jamSelesai}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} />{t.lokasi}</span>
                          </div>
                          <button onClick={btn.onClick}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold active:scale-95"
                            style={{ backgroundColor: btn.bg, color: btn.clr }}>
                            {btn.icon}{btn.label}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          <div className={appMode ? "hidden" : "contents"}>
          <div className="relative isolate -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
            <div className="h-6" />
            <div className="space-y-3 rounded-t-[28px] bg-[#FFFFFF] px-4 py-3 dark:bg-[#1E293B]">
            <div className="space-y-3 rounded-3xl bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1E293B]">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
                <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Cari nama task..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-[#3E03B3] focus:ring-2 focus:ring-[#3E03B3]/15 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200" />
              </div>
              <div className="flex items-center gap-4 border-b border-slate-200 px-1 dark:border-slate-700">
                <button type="button" onClick={()=>setTab("all")}
                  className="-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors"
                  style={tab==="all"?{borderColor:"#64748B",color:"#64748B"}:{borderColor:"transparent",color:"#94a3b8"}}>
                  Semua
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                    style={tab==="all"?{background:"#64748B18",color:"#64748B"}:{background:"#E2E8F0",color:"#94a3b8"}}>
                    {tahapanList.length}
                  </span>
                </button>
                <button type="button" onClick={()=>setTab("active")}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors ${tab==="active"?"text-[#3E03B3] dark:text-[#8F6DD3]":"text-[#94a3b8]"}`}
                  style={{ borderColor: tab==="active"?"#3E03B3":"transparent" }}>
                  Aktif
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tab==="active"?"text-[#3E03B3] dark:text-[#8F6DD3]":"text-[#94a3b8]"}`}
                    style={{ background: tab==="active"?"#3E03B318":"#E2E8F0" }}>
                    {active.length}
                  </span>
                </button>
                <button type="button" onClick={()=>setTab("completed")}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors ${tab==="completed"?"text-[#5D900F] dark:text-[#C4B5FD]":"text-[#94a3b8]"}`}
                  style={{ borderColor: tab==="completed"?"#F26A3D":"transparent" }}>
                  Selesai
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tab==="completed"?"text-[#5D900F] dark:text-[#C4B5FD]":"text-[#94a3b8]"}`}
                    style={{ background: tab==="completed"?"#F26A3D18":"#E2E8F0" }}>
                    {completed.length}
                  </span>
                </button>
              </div>
            </div>

            {loading && (
              <div className="rounded-3xl bg-white py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1E293B]">
                <p className="text-sm text-slate-400">Memuat data...</p>
              </div>
            )}
            {!loading && shown.length === 0 && (
              <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1E293B]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#3E03B318" }}>
                  <CalendarDays size={24} style={{ color: "#3E03B3" }} />
                </div>
                <p className="mt-4 text-sm text-slate-400">{taskSearch.trim() ? `Tidak ada task dengan nama "${taskSearch.trim()}"` : tab==="active" ? "Tidak ada task aktif" : tab==="completed" ? "Tidak ada task selesai" : "Belum ada task tersedia"}</p>
              </div>
            )}
            {!loading && shown.length > 0 && (
              <div className="space-y-2.5">
                {shown.map((t, idx) => {
                  const accent = idx % 2 === 0;
                  const globalSoal = soalFiles[0] ?? null;
                  const myS       = globalSoal ? submisiMap.get(globalSoal.id) : undefined;
                  const isDiterima = myS?.status === "DITERIMA";
                  const isRevisi   = myS?.status === "REVISI";
                  const isTerkirim = myS?.status === "TERKIRIM";
                  const pct        = myS ? 100 : 0;
                  const barColor   = isDiterima ? "#F26A3D" : isRevisi ? "#0F172A" : "#3E03B3";

                  const btn = isDiterima
                    ? { label:"Diterima", icon:<CheckCircle size={11}/>, bg: accent ? "rgba(255,255,255,0.2)" : "#F1EDFA", clr: accent ? "#fff" : "#3E03B3", onClick:()=>setDetailTarget(myS!) }
                    : isRevisi
                    ? { label:"Revisi", icon:<AlertCircle size={11}/>, bg: accent ? "rgba(255,255,255,0.2)" : "#F2F2F2", clr: accent ? "#fff" : "#0F172A", onClick:()=>setRevisiModal(myS!) }
                    : isTerkirim
                    ? { label:"Terkirim", icon:<CheckCircle size={11}/>, bg: accent ? "rgba(255,255,255,0.2)" : "#F1EDFA", clr: accent ? "#fff" : "#3E03B3", onClick:()=>setDetailTarget(myS!) }
                    : { label:"Kirim", icon:<Send size={11}/>, bg: accent ? "rgba(255,255,255,0.2)" : "#F1EDFA", clr: accent ? "#fff" : "#3E03B3", onClick:()=>(globalSoal ? setSubmitSoal(globalSoal) : toast.error("Project belum bisa dikirim", "Soal UKK belum diunggah oleh admin/guru.")) };

                  return (
                    <motion.div key={t.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className={`relative overflow-hidden rounded-[22px] p-4 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.10)] ${accent ? "" : "bg-white dark:bg-[#1E293B]"}`}
                      style={accent ? { backgroundColor: "#3E03B3" } : undefined}>
                      {accent && <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />}
                      <div className="relative flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                          style={{ backgroundColor: accent ? "rgba(255,255,255,0.2)" : "#3E03B318", color: accent ? "#fff" : "#3E03B3" }}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-bold ${accent ? "text-white" : "text-slate-800 dark:text-white"}`}>{t.judul}</p>
                          <div className={`mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium ${accent ? "text-white/75" : "text-slate-500 dark:text-slate-400"}`}>
                            <span className="flex items-center gap-1"><CalendarDays size={9} />{formatTgl(t.tanggal)}</span>
                            <span className="flex items-center gap-1"><Clock size={9} />{t.jamMulai}–{t.jamSelesai}</span>
                            <span className="flex items-center gap-1"><MapPin size={9} />{t.lokasi}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-3 flex items-center justify-between gap-2">
                        <div className="flex flex-1 items-center gap-2">
                          <div className="h-1.5 flex-1 max-w-24 overflow-hidden rounded-full" style={{ background: accent ? "rgba(255,255,255,0.25)" : "#FFFFFF" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent ? "#fff" : barColor }} />
                          </div>
                          <span className={`text-[10px] font-bold ${accent ? "text-white" : ""}`} style={accent ? undefined : { color: barColor }}>{pct}%</span>
                        </div>
                        <button onClick={btn.onClick}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold transition-all active:scale-95"
                          style={{ backgroundColor: btn.bg, color: btn.clr }}>
                          {btn.icon}{btn.label}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
          </div>
          </div>

        </div>
      </div>

      <SubmitModal open={!!submitSoal} onClose={()=>setSubmitSoal(null)} soal={submitSoal} onSubmit={doSubmit}/>

      <AnimatePresence>
        {detailTarget && (
          <motion.div key="detail-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className={`fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm ${appMode ? "items-end" : "items-center p-4"}`}
            onClick={()=>setDetailTarget(null)}>
            <motion.div initial={{scale:0.95,opacity:0,y:16}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0,y:16}}
              transition={{type:"spring",damping:26,stiffness:340}}
              className={`bg-white dark:bg-slate-800 w-full max-w-md shadow-2xl overflow-hidden ${appMode ? "rounded-t-[28px]" : "rounded-2xl"}`}
              onClick={e=>e.stopPropagation()}>
              <div className="relative px-6 py-5 overflow-hidden"
                style={{background: appMode ? "#F1EDFA" : detailTarget.status==="DITERIMA" ? "#F26A3D" : "#3E03B3"}}>
                <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10"/>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${appMode ? "bg-white text-[#3E03B3]" : "bg-white/20 text-white"}`}>
                      <CheckCircle size={18}/>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${appMode ? "text-slate-500" : "text-white/60"}`}>
                        {detailTarget.status==="DITERIMA" ? "Project Diterima ✓" : "Project Terkirim"}
                      </p>
                      <p className={`text-base font-extrabold leading-tight ${appMode ? "text-slate-900" : "text-white"}`}>{detailTarget.soal?.judul}</p>
                    </div>
                  </div>
                  <button onClick={()=>setDetailTarget(null)} className={`w-8 h-8 rounded-xl flex items-center justify-center ${appMode ? "bg-white text-slate-600" : "bg-white/20 text-white hover:bg-white/30"}`}>
                    <X size={15}/>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {detailTarget.status==="DITERIMA" && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F6FEE8] dark:bg-slate-700 border border-[#F6FEE8] dark:border-[#F26A3D]">
                    <CheckCircle size={18} className="text-[#5D900F] dark:text-[#C4B5FD] shrink-0"/>
                    <p className="text-sm font-bold text-[#48700B] dark:text-[#C4B5FD]">Project kamu telah diterima! UKK selesai.</p>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500">Status</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{backgroundColor: detailTarget.status==="DITERIMA"?"#F1EDFA":"#F1EDFA",
                              color: detailTarget.status==="DITERIMA"?"#F26A3D":"#3E03B3"}}>
                      {detailTarget.status==="DITERIMA" ? "Diterima" : "Menunggu Review"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500">Dikirim pada</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {new Date(detailTarget.submittedAt).toLocaleString("id-ID",{day:"numeric",month:"short",year:"numeric",hourCycle: "h23", hour: "2-digit",minute:"2-digit",timeZone:"Asia/Jakarta"})} WIB
                    </span>
                  </div>
                  {detailTarget.catatan && (
                    <div className="py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Catatan kamu</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{detailTarget.catatan}</p>
                    </div>
                  )}
                </div>
                <a href={fileHref(detailTarget.fileUrl)} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white ${appMode ? "rounded-full" : "rounded-xl"}`}
                  style={{background: appMode ? "#3E03B3" : "#3E03B3"}}>
                  <ExternalLink size={14}/> Buka Google Drive
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revisiModal && (
          <motion.div key="revisi-siswa-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className={`fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm ${appMode ? "items-end" : "items-center p-4"}`}
            onClick={()=>setRevisiModal(null)}>
            <motion.div initial={{scale:0.95,opacity:0,y:16}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0,y:16}}
              transition={{type:"spring",damping:26,stiffness:340}}
              className={`bg-white dark:bg-slate-800 w-full max-w-md shadow-2xl overflow-hidden ${appMode ? "rounded-t-[28px]" : "rounded-2xl"}`}
              onClick={e=>e.stopPropagation()}>
              <div className="relative px-6 py-5 overflow-hidden"
                style={{background: appMode ? "#F1EDFA" : "#F26A3D", color: appMode ? "#0F172A" : "#FFFFFF"}}>
                <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#000000]/10"/>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#000000]/15 flex items-center justify-center">
                      <AlertCircle size={18} className="text-[#000000] dark:text-[#C4B5FD]"/>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#000000]/70 uppercase tracking-widest">Perlu Revisi</p>
                      <p className="text-base font-extrabold text-[#000000] dark:text-[#C4B5FD] leading-tight">{revisiModal.soal?.judul}</p>
                    </div>
                  </div>
                  <button onClick={()=>setRevisiModal(null)} className="w-8 h-8 rounded-xl bg-[#000000]/15 flex items-center justify-center text-[#000000] dark:text-[#C4B5FD] hover:bg-[#000000]/25">
                    <X size={15}/>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-[#FFFFFF] dark:border-[#F26A3D] bg-[#FFFFFF] dark:bg-slate-700 px-4 py-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-[#5D900F] dark:text-[#C4B5FD] mt-0.5 shrink-0"/>
                    <div>
                      <p className="text-xs font-bold text-[#000000] dark:text-[#C4B5FD] mb-1.5">Catatan dari Penguji</p>
                      <p className="text-sm text-[#000000] dark:text-[#C4B5FD] leading-relaxed whitespace-pre-line">
                        {revisiModal.pesanRevisi || "Silakan perbaiki project kamu dan kirim ulang."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-500">Pengiriman sebelumnya</span>
                  <a href={fileHref(revisiModal.fileUrl)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-[#3E03B3] dark:text-[#8F6DD3]">
                    <ExternalLink size={11}/> Lihat GDrive Lama
                  </a>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Perbaiki project kamu sesuai catatan di atas, upload ke Google Drive, lalu kirim ulang link-nya.
                </p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={()=>setRevisiModal(null)}
                  className={`flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 ${appMode ? "rounded-full" : "rounded-xl"}`}>
                  Tutup
                </button>
                <button onClick={()=>{ setRevisiModal(null); soalFiles[0] && setSubmitSoal(soalFiles[0]); }}
                  className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 ${appMode ? "rounded-full" : "rounded-xl"}`}
                  style={appMode ? {background: "#3E03B3", color: "#fff"} : {background: "#F26A3D", color: "#FFFFFF"}}>
                  <Send size={13}/> Kirim Ulang Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
