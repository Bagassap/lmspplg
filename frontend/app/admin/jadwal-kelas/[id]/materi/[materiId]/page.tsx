"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, Download, Trash2, FileText, FileVideo,
  FileImage, FileCode, FilePieChart, CalendarDays, Clock,
  User, MapPin, FileCheck, Sparkles,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

// ─── Types ────────────────────────────────────────────────────────────────────

type MateriItem = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  fileUrl?: string | null;
  createdAt: string;
};

type JadwalDetail = {
  id: string;
  mataPelajaran: string;
  kelas: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruangan?: string | null;
  guru: { id: string; user: { id: string; nama: string } };
};

// ─── Dummy data (mirrors the list page) ──────────────────────────────────────

const DUMMY_MATERI: MateriItem[] = [
  {
    id: "dummy-1",
    judul: "Pengantar Pemrograman Web",
    deskripsi: "Materi dasar HTML5, CSS3, dan JavaScript untuk membangun halaman web modern yang responsif. Mencakup struktur dokumen HTML, semantic elements, dan pengenalan CSS box model.",
    fileUrl: "#",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "dummy-2",
    judul: "CSS Flexbox & Grid Layout",
    deskripsi: "Teknik tata letak responsif menggunakan Flexbox dan CSS Grid untuk berbagai ukuran layar. Termasuk latihan membuat layout halaman web yang adaptif.",
    fileUrl: "#",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "dummy-3",
    judul: "JavaScript DOM Manipulation",
    deskripsi: "Cara mengakses dan memanipulasi elemen HTML secara dinamis menggunakan JavaScript vanilla. Mencakup event listeners, querySelector, dan manipulasi class/style.",
    fileUrl: null,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "dummy-4",
    judul: "Responsive Web Design & Media Queries",
    deskripsi: "Prinsip desain responsif menggunakan media queries dan teknik mobile-first development. Praktik langsung membuat halaman web yang tampil baik di semua perangkat.",
    fileUrl: "#",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function getFileIcon(fileUrl: string | null | undefined, judul: string) {
  const t = judul.toLowerCase();
  if (!fileUrl || fileUrl === "#") {
    if (t.includes("video") || t.includes("animasi")) return { Icon: FileVideo, color: "#FF7867", bg: "#FFF0EE" };
    if (t.includes("gambar") || t.includes("foto") || t.includes("desain")) return { Icon: FileImage, color: "#FFC25B", bg: "#FFF5DC" };
    if (t.includes("code") || t.includes("program") || t.includes("javascript") || t.includes("html") || t.includes("css")) return { Icon: FileCode, color: "#6334F4", bg: "#F0ECFF" };
    if (t.includes("analisis") || t.includes("statistik") || t.includes("data")) return { Icon: FilePieChart, color: "#10B981", bg: "#E8F8F1" };
    return { Icon: FileText, color: "#FF3644", bg: "#FFE9EA" };
  }
  const ext = fileUrl.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "avi", "mov"].includes(ext)) return { Icon: FileVideo, color: "#FF7867", bg: "#FFF0EE" };
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return { Icon: FileImage, color: "#FFC25B", bg: "#FFF5DC" };
  if (["js", "ts", "py", "html", "css"].includes(ext)) return { Icon: FileCode, color: "#6334F4", bg: "#F0ECFF" };
  return { Icon: FileText, color: "#FF3644", bg: "#FFE9EA" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MateriDetailPage() {
  const { id, materiId } = useParams<{ id: string; materiId: string }>();
  const router = useRouter();
  const toast = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const [jadwal, setJadwal] = useState<JadwalDetail | null>(null);
  const [materi, setMateri] = useState<MateriItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const isDummy = materiId.startsWith("dummy-");

  useEffect(() => {
    // Fetch jadwal info (header)
    fetch(`/api/jadwal-kelas/${id}`)
      .then((r) => r.json())
      .then((d) => setJadwal(d))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (isDummy) {
      setMateri(DUMMY_MATERI.find((m) => m.id === materiId) ?? null);
      setLoading(false);
      return;
    }
    // Fetch all materi for this jadwal, then find this one
    fetch(`/api/materi-kelas?jadwalKelasId=${id}`)
      .then((r) => r.json())
      .then((data: MateriItem[]) => {
        const found = Array.isArray(data) ? data.find((m) => m.id === materiId) : null;
        setMateri(found ?? null);
      })
      .catch(() => setMateri(null))
      .finally(() => setLoading(false));
  }, [id, materiId, isDummy]);

  async function handleDelete() {
    if (!await toast.confirm("Hapus materi ini?", "File materi yang dihapus tidak dapat dikembalikan.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/materi-kelas/${materiId}`, { method: "DELETE" });
      router.push(`/admin/jadwal-kelas/${id}?tab=materi`);
    } finally {
      setDeleting(false);
    }
  }

  const { Icon, color, bg } = materi
    ? getFileIcon(materi.fileUrl, materi.judul)
    : { Icon: FileText, color: "#FF3644", bg: "#FFE9EA" };

  return (
    <div className="space-y-5">

      {/* ── Back row ── */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-[#6334F4] hover:text-[#6334F4]"
        >
          <ArrowLeft size={16} />
        </motion.button>

        {/* Jadwal context strip */}
        {jadwal && (
          <div
            className="relative flex flex-1 flex-wrap items-center gap-3 overflow-hidden rounded-2xl py-2.5 pl-4 pr-5 shadow-md"
            style={{ backgroundColor: "#6334F4" }}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <BookOpen size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-white">{jadwal.mataPelajaran}</p>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white/90">
                {jadwal.kelas}
              </span>
            </div>
            <div className="relative ml-auto flex flex-wrap items-center gap-3 text-[11px] text-white/70">
              <span className="flex items-center gap-1">
                <CalendarDays size={10} />
                {jadwal.hari}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {jadwal.jamMulai}–{jadwal.jamSelesai}
              </span>
              <span className="flex items-center gap-1">
                <User size={10} />
                {jadwal.guru.user.nama}
              </span>
              {jadwal.ruangan && (
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {jadwal.ruangan}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      ) : !materi ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <FileText size={26} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-600">Materi tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Kembali
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="space-y-4"
        >
          {/* ── Hero card ── */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            {/* Colored top section */}
            <div
              className="relative flex items-center gap-5 overflow-hidden px-6 py-7"
              style={{ backgroundColor: bg }}
            >
              {/* Decorative orbs */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ backgroundColor: `${color}20` }} />
              <div className="pointer-events-none absolute -bottom-4 right-16 h-16 w-16 rounded-full" style={{ backgroundColor: `${color}15` }} />

              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl shadow-lg"
                style={{ backgroundColor: color }}
              >
                <Icon size={36} className="text-white" />
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <FileCheck size={9} />
                    Materi Pembelajaran
                  </span>
                  {isDummy && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                      <Sparkles size={9} />
                      Contoh
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-extrabold leading-tight text-gray-900">{materi.judul}</h1>
                <p className="mt-1 text-xs text-gray-500">
                  Diunggah {formatDate(materi.createdAt)}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-gray-50 px-6 py-5">
              {materi.deskripsi ? (
                <div className="pb-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Deskripsi</p>
                  <p className="text-sm leading-relaxed text-gray-700">{materi.deskripsi}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-5">
                {/* File status */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Status File</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {materi.fileUrl && materi.fileUrl !== "#" ? "File Tersedia" : "Tanpa File"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {materi.fileUrl && materi.fileUrl !== "#" && (
                    <motion.a
                      href={`${backendUrl}${materi.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.04, boxShadow: "0 6px 20px #0033FF30" }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md"
                      style={{ backgroundColor: "#0033FF" }}
                    >
                      <Download size={14} />
                      Download File
                    </motion.a>
                  )}
                  {!isDummy && (
                    <motion.button
                      onClick={handleDelete}
                      disabled={deleting}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-bold text-[#FF3644] transition-colors hover:bg-[#FF3644] hover:text-white disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      {deleting ? "Menghapus…" : "Hapus"}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Other materi in this jadwal ── */}
          {isDummy && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 px-5 py-4">
              <p className="mb-1 text-xs font-bold text-gray-500">Catatan</p>
              <p className="text-sm text-gray-600">
                Ini adalah materi contoh. Data asli akan ditampilkan setelah guru mengunggah materi ke jadwal ini.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
