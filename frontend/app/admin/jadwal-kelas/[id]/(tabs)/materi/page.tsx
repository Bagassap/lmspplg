"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Trash2, Download, Upload, Loader2,
  Sparkles, FileImage, FileVideo, FileCode, FilePieChart,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
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

const DUMMY_MATERI: MateriItem[] = [
  { id: "dummy-1", judul: "Pengantar Pemrograman Web", deskripsi: "Materi dasar HTML5, CSS3, dan JavaScript untuk membangun halaman web modern yang responsif", fileUrl: "#", createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "dummy-2", judul: "CSS Flexbox & Grid Layout", deskripsi: "Teknik tata letak responsif menggunakan Flexbox dan CSS Grid untuk berbagai ukuran layar", fileUrl: "#", createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "dummy-3", judul: "JavaScript DOM Manipulation", deskripsi: "Cara mengakses dan memanipulasi elemen HTML secara dinamis menggunakan JavaScript vanilla", fileUrl: null, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "dummy-4", judul: "Responsive Web Design & Media Queries", deskripsi: "Prinsip desain responsif menggunakan media queries dan teknik mobile-first development", fileUrl: "#", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];

const INPUT = "w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:border-[#6334F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6334F4]/15";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function getFileIcon(fileUrl: string | null | undefined, judul: string) {
  if (!fileUrl || fileUrl === "#") {
    const t = judul.toLowerCase();
    if (t.includes("video") || t.includes("animasi")) return { Icon: FileVideo, color: "#FF7867", bg: "#FFF0EE" };
    if (t.includes("gambar") || t.includes("foto") || t.includes("desain")) return { Icon: FileImage, color: "#FFC25B", bg: "#FFF5DC" };
    if (t.includes("code") || t.includes("program") || t.includes("javascript") || t.includes("html")) return { Icon: FileCode, color: "#6334F4", bg: "#F0ECFF" };
    if (t.includes("analisis") || t.includes("statistik") || t.includes("data")) return { Icon: FilePieChart, color: "#10B981", bg: "#E8F8F1" };
    return { Icon: FileText, color: "#FF3644", bg: "#FFE9EA" };
  }
  const ext = fileUrl.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "avi", "mov"].includes(ext)) return { Icon: FileVideo, color: "#FF7867", bg: "#FFF0EE" };
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return { Icon: FileImage, color: "#FFC25B", bg: "#FFF5DC" };
  if (["js", "ts", "py", "html", "css"].includes(ext)) return { Icon: FileCode, color: "#6334F4", bg: "#F0ECFF" };
  return { Icon: FileText, color: "#FF3644", bg: "#FFE9EA" };
}

