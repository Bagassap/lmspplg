"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Plus, Pin, MessageCircle,
  AlertCircle, ChevronRight, ChevronLeft,
  Clock, BookOpen, Bell, ChevronDown, Loader2,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import type { PengumumanItem } from "./PengumumanFormModal";
import { PengumumanFormModal } from "./PengumumanFormModal";
import type { KomentarItem } from "./KomentarSection";
import { KomentarSection } from "./KomentarSection";

// ─── Types ─────────────────────────────────────────────────────────────────────

type PengumumanDetail = PengumumanItem & { komentar: KomentarItem[] };

// ─── Constants ─────────────────────────────────────────────────────────────────

const KATEGORI_GRADIENT: Record<string, string> = {
  Umum:     "linear-gradient(135deg, #6334F4 0%, #977DFF 100%)",
  Akademik: "linear-gradient(135deg, #3B7CE8 0%, #4F8EF7 100%)",
  Magang:   "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
  Ujian:    "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
  Lainnya:  "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
};

const MONTH_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_ID   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ announcementDates }: { announcementDates: Set<string> }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year        = viewDate.getFullYear();
  const month       = viewDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function isToday(d: number) {
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  }
  function hasAnnouncement(d: number) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return announcementDates.has(key);
  }

  // Warna dot pengumuman berdasarkan posisi di bulan
  const DOT_COLORS = ["#6334F4","#3B7CE8","#10B981","#F97316","#EC4899","#F59E0B"];
  function dotColor(d: number) { return DOT_COLORS[d % DOT_COLORS.length]; }

  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-none">
      {/* Gradient header */}
      <div className="relative px-5 py-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#6334F4 0%,#8B5CF6 50%,#EC4899 100%)" }}>
        <div className="pointer-events-none absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10"/>
        <div className="pointer-events-none absolute -bottom-4 right-16 w-20 h-20 rounded-full bg-white/8"/>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-0.5">Kalender</p>
            <h2 className="text-base font-extrabold text-white">{MONTH_ID[month]} {year}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors">
              <ChevronLeft size={14}/>
            </button>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors">
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      <div className="bg-white dark:bg-[#1c2434] px-4 pb-4 pt-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_ID.map((d, i) => (
            <div key={d} className="text-center text-[10px] font-bold"
              style={{ color: i >= 5 ? "#EC4899" : "#94a3b8" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i}/>;
            const todayFlag = isToday(d);
            const hasAnn    = hasAnnouncement(d);
            const weekend   = (i - (firstDay === 0 ? 6 : firstDay - 1)) % 7 >= 5;
            return (
              <div key={i} className="flex flex-col items-center py-0.5">
                <div className={`relative w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-medium transition-all
                  ${todayFlag ? "text-white font-bold shadow-md" : weekend ? "text-pink-400 dark:text-pink-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}
                  style={todayFlag ? { background: "linear-gradient(135deg,#6334F4,#8B5CF6)" } : {}}>
                  {d}
                  {/* Announcement dot */}
                  {hasAnn && !todayFlag && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: dotColor(d) }}/>
                  )}
                  {/* Today + announcement: white dot */}
                  {hasAnn && todayFlag && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80"/>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full" style={{ background: "linear-gradient(135deg,#6334F4,#8B5CF6)" }}/>
            <span className="text-[10px] text-slate-400">Hari ini</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500"/>
            <span className="text-[10px] text-slate-400">Ada pengumuman</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Accordion Card ─────────────────────────────────────────────────────────────

function AccordionCard({
  p,
  isOpen,
  detail,
  detailLoading,
  canManage,
  currentUserId,
  onToggle,
  onEdit,
  onDelete,
  onPin,
}: {
  p: PengumumanItem;
  isOpen: boolean;
  detail: PengumumanDetail | null;
  detailLoading: boolean;
  canManage: boolean;
  currentUserId: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const gradient = p.isPinned
    ? "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)"
    : (KATEGORI_GRADIENT[p.kategori] ?? KATEGORI_GRADIENT.Lainnya);

  function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)        return "baru saja";
    if (diff < 3600)      return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400)     return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 86400 * 2) return "Kemarin";
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} hari lalu`;
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)] transition-shadow dark:bg-[#1c2434] ${
      isOpen ? "shadow-[0_4px_20px_rgba(0,0,0,0.12)]" : ""
    }`}>

      {/* ── Header (always visible, click to toggle) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        {/* Gradient band */}
        <div className="relative overflow-hidden px-4 py-4" style={{ background: gradient }}>
          <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-8 right-12 h-20 w-20 rounded-full bg-white/8" />

          <div className="relative flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              {p.isPinned ? <Pin size={15} className="text-white" /> : <Bell size={15} className="text-white" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-snug text-white">{p.judul}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/65">
                <Clock size={9} />{timeAgo(p.createdAt)}
              </p>
            </div>
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
              <ChevronDown size={13} className="text-white" />
            </div>
          </div>

          {/* Badges */}
          <div className="relative mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white">
              {p.kategori}
            </span>
            {p.isPinned && (
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold text-white">Disematkan</span>
            )}
            {p.prioritas === "PENTING" && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">Penting</span>
            )}
            {p.prioritas === "MENDESAK" && (
              <span className="animate-pulse rounded-full bg-red-500/30 px-2 py-0.5 text-[10px] font-bold text-white">Mendesak</span>
            )}
          </div>
        </div>

        {/* Author bar (collapsed only) */}
        {!isOpen && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: gradient }}
              >
                {p.author.nama.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{p.author.nama}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                · <MessageCircle size={9} className="mr-0.5 inline" />{p._count.komentar}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Klik untuk baca →</span>
          </div>
        )}
      </button>

      {/* ── Expanded body ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            {/* ── Content area ── */}
            <div className="relative overflow-hidden">
              {/* Colored left strip */}
              <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r" style={{ background: gradient }} />

              {/* Subtle tinted bg */}
              <div
                className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
                style={{ background: gradient }}
              />

              {/* Decorative large quote mark */}
              <div
                className="pointer-events-none absolute right-4 top-0 select-none font-serif text-[96px] leading-none opacity-[0.06]"
                style={{ color: "currentColor" }}
              >"</div>

              <div className="relative px-6 py-5">
                {/* Author + admin actions */}
                <div className="mb-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {/* Avatar with ring */}
                  <div className="relative shrink-0">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-lg ring-2 ring-white dark:ring-slate-700"
                      style={{ background: gradient }}
                    >
                      {p.author.nama.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 ring-1 ring-white dark:ring-[#1c2434]">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-white">{p.author.nama}</p>
                    <p className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <Clock size={9} /> {timeAgo(p.createdAt)}
                    </p>
                  </div>

                  {canManage && (
                    <div className="ml-auto flex items-center gap-0.5">
                      <button onClick={onPin} title={p.isPinned ? "Lepas sematkan" : "Sematkan"}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                          p.isPinned
                            ? "bg-amber-50 text-amber-500 dark:bg-amber-900/20"
                            : "text-slate-400 hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-900/20"
                        }`}><Pin size={13} /></button>
                      <button onClick={onEdit} title="Edit"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20">
                        <BookOpen size={13} /></button>
                      <button onClick={onDelete} title="Hapus"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                        <AlertCircle size={13} /></button>
                    </div>
                  )}
                </div>

                {/* Content text */}
                <p className="text-[13.5px] leading-[1.85] text-slate-600 dark:text-slate-300" style={{ whiteSpace: "pre-wrap" }}>
                  {p.konten}
                </p>
              </div>
            </div>

            {/* ── Ruang Diskusi header band ── */}
            <div className="relative overflow-hidden">
              {/* Gradient wash */}
              <div
                className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
                style={{ background: "linear-gradient(90deg, #6334F4 0%, #977DFF 60%, transparent 100%)" }}
              />
              <div className="relative flex items-center gap-3 border-y border-[#6334F4]/10 px-6 py-3 dark:border-[#6334F4]/20">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6334F4]/12 dark:bg-[#6334F4]/20">
                  <MessageCircle size={13} className="text-[#6334F4] dark:text-purple-400" />
                </div>
                <span className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-white">
                  Ruang Diskusi
                </span>
                {detail && (
                  <span className="rounded-full bg-[#6334F4]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#6334F4] dark:bg-purple-900/30 dark:text-purple-400">
                    {detail.komentar.reduce((s, k) => s + 1 + (k.replies?.length ?? 0), 0)} pesan
                  </span>
                )}
                {/* Decorative dots */}
                <div className="ml-auto flex items-center gap-1 opacity-30">
                  {[0,1,2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#6334F4]" style={{ opacity: 1 - i * 0.25 }} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Discussion content ── */}
            <div className="px-5 pb-6 pt-4">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-[#6334F4]/10" />
                    <Loader2 size={18} className="absolute inset-0 m-auto animate-spin text-[#6334F4]" />
                  </div>
                  <span className="text-[12px] text-slate-400">Memuat diskusi...</span>
                </div>
              ) : detail ? (
                <KomentarSection
                  initialKomentar={detail.komentar}
                  pengumumanId={detail.id}
                  currentUserId={currentUserId}
                  canManage={canManage}
                />
              ) : (
                <div className="py-6 text-center text-[12px] text-slate-400">Gagal memuat diskusi</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function PengumumanListPage({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const [list,          setList]          = useState<PengumumanItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editItem,      setEditItem]      = useState<PengumumanItem | null>(null);
  const [error,         setError]         = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  // Accordion state
  const [openSlug,    setOpenSlug]    = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, PengumumanDetail>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const autoOpenDone  = useRef(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/pengumuman");
      const data = await res.json();
      const arr: PengumumanItem[] = Array.isArray(data) ? data : [];
      setList(arr);
      return arr;
    } catch {
      setError("Gagal memuat pengumuman. Pastikan server berjalan.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  async function fetchDetail(slug: string): Promise<PengumumanDetail | null> {
    if (detailCache[slug]) return detailCache[slug];
    setLoadingSlug(slug);
    try {
      const res = await fetch(`/api/pengumuman/${slug}`);
      if (!res.ok) return null;
      const data: PengumumanDetail = await res.json();
      setDetailCache((prev) => ({ ...prev, [slug]: data }));
      return data;
    } catch {
      return null;
    } finally {
      setLoadingSlug(null);
    }
  }

  // Load list + auto-open first card
  useEffect(() => {
    fetchList().then((arr) => {
      if (autoOpenDone.current || arr.length === 0) return;
      autoOpenDone.current = true;
      const sorted = [...arr].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const first = sorted[0];
      setOpenSlug(first.slug);
      fetchDetail(first.slug);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setCurrentUserId(d?.id ?? "")).catch(() => {});
  }, []);

  async function handleToggle(slug: string) {
    if (openSlug === slug) {
      setOpenSlug(null);
    } else {
      setOpenSlug(slug);
      fetchDetail(slug);
    }
  }

  async function handleDelete(p: PengumumanItem) {
    if (!await toast.confirm("Hapus pengumuman?", `"${p.judul}" akan dihapus permanen.`)) return;
    await fetch(`/api/pengumuman/${p.id}`, { method: "DELETE" });
    setList((prev) => prev.filter((x) => x.id !== p.id));
    if (openSlug === p.slug) setOpenSlug(null);
    setDetailCache((prev) => { const c = { ...prev }; delete c[p.slug]; return c; });
  }

  async function handleTogglePin(p: PengumumanItem) {
    const res = await fetch(`/api/pengumuman/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !p.isPinned }),
    });
    if (res.ok) {
      const updated = await res.json();
      setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setDetailCache((prev) => {
        if (!prev[p.slug]) return prev;
        return { ...prev, [p.slug]: { ...prev[p.slug], isPinned: !p.isPinned } };
      });
    }
  }

  const sorted = [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const announcementDates = new Set(list.map((p) => p.createdAt.split("T")[0]));
  const pinnedCount  = list.filter((p) => p.isPinned).length;
  const todayCount   = list.filter((p) => {
    const d = new Date(p.createdAt); const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }).length;
  const totalKomentar = list.reduce((s, p) => s + p._count.komentar, 0);

  return (
    <div className="space-y-5">

      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: "linear-gradient(135deg,#6334F4 0%,#8B5CF6 40%,#EC4899 80%,#F97316 100%)" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10"/>
        <div className="pointer-events-none absolute -bottom-8 right-32 w-36 h-36 rounded-full bg-white/8"/>
        <div className="pointer-events-none absolute bottom-4 -left-6 w-24 h-24 rounded-full bg-white/6"/>
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
              <Megaphone size={26} className="text-white"/>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Papan Informasi</span>
                {canManage && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">Admin</span>}
              </div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Pengumuman</h1>
              <p className="text-sm text-white/70 mt-0.5">Kelola dan pantau semua pengumuman sekolah</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {[
              { icon: Megaphone,      label: "Total",      val: list.length },
              { icon: Pin,            label: "Disematkan", val: pinnedCount },
              { icon: MessageCircle,  label: "Komentar",   val: totalKomentar },
              { icon: Bell,           label: "Hari Ini",   val: todayCount },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm min-w-15">
                <Icon size={13} className="text-white/70 mb-1"/>
                <p className="text-xl font-extrabold text-white leading-none">{loading ? "—" : val}</p>
                <p className="text-[10px] text-white/60 font-semibold mt-0.5">{label}</p>
              </div>
            ))}
            {canManage && (
              <motion.button
                onClick={() => { setEditItem(null); setModalOpen(true); }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[13px] font-bold shadow-lg shrink-0"
                style={{ color: "#6334F4" }}>
                <Plus size={15}/> Buat Pengumuman
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">

      {/* ── Left: Calendar ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <MiniCalendar announcementDates={announcementDates} />
      </div>

      {/* ── Right: Accordion Cards ───────────────────────────────────────────── */}
      <div>
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"
            >
              <AlertCircle size={14} className="shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
                style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-white py-24 text-center dark:border-slate-700/50 dark:bg-[#1c2434]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Bell size={22} className="text-primary" />
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-300">Belum ada pengumuman</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Pengumuman akan muncul di sini</p>
            {canManage && (
              <motion.button
                onClick={() => { setEditItem(null); setModalOpen(true); }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="mt-5 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                <Plus size={14} /> Buat Pertama
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
              >
                <AccordionCard
                  p={p}
                  isOpen={openSlug === p.slug}
                  detail={detailCache[p.slug] ?? null}
                  detailLoading={loadingSlug === p.slug}
                  canManage={canManage}
                  currentUserId={currentUserId}
                  onToggle={() => handleToggle(p.slug)}
                  onEdit={() => { setEditItem(p); setModalOpen(true); }}
                  onDelete={() => handleDelete(p)}
                  onPin={() => handleTogglePin(p)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      </div>{/* end inner grid */}

      {/* ── Form Modal ───────────────────────────────────────────────────────── */}
      <PengumumanFormModal
        open={modalOpen}
        pengumuman={editItem}
        onClose={() => setModalOpen(false)}
        onSaved={(saved) => {
          if (editItem) {
            setList((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
          } else {
            setList((prev) => [saved, ...prev]);
          }
          setModalOpen(false);
        }}
      />
    </div>
  );
}
