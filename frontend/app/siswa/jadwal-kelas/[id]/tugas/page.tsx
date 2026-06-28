"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Loader2, ClipboardList, AlertCircle,
  CheckCircle2, RefreshCw, Download,
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

type TugasItem = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  deadline?: string | null;
  createdAt: string;
  _count: { submisi: number };
};

type SubmisiItem = {
  id: string;
  fileUrl?: string | null;
  submittedAt: string;
} | null;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getDeadlineInfo(deadline: string | null | undefined) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (diff < 0) return { label: "Terlewat", color: "#FF3644", bg: "#FFE9EA", textColor: "#CC1A26", urgent: true };
  if (days <= 2) return { label: `${Math.ceil(days)} hari lagi`, color: "#FF7867", bg: "#FFF0EE", textColor: "#CC4000", urgent: true };
  if (days <= 7) return { label: `${Math.round(days)} hari lagi`, color: "#FFC25B", bg: "#FFF5DC", textColor: "#8C6500", urgent: false };
  return { label: `${Math.round(days)} hari lagi`, color: "#10B981", bg: "#E8F8F1", textColor: "#065F46", urgent: false };
}

function filenameFromUrl(url: string | null | undefined) {
  if (!url) return null;
  return url.split("/").pop() ?? null;
}

export default function SiswaTugasPage() {
  const { id } = useParams<{ id: string }>();

  const [tugasList, setTugasList] = useState<TugasItem[]>([]);
  const [tugasLoading, setTugasLoading] = useState(false);
  const [submisiMap, setSubmisiMap] = useState<Record<string, SubmisiItem>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function loadTugas() {
    setTugasLoading(true);
    try {
      const res = await fetch(`/api/tugas-kelas?jadwalKelasId=${id}`);
      const data = await res.json();
      const list: TugasItem[] = Array.isArray(data) ? data : [];
      setTugasList(list);

      const entries = await Promise.all(
        list.map(async (t) => {
          try {
            const r = await fetch(`/api/tugas-kelas/${t.id}/submisi-saya`);
            const d = await r.json();
            return [t.id, d ?? null] as [string, SubmisiItem];
          } catch {
            return [t.id, null] as [string, SubmisiItem];
          }
        }),
      );
      setSubmisiMap(Object.fromEntries(entries));
    } finally {
      setTugasLoading(false);
    }
  }

  useEffect(() => { loadTugas(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(tugasId: string, file: File) {
    setUploadingId(tugasId);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/tugas-kelas/${tugasId}/submit`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setSubmisiMap((p) => ({ ...p, [tugasId]: data }));
        setSuccessId(tugasId);
        setTimeout(() => setSuccessId(null), 3000);
      } else {
        const err = await res.json().catch(() => null);
        setUploadError(err?.message ?? "Upload gagal");
        setTimeout(() => setUploadError(null), 4000);
      }
    } catch {
      setUploadError("Gagal terhubung ke server");
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      <div>
        <p className="text-sm font-bold text-gray-800 dark:text-white">Daftar Tugas</p>
        <p className="text-xs text-gray-400 dark:text-slate-400">{tugasList.length} tugas dari guru</p>
      </div>

      {/* Upload error toast */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            <AlertCircle size={14} className="shrink-0" />
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      {tugasLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : tugasList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-700">
            <ClipboardList size={20} className="text-gray-400 dark:text-slate-400" />
          </div>
          <p className="font-medium text-gray-500 dark:text-slate-400">Belum ada tugas</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">Guru belum membuat tugas untuk kelas ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tugasList.map((t, idx) => {
            const deadline = getDeadlineInfo(t.deadline);
            const isOverdue = deadline?.label === "Terlewat";
            const headerColor = isOverdue ? "#FF3644" : "#6334F4";
            const submisi = submisiMap[t.id];
            const sudahSubmit = !!submisi;
            const isUploading = uploadingId === t.id;
            const isSuccess = successId === t.id;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
                className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="w-1.5 shrink-0" style={{ background: `linear-gradient(180deg, ${headerColor}88, ${headerColor})` }} />
                <div className="flex flex-1 flex-col px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-extrabold leading-snug tracking-tight text-gray-900 dark:text-white">{t.judul}</p>
                    <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      sudahSubmit
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                    }`}>
                      {sudahSubmit ? "✓ Dikumpulkan" : "Belum"}
                    </span>
                  </div>

                  {deadline && (
                    <div className="mt-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{ backgroundColor: deadline.bg, color: deadline.textColor }}
                      >
                        <AlertCircle size={11} />
                        {isOverdue ? "Deadline terlewat — " : "Deadline: "}
                        {formatDatetime(t.deadline!)}
                        <span className="font-medium opacity-70">({deadline.label})</span>
                      </span>
                    </div>
                  )}

                  {t.deskripsi && (
                    <p className="mt-2.5 text-sm leading-relaxed text-gray-500 dark:text-slate-400">{t.deskripsi}</p>
                  )}

                  {sudahSubmit && submisi && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 dark:bg-green-900/20">
                      <CheckCircle2 size={14} className="shrink-0 text-green-600 dark:text-green-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                          Dikumpulkan {formatDatetime(submisi.submittedAt)}
                        </p>
                        {submisi.fileUrl && (
                          <p className="mt-0.5 truncate text-[10px] text-green-600/80 dark:text-green-500">
                            {filenameFromUrl(submisi.fileUrl)}
                          </p>
                        )}
                      </div>
                      {submisi.fileUrl && (
                        <motion.a
                          href={`${BACKEND_URL}${submisi.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.08 }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-600 hover:text-white dark:bg-green-900/40 dark:text-green-400"
                        >
                          <Download size={12} />
                        </motion.a>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">Dibuat {formatDate(t.createdAt)}</span>

                    <input
                      ref={(el) => { fileInputRefs.current[t.id] = el; }}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(t.id, file);
                        e.target.value = "";
                      }}
                    />

                    {isSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        <CheckCircle2 size={13} />
                        Berhasil dikumpulkan!
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{
                          scale: 1.04,
                          boxShadow: sudahSubmit
                            ? "0 4px 16px rgba(99,52,244,0.25)"
                            : "0 6px 20px rgba(0,51,255,0.35)",
                        }}
                        whileTap={{ scale: 0.96 }}
                        disabled={isUploading}
                        onClick={() => fileInputRefs.current[t.id]?.click()}
                        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          background: sudahSubmit
                            ? "linear-gradient(135deg, #6334F4, #977DFF)"
                            : "linear-gradient(135deg, #0033FF, #6334F4)",
                        }}
                      >
                        {isUploading ? (
                          <><Loader2 size={14} className="animate-spin" />Mengupload…</>
                        ) : sudahSubmit ? (
                          <><RefreshCw size={14} />Ganti File</>
                        ) : (
                          <><Upload size={14} />Kirim Tugas</>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
