"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, ClipboardList, AlertCircle, CalendarDays,
  Clock, User, MapPin, CheckCircle2, XCircle,
  Loader2, Target, Users, Search, SlidersHorizontal, Download,
  ChevronRight, Info, Pencil, Trash2, FileDown, Trophy,
  FileText, TrendingUp, GraduationCap,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

// ─── Types ────────────────────────────────────────────────────────────────────

type TugasItem = {
  id: string;
  slug?: string | null;
  judul: string;
  deskripsi?: string | null;
  deadline?: string | null;
  createdAt: string;
  _count: { submisi: number };
};

type Submisi = {
  sudahSubmit: { userId: string; nama: string; submittedAt: string; fileUrl?: string | null }[];
  belumSubmit: { userId: string; nama: string }[];
  total: number;
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

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_TUGAS: TugasItem[] = [
  {
    id: "dummy-t1",
    judul: "Latihan HTML Dasar",
    deskripsi: "Buat halaman web sederhana menggunakan HTML5 dengan minimal 5 elemen berbeda. Upload file .html ke portal pembelajaran.",
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    _count: { submisi: 18 },
  },
  {
    id: "dummy-t2",
    judul: "Proyek CSS Portfolio",
    deskripsi: "Tambahkan styling CSS pada halaman HTML sebelumnya menggunakan Flexbox atau CSS Grid.",
    deadline: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    _count: { submisi: 25 },
  },
  {
    id: "dummy-t3",
    judul: "Quiz JavaScript ES6",
    deskripsi: "Kerjakan 20 soal pilihan ganda tentang Arrow Functions, Destructuring, dan Async/Await.",
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    _count: { submisi: 5 },
  },
];

const DUMMY_SUBMISI: Submisi = {
  sudahSubmit: [
    { userId: "u1", nama: "Ahmad Fauzi Ramadhan", submittedAt: new Date(Date.now() - 86400000).toISOString() },
    { userId: "u2", nama: "Budi Santoso",          submittedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { userId: "u3", nama: "Citra Dewi Anggraeni",  submittedAt: new Date(Date.now() - 3600000).toISOString() },
    { userId: "u4", nama: "Diana Putri Lestari",   submittedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { userId: "u5", nama: "Eko Prasetyo",          submittedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  ],
  belumSubmit: [
    { userId: "u6",  nama: "Fajar Nugroho" },
    { userId: "u7",  nama: "Gita Sari Wulandari" },
    { userId: "u8",  nama: "Hendra Wijaya" },
    { userId: "u9",  nama: "Indah Permata Sari" },
    { userId: "u10", nama: "Joko Susilo" },
  ],
  total: 10,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isOverdue(deadline: string | null | undefined) {
  return deadline ? new Date(deadline) < new Date() : false;
}

function timeUntilDeadline(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Deadline sudah lewat";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam lagi`;
  return "< 1 jam lagi";
}

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Baru saja";
  if (mins  < 60) return `${mins} mnt lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days  <  7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getInitials(nama: string) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const GRADIENT_PAIRS: [string, string][] = [
  ["#6334F4", "#0033FF"],
  ["#FF3644", "#FF7867"],
  ["#0033FF", "#977DFF"],
  ["#10B981", "#059669"],
  ["#FF7867", "#FF3644"],
  ["#977DFF", "#6334F4"],
];
function avatarGradient(name: string): [string, string] {
  let h = 0;
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) & 0x7fffffff);
  return GRADIENT_PAIRS[h % GRADIENT_PAIRS.length];
}

function useCountUp(target: number, duration = 900): number {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    let rafId: number;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(Math.round(eased * target));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return display;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TugasDetailPage() {
  const { id, tugasId } = useParams<{ id: string; tugasId: string }>();
  const router = useRouter();
  const toast  = useToast();

  const [jadwal,   setJadwal]   = useState<JadwalDetail | null>(null);
  const [tugas,    setTugas]    = useState<TugasItem    | null>(null);
  const [submisi,  setSubmisi]  = useState<Submisi      | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sortMode, setSortMode] = useState<"name" | "latest">("name");
  const [listTab,  setListTab]  = useState<"all" | "sudah" | "belum">("all");
  const [deleting, setDeleting] = useState(false);

  const isDummy = tugasId.startsWith("dummy-");

  useEffect(() => {
    fetch(`/api/jadwal-kelas/${id}`)
      .then((r) => r.json())
      .then((d) => setJadwal(d))
      .catch(() => {});
  }, [id]);

  const loadData = useCallback(async () => {
    if (isDummy) {
      setTugas(DUMMY_TUGAS.find((t) => t.id === tugasId) ?? null);
      setSubmisi(DUMMY_SUBMISI);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [tugasRes, submisiRes] = await Promise.all([
        fetch(`/api/tugas-kelas?jadwalKelasId=${id}`),
        fetch(`/api/tugas-kelas/${tugasId}/submisi`),
      ]);
      const tugasData: TugasItem[] = await tugasRes.json().catch(() => []);
      const found = Array.isArray(tugasData)
        ? (tugasData.find((t) => t.id === tugasId || t.slug === tugasId) ?? null)
        : null;
      setTugas(found);
      const subData = await submisiRes.json().catch(() => null);
      setSubmisi(subData);
    } finally {
      setLoading(false);
    }
  }, [id, tugasId, isDummy]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDelete() {
    if (!tugas || isDummy) return;
    if (!await toast.confirm(`Hapus tugas "${tugas.judul}"?`, "Semua submisi siswa akan ikut terhapus.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tugas-kelas/${tugas.id}`, { method: "DELETE" });
      if (res.ok) router.back();
    } finally {
      setDeleting(false);
    }
  }

  const over        = isOverdue(tugas?.deadline);
  const submitCount = submisi?.sudahSubmit.length ?? 0;
  const totalCount  = submisi?.total ?? 0;
  const submitPct   = totalCount > 0 ? Math.round((submitCount / totalCount) * 100) : 0;
  const belumCount  = submisi?.belumSubmit.length ?? 0;
  const displayPct  = useCountUp(submitPct);

  const headerGradient = over
    ? "linear-gradient(135deg,#FF3644 0%,#CC2233 100%)"
    : "linear-gradient(135deg,#6334F4 0%,#0033FF 100%)";
  const accentColor = over ? "#FF3644" : "#6334F4";

  const q = search.toLowerCase();
  const sudahFiltered = [...(submisi?.sudahSubmit ?? [])]
    .filter((s) => s.nama.toLowerCase().includes(q))
    .sort(sortMode === "latest"
      ? (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      : (a, b) => a.nama.localeCompare(b.nama, "id"),
    );
  const belumFiltered = [...(submisi?.belumSubmit ?? [])]
    .filter((s) => s.nama.toLowerCase().includes(q))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  // Insight computation
  const insights = useMemo(() => {
    if (!submisi || submisi.sudahSubmit.length === 0 || !tugas) return null;
    const sorted = [...submisi.sudahSubmit].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );
    const avgMs   = sorted.reduce(
      (s, x) => s + (new Date(x.submittedAt).getTime() - new Date(tugas.createdAt).getTime()), 0,
    ) / sorted.length;
    return {
      first:   sorted[0],
      last:    sorted[sorted.length - 1],
      avgDays: Math.max(0, Math.round(avgMs / 86400000)),
    };
  }, [submisi, tugas]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Back row + breadcrumb strip ── */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-[#6334F4] hover:text-[#6334F4] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-[#977DFF] dark:hover:text-[#977DFF]"
        >
          <ArrowLeft size={16} />
        </motion.button>

        {jadwal && (
          <div
            className="relative flex flex-1 flex-wrap items-center gap-3 overflow-hidden rounded-2xl py-2.5 pl-4 pr-5 shadow-md"
            style={{ background: "linear-gradient(135deg,#6334F4,#0033FF)" }}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <BookOpen size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-white">{jadwal.mataPelajaran}</p>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white/90">{jadwal.kelas}</span>
            </div>
            <div className="relative ml-auto flex flex-wrap items-center gap-3 text-[11px] text-white/70">
              <span className="flex items-center gap-1"><CalendarDays size={10} />{jadwal.hari}</span>
              <span className="flex items-center gap-1"><Clock size={10} />{jadwal.jamMulai}–{jadwal.jamSelesai}</span>
              <span className="flex items-center gap-1"><User size={10} />{jadwal.guru.user.nama}</span>
              {jadwal.ruangan && <span className="flex items-center gap-1"><MapPin size={10} />{jadwal.ruangan}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-80 animate-pulse rounded-3xl bg-gray-100 dark:bg-slate-700" />
          <div className="h-10 animate-pulse rounded-xl  bg-gray-100 dark:bg-slate-700" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700" />
        </div>
      ) : !tugas ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 py-24 text-center dark:border-slate-700">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-700">
            <ClipboardList size={26} className="text-gray-300 dark:text-slate-500" />
          </div>
          <p className="font-bold text-gray-600 dark:text-slate-300">Tugas tidak ditemukan</p>
          <button onClick={() => router.back()}
            className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
            Kembali
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="space-y-4">

          {/* ══ UNIFIED HEADER + BODY CARD ══════════════════════════════════════ */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md dark:border-slate-700/60 dark:bg-slate-800">

            {/* ── Gradient header ── */}
            <div className="relative overflow-hidden px-6 pb-6 pt-5" style={{ background: headerGradient }}>
              {/* Multi-layer decorative icons */}
              <ClipboardList size={130} strokeWidth={1.2}
                className="pointer-events-none absolute -right-8 -top-6 text-white/[0.07]" />
              <FileText size={48} strokeWidth={1.5}
                className="pointer-events-none absolute bottom-6 right-32 text-white/9" />
              <Target size={36} strokeWidth={1.5}
                className="pointer-events-none absolute left-2 top-2 text-white/8" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/4 blur-2xl" />

              {/* Breadcrumb */}
              <div className="relative mb-3 flex items-center gap-1 text-[10px] font-medium text-white/50">
                <span>{jadwal?.mataPelajaran ?? "Jadwal"}</span>
                <ChevronRight size={9} />
                <span>Tugas</span>
                <ChevronRight size={9} />
                <span className="line-clamp-1 text-white/80">{tugas.judul}</span>
              </div>

              {/* Title row */}
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/20">
                  <Target size={22} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  {/* Badges */}
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                      <ClipboardList size={8} />Tugas Kelas
                    </span>
                    {isDummy && (
                      <span className="inline-flex rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white/90">Contoh</span>
                    )}
                    {over && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        <AlertCircle size={8} />Lewat Deadline
                      </span>
                    )}
                  </div>
                  <h1 className="text-lg font-extrabold leading-snug text-white drop-shadow-sm">{tugas.judul}</h1>

                  {/* Meta row — creation date + inline submission stats */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-white/60">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={10} />
                      Dibuat {formatDate(tugas.createdAt)}
                    </span>
                    {submisi && (
                      <>
                        <span className="text-white/25">·</span>
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {totalCount} siswa
                        </span>
                        <span className="text-white/25">·</span>
                        <span className="flex items-center gap-1 text-emerald-300/90">
                          <CheckCircle2 size={10} />
                          {submitCount} sudah
                        </span>
                        <span className="text-white/25">·</span>
                        <span className="flex items-center gap-1 text-white/45">
                          <Clock size={10} />
                          {belumCount} belum
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Deadline box */}
              {tugas.deadline && (
                <div className="relative mt-5 overflow-hidden rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm ring-1 ring-white/15">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Clock size={13} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Deadline</span>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-extrabold text-white">
                      {timeUntilDeadline(tugas.deadline)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-white">{formatDeadline(tugas.deadline)}</p>
                </div>
              )}
            </div>

            {/* ── White body ── */}
            <div className="px-6 pb-6 pt-5">

              {/* Deskripsi tinted box */}
              {tugas.deskripsi && (
                <div className="mb-4 rounded-xl bg-[#F5F3FF] px-4 py-3 dark:bg-[#6334F4]/10">
                  <div className="mb-2 flex items-center gap-2">
                    <Info size={12} className="text-[#6334F4] dark:text-[#977DFF]" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6334F4] dark:text-[#977DFF]">
                      Instruksi Pengerjaan
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-300">{tugas.deskripsi}</p>
                </div>
              )}

              {/* Criteria section */}
              <div className="mb-4 rounded-xl border border-[#6334F4]/10 bg-white px-4 py-3 dark:border-[#977DFF]/10 dark:bg-slate-700/30">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Kriteria Penilaian
                </p>
                <div className="space-y-1.5">
                  {[
                    "Pengerjaan sesuai instruksi yang diberikan",
                    "File dikumpulkan sebelum batas deadline",
                    "Karya merupakan hasil kerja sendiri",
                  ].map((c) => (
                    <div key={c} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-[#6334F4] dark:text-[#977DFF]" />
                      <p className="text-xs text-gray-600 dark:text-slate-400">{c}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons row */}
              {!isDummy && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <button
                    disabled
                    className="flex items-center gap-1.5 rounded-xl border border-[#6334F4]/20 bg-[#6334F4]/5 px-3 py-1.5 text-[11px] font-bold text-[#6334F4] opacity-60 dark:border-[#977DFF]/20 dark:bg-[#977DFF]/10 dark:text-[#977DFF]"
                  >
                    <Pencil size={11} />Edit Tugas
                  </button>
                  <motion.button
                    onClick={handleDelete} disabled={deleting}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Hapus Tugas
                  </motion.button>
                  <button
                    disabled
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-500 opacity-60 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
                  >
                    <FileDown size={11} />Export CSV
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="mb-5 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent dark:via-slate-700" />

              {/* Progress section */}
              <div className="mb-1 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    Progress Pengumpulan
                  </p>
                  <p className="mt-0.5 text-3xl font-black leading-none" style={{ color: submitPct === 100 ? "#10B981" : accentColor }}>
                    {displayPct}<span className="ml-0.5 text-base font-bold opacity-70">%</span>
                  </p>
                </div>
                {submitPct === 100 && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 size={10} />Semua Kumpul
                  </span>
                )}
              </div>
              <div className="relative mt-2.5 h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${submitPct}%` }}
                  transition={{ duration: 1.0, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: submitPct === 100
                      ? "linear-gradient(90deg,#10B981,#059669)"
                      : "linear-gradient(90deg,#977DFF,#6334F4,#0033FF)",
                    boxShadow: submitPct > 0 ? (submitPct === 100 ? "0 0 12px #10B98155" : "0 0 12px #6334F455") : "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ══ SUBMISI SECTION ════════════════════════════════════════════════ */}
          {submisi ? (
            <>
              {/* Tab switcher + search + controls */}
              <div className="space-y-2">
                {/* Tabs */}
                <div className="flex items-center gap-1.5">
                  {(["all", "sudah", "belum"] as const).map((tab) => {
                    const labels: Record<string, string> = {
                      all:   `Semua (${totalCount})`,
                      sudah: `Sudah (${submisi.sudahSubmit.length})`,
                      belum: `Belum (${submisi.belumSubmit.length})`,
                    };
                    const active = listTab === tab;
                    return (
                      <motion.button
                        key={tab}
                        onClick={() => setListTab(tab)}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all ${
                          active
                            ? "bg-[#6334F4] text-white shadow-sm dark:bg-[#977DFF] dark:text-white"
                            : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        } border ${active ? "border-[#6334F4]/0 dark:border-[#977DFF]/0" : "border-gray-200 dark:border-slate-700"}`}
                      >
                        {labels[tab]}
                      </motion.button>
                    );
                  })}
                  <div className="flex-1" />
                  <motion.button
                    onClick={() => setSortMode((m) => (m === "name" ? "latest" : "name"))}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 shadow-sm hover:border-[#6334F4] hover:text-[#6334F4] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-[#977DFF] dark:hover:text-[#977DFF]"
                  >
                    <SlidersHorizontal size={11} />
                    {sortMode === "name" ? "A–Z" : "Terbaru"}
                  </motion.button>
                  <motion.button
                    disabled title="Segera hadir"
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#6334F4]/20 bg-[#6334F4]/5 px-3 py-2 text-[11px] font-bold text-[#6334F4] opacity-50 dark:border-[#977DFF]/20 dark:bg-[#977DFF]/10 dark:text-[#977DFF]"
                  >
                    <Download size={11} />Unduh
                  </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama siswa…"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#6334F4] focus:outline-none focus:ring-2 focus:ring-[#6334F4]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-600 dark:focus:border-[#977DFF] dark:focus:ring-[#977DFF]/15"
                  />
                </div>
              </div>

              {/* Lists — layout depends on tab */}
              <div className={listTab === "all" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>

                {/* ── Sudah Kumpul ── */}
                <AnimatePresence>
                  {(listTab === "all" || listTab === "sudah") && (
                    <motion.div
                      key="sudah"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-700/60">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/40">
                          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="font-extrabold text-emerald-800 dark:text-emerald-400">Sudah Kumpul</p>
                        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                          {sudahFiltered.length}{search ? `/${submisi.sudahSubmit.length}` : ""}
                        </span>
                      </div>

                      <div className="divide-y divide-gray-50 p-2.5 dark:divide-slate-700/40">
                        {sudahFiltered.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-700">
                              <GraduationCap size={22} className="text-gray-400 dark:text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500 dark:text-slate-400">
                                {search ? "Siswa tidak ditemukan" : "Belum ada yang mengumpulkan"}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                                {search ? `Tidak ada hasil untuk "${search}"` : "Deadline masih menunggu submisi pertama"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          sudahFiltered.map((s, idx) => {
                            const [c1, c2] = avatarGradient(s.nama);
                            return (
                              <motion.div
                                key={s.userId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.035, duration: 0.2 }}
                                whileHover={{ y: -1, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
                                className="flex cursor-default items-center gap-3 rounded-xl p-2 transition-shadow"
                              >
                                {/* Nomor urut */}
                                <span className="w-5 shrink-0 text-center text-[10px] font-bold text-gray-300 dark:text-slate-600">
                                  {idx + 1}
                                </span>
                                {/* Avatar gradient */}
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-slate-800"
                                  style={{ background: `linear-gradient(135deg,${c1},${c2})` }}
                                >
                                  {getInitials(s.nama)}
                                </div>
                                {/* Name + time */}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold text-gray-800 dark:text-slate-200">{s.nama}</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                      {timeAgo(s.submittedAt)}
                                    </span>
                                    <span className="text-[10px] text-gray-300 dark:text-slate-600">·</span>
                                    <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                      {new Date(s.submittedAt).toLocaleDateString("id-ID", {
                                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                {/* File badge or check */}
                                {s.fileUrl ? (
                                  <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[#6334F4]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#6334F4] dark:bg-[#977DFF]/15 dark:text-[#977DFF]">
                                    <FileText size={9} />File
                                  </span>
                                ) : (
                                  <CheckCircle2 size={14} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
                                )}
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Belum Kumpul ── */}
                <AnimatePresence>
                  {(listTab === "all" || listTab === "belum") && (
                    <motion.div
                      key="belum"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-700/60">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30">
                          <XCircle size={14} className="text-orange-500 dark:text-orange-400" />
                        </div>
                        <p className="font-extrabold text-orange-700 dark:text-orange-400">Belum Kumpul</p>
                        <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-orange-500 dark:bg-orange-900/30 dark:text-orange-400">
                          {belumFiltered.length}{search ? `/${submisi.belumSubmit.length}` : ""}
                        </span>
                      </div>

                      <div className="divide-y divide-gray-50 p-2.5 dark:divide-slate-700/40">
                        {belumFiltered.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                              <CheckCircle2 size={22} className="text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                {search ? "Tidak ada hasil" : "Semua sudah mengumpulkan! 🎉"}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                                {search ? `Tidak ada hasil untuk "${search}"` : "Pencapaian luar biasa dari kelas ini"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          belumFiltered.map((s, idx) => {
                            const [c1, c2] = avatarGradient(s.nama);
                            return (
                              <motion.div
                                key={s.userId}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.035, duration: 0.2 }}
                                whileHover={{ y: -1, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
                                className="flex cursor-default items-center gap-3 rounded-xl p-2 transition-shadow"
                              >
                                <span className="w-5 shrink-0 text-center text-[10px] font-bold text-gray-300 dark:text-slate-600">
                                  {idx + 1}
                                </span>
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white/60 shadow-sm ring-2 ring-white dark:ring-slate-800"
                                  style={{ background: `linear-gradient(135deg,${c1}55,${c2}55)` }}
                                >
                                  {getInitials(s.nama)}
                                </div>
                                <p className="flex-1 truncate text-xs text-gray-500 dark:text-slate-400">{s.nama}</p>
                                <motion.span
                                  animate={{ opacity: [1, 0.45, 1] }}
                                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                  className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400"
                                >
                                  Menunggu
                                </motion.span>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-10 dark:border-slate-700/60 dark:bg-slate-800">
              <Loader2 size={22} className="animate-spin" style={{ color: accentColor }} />
            </div>
          )}

          {/* ══ INSIGHT CARD ══════════════════════════════════════════════════ */}
          {insights && (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-700/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F5F3FF] dark:bg-[#977DFF]/20">
                  <TrendingUp size={14} className="text-[#6334F4] dark:text-[#977DFF]" />
                </div>
                <p className="font-extrabold text-gray-700 dark:text-slate-200">Statistik Submisi</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-50 dark:divide-slate-700/40">
                {/* Rata-rata */}
                <div className="px-4 py-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F3FF] dark:bg-[#977DFF]/20">
                    <Clock size={14} className="text-[#6334F4] dark:text-[#977DFF]" />
                  </div>
                  <p className="text-lg font-black text-[#6334F4] dark:text-[#977DFF]">
                    {insights.avgDays}h
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-gray-400 dark:text-slate-500">Rata-rata</p>
                  <p className="text-[9px] text-gray-400 dark:text-slate-500">setelah dibuat</p>
                </div>
                {/* Tercepat */}
                <div className="px-4 py-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Trophy size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="truncate text-xs font-black text-emerald-600 dark:text-emerald-400" title={insights.first.nama}>
                    {insights.first.nama.split(" ")[0]}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-gray-400 dark:text-slate-500">Tercepat</p>
                  <p className="text-[9px] text-gray-400 dark:text-slate-500">{timeAgo(insights.first.submittedAt)}</p>
                </div>
                {/* Terlambat */}
                <div className="px-4 py-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30">
                    <AlertCircle size={14} className="text-orange-500 dark:text-orange-400" />
                  </div>
                  <p className="truncate text-xs font-black text-orange-500 dark:text-orange-400" title={insights.last.nama}>
                    {insights.last.nama.split(" ")[0]}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-gray-400 dark:text-slate-500">Terlambat</p>
                  <p className="text-[9px] text-gray-400 dark:text-slate-500">{timeAgo(insights.last.submittedAt)}</p>
                </div>
              </div>
            </div>
          )}

          {isDummy && (
            <div className="rounded-2xl border border-[#6334F4]/15 bg-[#F5F3FF]/70 px-5 py-4 dark:border-[#977DFF]/20 dark:bg-[#6334F4]/10">
              <p className="mb-1 text-xs font-bold text-[#6334F4] dark:text-[#977DFF]">Catatan</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Ini adalah tugas contoh. Data siswa dan submisi asli akan muncul setelah tugas nyata dibuat.
              </p>
            </div>
          )}

        </motion.div>
      )}
    </div>
  );
}
