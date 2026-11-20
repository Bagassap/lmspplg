"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, FileText, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { icon3dStyle, TONE_ORDER } from "@/components/shared/Icon3D";
import type { LaporDiriFile, LaporDiriStatusSaya } from "./lapor-diri-types";
import { Portal } from "@/components/shared/Portal";

function periodeLabel(periode: string): string {
  const [y, m] = periode.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function fmtTgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

export function LaporDiriSiswaList() {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<LaporDiriStatusSaya | null>(null);
  const [form, setForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState("");
  const [kirim, setKirim] = useState(false);

  const load = useCallback(() => {
    fetch("/api/magang/lapor-diri/saya", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d))
      .catch(() => setStatus(null));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!file) { toast.error("Pilih berkas lapor diri", ""); return; }
    setKirim(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (catatan.trim()) fd.append("catatan", catatan.trim());
      const res = await fetch("/api/magang/lapor-diri/saya", { method: "POST", body: fd });
      if (res.ok) {
        toast.success("Lapor diri terkirim", "");
        setForm(false); setFile(null); setCatatan("");
        load();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal mengirim lapor diri", "");
      }
    } finally {
      setKirim(false);
    }
  }

  if (!status || !status.hasPenempatan) return null;

  const daftar: LaporDiriFile[] = [
    ...(status.current ? [status.current] : []),
    ...status.history.filter((h) => h.id !== status.current?.id),
  ];

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Lapor Diri</h2>
        <button type="button" onClick={() => setForm(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-[#3E03B3] px-3.5 text-xs font-bold text-white">
          <Upload size={14} /> {status.sudahLapor ? "Unggah ulang" : "Unggah"}
        </button>
      </div>

      <div className={`mt-3 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold ${status.sudahLapor ? "bg-[#E4F5EC] text-[#22A06B]" : "bg-[#F1EDFA] text-[#3E03B3]"}`}>
        {status.sudahLapor ? <CheckCircle2 size={14} /> : <Clock size={14} />}
        {status.sudahLapor ? `Sudah lapor diri ${periodeLabel(status.periode)}` : `Belum lapor diri ${periodeLabel(status.periode)}`}
      </div>

      {daftar.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada berkas lapor diri</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {daftar.map((f, i) => (
            <li key={f.id}>
              <a href={`/api/uploads${f.fileUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 active:opacity-70">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(TONE_ORDER[i % TONE_ORDER.length])}>
                  <FileText size={22} color="#fff" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Clock size={11} /> {fmtTgl(f.createdAt)}</p>
                  <p className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{f.fileName}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {form && (
          <Portal><div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setForm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <h3 className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Unggah Lapor Diri</h3>
                <button type="button" onClick={() => setForm(false)} aria-label="Tutup"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><X size={16} /></button>
              </div>
              <input ref={ref} type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => ref.current?.click()}
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-[#3E03B3]/30 bg-[#F1EDFA] px-4 py-3 text-left dark:bg-slate-800">
                {file ? <FileText size={18} className="shrink-0 text-[#3E03B3]" /> : <Upload size={18} className="shrink-0 text-[#3E03B3]" />}
                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${file ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                  {file ? file.name : "Pilih berkas (PDF atau PPT)"}
                </span>
              </button>
              <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Catatan (opsional)"
                className="mt-3 w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-800 dark:text-slate-100" />
              <button type="button" onClick={submit} disabled={kirim || !file}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50">
                {kirim ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Kirim lapor diri
              </button>
            </motion.div>
          </div></Portal>
        )}
      </AnimatePresence>
    </section>
  );
}
