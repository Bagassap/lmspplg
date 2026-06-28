"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText, Download, BookOpen,
  AlertCircle, RefreshCw, FileImage, FileVideo, FileCode, FilePieChart,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { ModalMateriItem } from "@/components/jadwal-kelas/MateriPreviewModal";

const MateriPreviewModal = dynamic(
  () => import("@/components/jadwal-kelas/MateriPreviewModal"),
  { ssr: false },
);

type MateriItem = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  fileUrl?: string | null;
  createdAt: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function getFileIcon(fileUrl: string | null | undefined, judul: string) {
  const ext = fileUrl?.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "avi", "mov"].includes(ext)) return { Icon: FileVideo, color: "#FF7867", bg: "#FFF0EE" };
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return { Icon: FileImage, color: "#FFC25B", bg: "#FFF5DC" };
  if (["js", "ts", "py", "html", "css"].includes(ext)) return { Icon: FileCode, color: "#6334F4", bg: "#F0ECFF" };
  const t = judul.toLowerCase();
  if (t.includes("video") || t.includes("animasi")) return { Icon: FileVideo, color: "#FF7867", bg: "#FFF0EE" };
  if (t.includes("gambar") || t.includes("foto")) return { Icon: FileImage, color: "#FFC25B", bg: "#FFF5DC" };
  if (t.includes("code") || t.includes("program") || t.includes("html") || t.includes("javascript")) return { Icon: FileCode, color: "#6334F4", bg: "#F0ECFF" };
  if (t.includes("analisis") || t.includes("data") || t.includes("statistik")) return { Icon: FilePieChart, color: "#10B981", bg: "#E8F8F1" };
  return { Icon: FileText, color: "#FF3644", bg: "#FFE9EA" };
}

export default function SiswaMateriPage() {
  const { id } = useParams<{ id: string }>();

  const [mataPelajaran, setMataPelajaran] = useState("");
  const [materiList, setMateriList] = useState<MateriItem[]>([]);
  const [materiLoading, setMateriLoading] = useState(false);
  const [materiError, setMateriError] = useState<string | null>(null);
  const [previewMateri, setPreviewMateri] = useState<ModalMateriItem | null>(null);

  useEffect(() => {
    fetch(`/api/jadwal-kelas/${id}`)
      .then((r) => r.json())
      .then((d) => setMataPelajaran(d?.mataPelajaran ?? ""))
      .catch(() => {});
  }, [id]);

  async function reloadMateri() {
    setMateriLoading(true);
    setMateriError(null);
    try {
      const res = await fetch(`/api/materi-kelas?jadwalKelasId=${id}`);
      const data = await res.json();
      if (!res.ok) {
        setMateriError(`Gagal memuat materi (${res.status}): ${data?.message ?? "error tidak diketahui"}`);
        setMateriList([]);
      } else {
        setMateriList(Array.isArray(data) ? data : []);
      }
    } catch {
      setMateriError("Tidak dapat terhubung ke server");
    } finally {
      setMateriLoading(false);
    }
  }

  useEffect(() => { reloadMateri(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">Daftar Materi</p>
          <p className="text-xs text-gray-400 dark:text-slate-400">
            {materiList.length > 0 ? `${materiList.length} materi tersedia dari guru` : "Guru belum mengupload materi"}
          </p>
        </div>
      </div>

      {materiLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : materiError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 dark:border-red-900/30 dark:bg-red-900/20">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Gagal memuat materi</p>
            <p className="mt-0.5 text-xs text-red-600/70 dark:text-red-500">{materiError}</p>
          </div>
          <button
            onClick={reloadMateri}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
          >
            <RefreshCw size={11} />Coba lagi
          </button>
        </div>
      ) : materiList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-700">
            <BookOpen size={20} className="text-gray-400 dark:text-slate-400" />
          </div>
          <p className="font-medium text-gray-500 dark:text-slate-400">Belum ada materi</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">Guru belum mengupload materi untuk jadwal ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materiList.map((m, idx) => {
            const { Icon, color, bg } = getFileIcon(m.fileUrl, m.judul);
            const isNew = new Date(m.createdAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.22 }}
                whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
                onClick={() => setPreviewMateri(m)}
                className="group flex cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800"
              >
                <div className="w-1.5 shrink-0" style={{ background: `linear-gradient(180deg, ${color}cc, ${color}55)` }} />
                <div className="flex flex-1 items-start gap-4 px-5 py-4">
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: bg }}>
                      <Icon size={26} style={{ color }} />
                    </div>
                    {isNew && (
                      <span className="absolute -right-1.5 -top-1.5 rounded-full bg-emerald-500 px-1.5 py-px text-[8px] font-bold leading-none text-white shadow-sm">
                        BARU
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">{m.judul}</p>
                    {m.deskripsi && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">{m.deskripsi}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: bg, color }}
                      >
                        <Icon size={9} />
                        {m.fileUrl ? "Ada File · Klik untuk preview" : "Tanpa File"}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                  {m.fileUrl && (
                    <motion.a
                      href={`${BACKEND_URL}${m.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Unduh langsung"
                      onClick={(e) => e.stopPropagation()}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-xl bg-[#0033FF]/10 text-[#0033FF] transition-colors hover:bg-[#0033FF] hover:text-white dark:bg-[#0033FF]/15"
                    >
                      <Download size={13} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <MateriPreviewModal
        materi={previewMateri}
        mataPelajaran={mataPelajaran}
        backendUrl={BACKEND_URL}
        onClose={() => setPreviewMateri(null)}
      />
    </motion.div>
  );
}
