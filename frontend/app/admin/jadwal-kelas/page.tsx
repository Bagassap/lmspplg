"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Clock, Pencil, LogIn, ClipboardCheck,
  MessageCircle, BookOpen, ChevronDown,
  Calendar, Users, GraduationCap, CalendarDays,
  School, MapPin, RefreshCw, X,
  AlertCircle, RotateCcw, ChevronRight,
} from "lucide-react";
import { JadwalModal, type GuruItem } from "@/components/jadwal-kelas/JadwalModal";
import { PresensiModal } from "@/components/jadwal-kelas/PresensiModal";
import { accentFor, SubjectIcon, getInitials } from "@/lib/jadwalColors";
import { LiveClock } from "@/components/shared/LiveClock";
import { useToast } from "@/components/shared/ToastSystem";

export type JadwalItem = {
  id: string;
  slug?: string | null;
  hari: string;
  kelas: string;
  mataPelajaran: string;
  jamMulai: string;
  jamSelesai: string;
  ruangan?: string | null;
  guru: { id: string; noWa?: string | null; user: { id: string; nama: string } };
};

const DAYS_FILTER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DAY_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_ORDER: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };

const COL_TEMPLATE = "minmax(0,2fr) minmax(0,0.7fr) minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,1.7fr)";
const CELL_SEP = "border-r border-slate-100 dark:border-slate-700/50";

type ModalState = { mode: "add" | "edit"; item?: JadwalItem };
type PresensiState = { jadwalKelasId: string; kelas: string };

// ─── Gradient Stat Card ────────────────────────────────────────────────────────