export default function AdminMateriPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const [mataPelajaran, setMataPelajaran] = useState("");
  const [materiList, setMateriList] = useState<MateriItem[]>([]);
  const [materiLoading, setMateriLoading] = useState(false);
  const [previewMateri, setPreviewMateri] = useState<ModalMateriItem | null>(null);
  const [showMateriForm, setShowMateriForm] = useState(false);
  const [materiForm, setMateriForm] = useState({ judul: "", deskripsi: "" });
  const [materiFile, setMateriFile] = useState<File | null>(null);
  const [materiSaving, setMateriSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/jadwal-kelas/${id}`)
      .then((r) => r.json())
      .then((d) => setMataPelajaran(d?.mataPelajaran ?? ""))
      .catch(() => {});
  }, [id]);

  async function reloadMateri() {
    setMateriLoading(true);
    try {
      const res = await fetch(`/api/materi-kelas?jadwalKelasId=${id}`);
      const data = await res.json();
      setMateriList(Array.isArray(data) ? data : []);
    } finally {
      setMateriLoading(false);
    }
  }

  useEffect(() => { reloadMateri(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveMateri(e: React.FormEvent) {
    e.preventDefault();
    setMateriSaving(true);
    try {
      const fd = new FormData();
      fd.append("jadwalKelasId", id);
      fd.append("judul", materiForm.judul);
      if (materiForm.deskripsi) fd.append("deskripsi", materiForm.deskripsi);
      if (materiFile) fd.append("file", materiFile);
      const res = await fetch("/api/materi-kelas", { method: "POST", body: fd });
      if (res.ok) {
        setShowMateriForm(false);
        setMateriForm({ judul: "", deskripsi: "" });
        setMateriFile(null);
        await reloadMateri();
      }
    } finally {
      setMateriSaving(false);
    }
  }

  async function handleDeleteMateri(materiId: string) {
    if (!await toast.confirm("Hapus materi ini?", "File materi yang dihapus tidak dapat dikembalikan.")) return;
    await fetch(`/api/materi-kelas/${materiId}`, { method: "DELETE" });
    await reloadMateri();
  }

  const displayMateri = materiList.length > 0 ? materiList : DUMMY_MATERI;
  const isDummy = materiList.length === 0 && !materiLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">Daftar Materi</p>
          <p className="text-xs text-gray-400 dark:text-slate-400">
            {displayMateri.length} materi tersedia
            {isDummy && (
              <span className="ml-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                Contoh
              </span>
            )}
          </p>
        </div>
        <motion.button
          onClick={() => setShowMateriForm((v) => !v)}
          whileHover={{ scale: 1.03, boxShadow: "0 6px 20px #6334F445" }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md"
          style={{ backgroundColor: "#6334F4" }}
        >
          <Plus size={14} />
          Tambah Materi
        </motion.button>
      </div>

      {/* Inline add form */}
      <AnimatePresence>
        {showMateriForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveMateri}
            className="overflow-hidden rounded-2xl border border-[#6334F4]/20 bg-[#6334F4]/5 p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6334F4]">
                <Sparkles size={13} className="text-white" />
              </div>
              <p className="text-sm font-extrabold text-[#6334F4]">Tambah Materi Baru</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">
                  Judul <span className="text-[#FF3644]">*</span>
                </label>
                <input
                  type="text" required
                  value={materiForm.judul}
                  onChange={(e) => setMateriForm((p) => ({ ...p, judul: e.target.value }))}
                  placeholder="Nama materi / topik pembelajaran"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">Deskripsi</label>
                <textarea
                  rows={2}
                  value={materiForm.deskripsi}
                  onChange={(e) => setMateriForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  placeholder="Keterangan singkat isi materi (opsional)"
                  className={INPUT + " resize-none"}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">
                  File <span className="font-normal text-gray-400">(PDF, DOC, PPT — opsional)</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#6334F4]/25 bg-white px-4 py-3 transition-colors hover:border-[#6334F4]/50 hover:bg-[#6334F4]/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6334F4]/10">
                    <Upload size={15} className="text-[#6334F4]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      {materiFile
                        ? <span className="text-[#6334F4]">{materiFile.name}</span>
                        : "Klik untuk pilih file"
                      }
                    </p>
                    {!materiFile && <p className="text-[10px] text-gray-400">PDF, DOC, DOCX, PPT, PPTX</p>}
                  </div>
                  <input
                    ref={fileInputRef} type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => setMateriFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowMateriForm(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={materiSaving}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-60"
                  style={{ backgroundColor: "#6334F4" }}
                >
                  {materiSaving && <Loader2 size={13} className="animate-spin" />}
                  {materiSaving ? "Menyimpan…" : "Simpan Materi"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Materi list */}
      {materiLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayMateri.map((m, idx) => {
            const { Icon, color, bg } = getFileIcon(m.fileUrl, m.judul);
            const isDummyItem = m.id.startsWith("dummy-");
            const isNew = !isDummyItem && new Date(m.createdAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000;
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">{m.judul}</p>
                      {isDummyItem && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          Contoh
                        </span>
                      )}
                    </div>
                    {m.deskripsi && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">{m.deskripsi}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: bg, color }}
                      >
                        <Icon size={9} />
                        {m.fileUrl && m.fileUrl !== "#" ? "Ada File · Klik untuk preview" : "Tanpa File"}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {m.fileUrl && m.fileUrl !== "#" && (
                      <motion.a
                        href={`${backendUrl}${m.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Unduh langsung"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0033FF]/10 text-[#0033FF] transition-colors hover:bg-[#0033FF] hover:text-white dark:bg-[#0033FF]/15"
                      >
                        <Download size={13} />
                      </motion.a>
                    )}
                    {!isDummyItem && (
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMateri(m.id); }}
                        title="Hapus materi"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF3644]/10 text-[#FF3644] transition-colors hover:bg-[#FF3644] hover:text-white dark:bg-[#FF3644]/15"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <MateriPreviewModal
        materi={previewMateri}
        mataPelajaran={mataPelajaran}
        backendUrl={backendUrl}
        onClose={() => setPreviewMateri(null)}
      />
    </motion.div>
  );
}