function CreditStatCard({
  icon: Icon, label, value, suffix, sub, gradient, loading, delay = 0,
}: {
  icon: React.ElementType; label: string; value: number | string;
  suffix: string; sub: string; gradient: string; loading?: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl p-5"
      style={{ background: gradient }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-4 right-12 h-20 w-20 rounded-full bg-white/8" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Akses Cepat</p>
          <p className="mt-0.5 text-sm font-bold text-white">{label}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Icon size={17} className="text-white" />
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded-xl bg-white/20" />
        ) : (
          <p className="text-3xl font-bold text-white">
            {value}<span className="ml-1 text-base font-semibold text-white/60">{suffix}</span>
          </p>
        )}
      </div>

      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/50">TA</p>
          <p className="text-[11px] font-semibold text-white/80">2024/2025</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-medium uppercase tracking-wider text-white/50">Info</p>
          <p className="text-[11px] font-semibold text-white/80">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-1.5 shrink-0 animate-pulse rounded-l-2xl bg-slate-200 dark:bg-slate-700" />
      <div className="hidden flex-1 items-center xl:grid" style={{ gridTemplateColumns: COL_TEMPLATE }}>
        <div className={`flex items-center gap-3 self-stretch px-4 py-4 ${CELL_SEP}`}>
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          </div>
        </div>
        {[1, 2, 3].map((k) => (
          <div key={k} className={`flex items-center self-stretch px-4 ${CELL_SEP}`}>
            <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          </div>
        ))}
        <div className="flex items-center gap-1.5 self-stretch px-3">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-9 w-9 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          ))}
        </div>
      </div>
      {/* Mobile skeleton */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-3.5 xl:hidden">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          <div className="h-6 w-32 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-8 flex-1 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Action button ─────────────────────────────────────────────────────────────

function ActionBtn({
  onClick,
  href,
  title,
  label,
  icon: Icon,
  color,
  colorBg,
}: {
  onClick?: () => void;
  href?: string;
  title: string;
  label: string;
  icon: React.ElementType;
  color: string;
  colorBg: string;
}) {
  const cls = `flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all hover:brightness-95 active:scale-95`;
  const style = { backgroundColor: colorBg, color };
  if (href) {
    return (
      <motion.a href={href} target="_blank" rel="noopener noreferrer" title={title}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }}
        className={cls} style={style}>
        <Icon size={14} />
        <span className="truncate">{label}</span>
      </motion.a>
    );
  }
  return (
    <motion.button onClick={onClick} title={title}
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }}
      className={cls} style={style}>
      <Icon size={14} />
      <span className="truncate">{label}</span>
    </motion.button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminJadwalKelasPage() {
  const router = useRouter();
  const toast  = useToast();
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [gurus, setGurus] = useState<GuruItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHari, setFilterHari] = useState(() => {
    const d = DAY_ID[new Date().getDay()];
    return DAYS_FILTER.includes(d) ? d : "Senin";
  });
  const [filterKelas, setFilterKelas] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [presensi, setPresensi] = useState<PresensiState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const today        = DAY_ID[new Date().getDay()];
  const todayDefault = DAYS_FILTER.includes(today) ? today : "Senin";
  const allKelas = [...new Set(jadwal.map((j) => j.kelas))].sort();
  const totalGuru = new Set(jadwal.map((j) => j.guru.id)).size;
  const jadwalHariIni = jadwal.filter((j) => j.hari === today).length;
  const hasActiveFilter = !!(search || filterKelas || filterHari !== todayDefault);

  const filtered = jadwal
    .filter((j) => {
      if (filterHari && j.hari !== filterHari) return false;
      if (filterKelas && j.kelas !== filterKelas) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !j.mataPelajaran.toLowerCase().includes(q) &&
          !j.kelas.toLowerCase().includes(q) &&
          !j.guru.user.nama.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.hari] ?? 9) - (DAY_ORDER[b.hari] ?? 9);
      if (dayDiff !== 0) return dayDiff;
      return a.jamMulai.localeCompare(b.jamMulai);
    });

  const fetchJadwal = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/jadwal-kelas");
      const data = await res.json();
      setJadwal(Array.isArray(data) ? data : []);
    } catch {
      setError("Gagal memuat jadwal. Pastikan server backend berjalan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/jadwal-kelas/guru-list")
      .then((r) => r.json())
      .then((d) => setGurus(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetchJadwal();
  }, [fetchJadwal]);

  async function handleSave(data: Record<string, string | undefined>) {
    setSaving(true);
    try {
      let res: Response;
      if (modal?.mode === "edit" && modal.item) {
        res = await fetch(`/api/jadwal-kelas/${modal.item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/jadwal-kelas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      if (res.ok) {
        setModal(null);
        await fetchJadwal();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.message ?? "Gagal menyimpan jadwal");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!await toast.confirm("Hapus jadwal ini?", "Jadwal kelas yang dihapus tidak dapat dikembalikan.")) return;
    const res = await fetch(`/api/jadwal-kelas/${id}`, { method: "DELETE" });
    if (res.ok) { setModal(null); await fetchJadwal(); }
  }

  return (
    <div className="space-y-5">

      {/* ── Hero — full width ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 md:px-8"
        style={{ background: "linear-gradient(135deg,#6334F4 0%,#8B5CF6 40%,#EC4899 80%,#F97316 100%)" }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/6" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 left-1/3 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <School size={11} />
              <span>Admin Panel</span>
              <ChevronRight size={11} />
              <span className="text-white/90">Jadwal Kelas</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <CalendarDays size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">Jadwal Kelas</h1>
                <p className="mt-0.5 text-sm text-white/70">Kelola jadwal, ruangan &amp; mata pelajaran</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <LiveClock />
            <motion.button
              onClick={() => setModal({ mode: "add" })}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(0,0,0,0.20)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30"
            >
              <Plus size={15} />
              Tambah Jadwal
            </motion.button>
          </div>
        </div>

      </div>

      {/* ── 4 Gradient Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CreditStatCard icon={Calendar}      label="Total Jadwal"   value={loading ? "—" : jadwal.length}   suffix="jadwal" sub="Minggu ini"    gradient="linear-gradient(135deg,#3B7CE8,#4F8EF7)" loading={loading} delay={0.05} />
        <CreditStatCard icon={GraduationCap} label="Total Kelas"    value={loading ? "—" : allKelas.length} suffix="kelas"  sub="Terdaftar"     gradient="linear-gradient(135deg,#EF4444,#F87171)" loading={loading} delay={0.10} />
        <CreditStatCard icon={Users}         label="Total Guru"     value={loading ? "—" : totalGuru}       suffix="guru"   sub={`${Math.ceil(jadwal.length / Math.max(totalGuru, 1))} jadwal/guru`} gradient="linear-gradient(135deg,#F59E0B,#FCD34D)" loading={loading} delay={0.15} />
        <CreditStatCard icon={Clock}         label="Jadwal Hari Ini" value={loading ? "—" : jadwalHariIni} suffix="jadwal" sub={`Aktif hari ${today}`} gradient="linear-gradient(135deg,#10B981,#34D399)" loading={loading} delay={0.20} />
      </div>

      {/* ── Horizontal Filter Bar ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
        className="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.07)] dark:bg-[#1c2434]"
      >
        {/* Search */}
        <div className="relative min-w-45 flex-1">
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari mata pelajaran, kelas, guru..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <AnimatePresence>
            {search && (
              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Hari */}
        <div className="relative">
          <CalendarDays size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterHari}
            onChange={(e) => setFilterHari(e.target.value)}
            className="h-9 w-35 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-7 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Semua Hari</option>
            {DAYS_FILTER.map((d) => (
              <option key={d} value={d}>{d}{d === today ? " (Hari Ini)" : ""}</option>
            ))}
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Filter Kelas */}
        <div className="relative">
          <GraduationCap size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="h-9 w-37.5 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-7 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Semua Kelas</option>
            {allKelas.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

        {/* Reset */}
        <motion.button
          onClick={() => { setFilterHari(todayDefault); setFilterKelas(""); setSearch(""); }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <RotateCcw size={12} />
          Reset
        </motion.button>

        {/* Refresh */}
        <motion.button
          onClick={fetchJadwal}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
        >
          <RefreshCw size={12} />
          Refresh
        </motion.button>

        {/* Active filter badge */}
        <AnimatePresence>
          {hasActiveFilter && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: "#4F8EF718", color: "#4F8EF7" }}>
              Filter aktif
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Count info ───────────────────────────────────────────────────────── */}
      {!loading && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Menampilkan{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{filtered.length}</span>
          {" "}dari{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{jadwal.length}</span>
          {" "}jadwal
        </p>
      )}

      {/* ── Table header (desktop) ────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="hidden overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700/50 xl:flex">
          <div className="w-1.5 shrink-0 self-stretch rounded-l-2xl" style={{ backgroundColor: "#4F8EF7" }} />
          <div className="flex-1" style={{ display: "grid", gridTemplateColumns: COL_TEMPLATE }}>
            {(["Mata Pelajaran", "Kelas", "Waktu", "Guru", "Aksi"] as const).map((col, i, arr) => (
              <div key={col} className={`flex items-center px-4 py-3 ${i < arr.length - 1 ? CELL_SEP : ""}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {col}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Jadwal list — Recent Transactions style ───────────────────────────── */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} delay={i * 60} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-white py-24 text-center dark:border-slate-700/50 dark:bg-[#1c2434]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "#EEF4FF" }}>
              <BookOpen size={28} style={{ color: "#4F8EF7" }} />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada jadwal ditemukan</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              {hasActiveFilter ? "Coba ubah kata kunci atau filter" : "Klik tombol di bawah untuk menambahkan jadwal"}
            </p>
            {!hasActiveFilter && (
              <motion.button
                onClick={() => setModal({ mode: "add" })}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="mt-6 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md"
                style={{ backgroundColor: "#4F8EF7" }}
              >
                <Plus size={14} />
                Tambah Jadwal Pertama
              </motion.button>
            )}
          </div>
        ) : (
          filtered.map((item, idx) => {
            const ac       = accentFor(item.mataPelajaran);
            const initials = getInitials(item.guru.user.nama);
            const waUrl    = item.guru.noWa
              ? `https://wa.me/${item.guru.noWa.replace(/\D/g, "")}`
              : null;
            const isToday  = item.hari === today;

            const iconBg    = isDark
              ? `linear-gradient(135deg, ${ac.strip}55, ${ac.strip}33)`
              : `linear-gradient(135deg, ${ac.icon}, ${ac.light})`;
            const iconGlyph = isDark ? "#ffffff" : ac.strip;
            const badgeBg   = isDark ? `${ac.strip}25` : ac.light;
            const badgeFg   = isDark ? ac.strip : ac.text;

            const IconBox = (
              <div className="relative shrink-0">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: iconBg, boxShadow: `0 2px 8px ${ac.strip}20` }}
                >
                  <SubjectIcon name={item.mataPelajaran} size={24} style={{ color: iconGlyph }} />
                </div>
              </div>
            );

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                whileHover={{ y: -2, boxShadow: `0 8px 24px ${ac.strip}18, 0 2px 8px rgba(0,0,0,0.04)` }}
                className="group flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]"
              >
                {/* Left color strip */}
                <div className="w-1.5 shrink-0 rounded-l-2xl transition-all duration-300 group-hover:w-2"
                  style={{ background: `linear-gradient(180deg, ${ac.strip}70, ${ac.strip})` }} />

                {/* ── Mobile layout ── */}
                <div className="flex flex-1 flex-col gap-2.5 px-4 py-3.5 xl:hidden">
                  <div className="flex items-center gap-3">
                    {IconBox}
                    <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-900 dark:text-white">
                      {item.mataPelajaran}
                    </p>
                  </div>
                  {item.ruangan && (
                    <p className="flex items-center gap-1 pl-15 text-[10px] text-slate-400 dark:text-slate-500">
                      <MapPin size={9} className="shrink-0" />{item.ruangan}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: badgeBg, color: badgeFg }}>
                      <Clock size={10} />{item.hari} · {item.jamMulai}–{item.jamSelesai}
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${ac.strip}, ${ac.text})` }}>{initials}</div>
                      <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">{item.guru.user.nama}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ActionBtn title="Edit jadwal" label="Edit" icon={Pencil} color="#4F8EF7" colorBg="#EEF4FF" onClick={() => setModal({ mode: "edit", item })} />
                    <ActionBtn title="Masuk ke kelas" label="Masuk" icon={LogIn} color="#4F8EF7" colorBg="#EEF4FF" onClick={() => router.push(`/admin/jadwal-kelas/${item.slug ?? item.id}`)} />
                    <ActionBtn title="Input presensi" label="Absen" icon={ClipboardCheck} color="#EF4444" colorBg="#FFF1F2" onClick={() => setPresensi({ jadwalKelasId: item.id, kelas: item.kelas })} />
                    {waUrl && (
                      <ActionBtn title="WhatsApp guru" label="WA" icon={MessageCircle} color="#10B981" colorBg="#ECFDF5" href={waUrl} />
                    )}
                  </div>
                </div>

                {/* ── Desktop layout ── */}
                <div className="hidden flex-1 items-center xl:grid" style={{ gridTemplateColumns: COL_TEMPLATE }}>

                  {/* Col 1: Mata Pelajaran */}
                  <div className={`flex min-w-0 items-center gap-3 self-stretch px-4 py-4 ${CELL_SEP}`}>
                    {IconBox}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{item.mataPelajaran}</p>
                      {item.ruangan && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                          <MapPin size={10} className="shrink-0" />{item.ruangan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Kelas */}
                  <div className={`flex items-center self-stretch px-3 ${CELL_SEP}`}>
                    <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-bold"
                      style={{ backgroundColor: badgeBg, color: badgeFg }}>
                      {item.kelas}
                    </span>
                  </div>

                  {/* Col 3: Waktu */}
                  <div className={`flex items-center self-stretch px-4 ${CELL_SEP}`}>
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                      style={{ backgroundColor: badgeBg }}>
                      {isToday && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
                      <Clock size={12} style={{ color: badgeFg }} className="shrink-0" />
                      <p className="whitespace-nowrap text-[12px] font-semibold" style={{ color: badgeFg }}>
                        {item.hari}<span className="mx-1.5 opacity-40">·</span>{item.jamMulai}–{item.jamSelesai}
                      </p>
                    </div>
                  </div>

                  {/* Col 4: Guru */}
                  <div className={`flex min-w-0 items-center gap-2.5 self-stretch px-4 ${CELL_SEP}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${ac.strip}, ${ac.text})` }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-700 dark:text-slate-200">{item.guru.user.nama}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Pengajar</p>
                    </div>
                  </div>

                  {/* Col 5: Aksi */}
                  <div className="flex items-center gap-1.5 self-stretch px-3 py-2">
                    <ActionBtn title="Edit jadwal" label="Edit" icon={Pencil} color="#4F8EF7" colorBg="#EEF4FF" onClick={() => setModal({ mode: "edit", item })} />
                    <ActionBtn title="Masuk ke kelas" label="Masuk" icon={LogIn} color="#4F8EF7" colorBg="#EEF4FF" onClick={() => router.push(`/admin/jadwal-kelas/${item.slug ?? item.id}`)} />
                    <ActionBtn title="Input presensi" label="Absen" icon={ClipboardCheck} color="#EF4444" colorBg="#FFF1F2" onClick={() => setPresensi({ jadwalKelasId: item.id, kelas: item.kelas })} />
                    {waUrl && (
                      <ActionBtn title="WhatsApp guru" label="WA" icon={MessageCircle} color="#10B981" colorBg="#ECFDF5" href={waUrl} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <JadwalModal
        open={modal !== null}
        mode={modal?.mode ?? "add"}
        item={modal?.item as Parameters<typeof JadwalModal>[0]["item"]}
        gurus={gurus}
        saving={saving}
        onSave={handleSave}
        onDelete={modal?.item ? () => handleDelete(modal.item!.id) : undefined}
        onClose={() => setModal(null)}
      />

      <PresensiModal
        open={presensi !== null}
        jadwalKelasId={presensi?.jadwalKelasId ?? ""}
        kelas={presensi?.kelas ?? ""}
        onClose={() => setPresensi(null)}
      />
    </div>
  );
}
