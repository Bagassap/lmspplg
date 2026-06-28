"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Loader2, ClipboardList,
  AlertCircle, GraduationCap, ChevronRight, Target,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

type TugasItem = {
  id: string;
  slug?: string | null;
  judul: string;
  deskripsi?: string | null;
  deadline?: string | null;
  createdAt: string;
  _count: { submisi: number };
};

const DUMMY_TUGAS: TugasItem[] = [
  { id: "dummy-t1", judul: "Latihan HTML Dasar",   deskripsi: "Buat halaman web sederhana menggunakan HTML5 dengan minimal 5 elemen berbeda. Upload file .html ke portal.", deadline: new Date(Date.now() + 3 * 86400000).toISOString(), createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), _count: { submisi: 18 } },
  { id: "dummy-t2", judul: "Proyek CSS Portfolio", deskripsi: "Tambahkan styling CSS pada halaman HTML sebelumnya menggunakan Flexbox atau CSS Grid untuk layout yang responsif.", deadline: new Date(Date.now() - 2 * 86400000).toISOString(), createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), _count: { submisi: 25 } },
  { id: "dummy-t3", judul: "Quiz JavaScript ES6",  deskripsi: "Kerjakan 20 soal pilihan ganda tentang Arrow Functions, Destructuring, dan Async/Await.", deadline: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), _count: { submisi: 5 } },
];

const INPUT = "w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:border-[#6334F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6334F4]/15";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isOverdue(deadline: string | null | undefined) {
  return deadline ? new Date(deadline) < new Date() : false;
}

export default function GuruTugasPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const toast  = useToast();

  const [tugasList,    setTugasList]    = useState<TugasItem[]>([]);
  const [tugasLoading, setTugasLoading] = useState(false);
  const [showTugasForm, setShowTugasForm] = useState(false);
  const [tugasForm,    setTugasForm]    = useState({ judul: "", deskripsi: "", deadline: "" });
  const [tugasSaving,  setTugasSaving]  = useState(false);

  async function fetchTugas() {
    setTugasLoading(true);
    try {
      const res  = await fetch(`/api/tugas-kelas?jadwalKelasId=${id}`);
      const data = await res.json();
      setTugasList(Array.isArray(data) ? data : []);
    } finally {
      setTugasLoading(false);
    }
  }

  useEffect(() => { fetchTugas(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveTugas(e: React.FormEvent) {
    e.preventDefault();
    setTugasSaving(true);
    try {
      const res = await fetch("/api/tugas-kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jadwalKelasId: id, ...tugasForm }),
      });
      if (res.ok) {
        setShowTugasForm(false);
        setTugasForm({ judul: "", deskripsi: "", deadline: "" });
        await fetchTugas();
      }
    } finally {
      setTugasSaving(false);
    }
  }

  async function handleDeleteTugas(tugasId: string) {
    if (!await toast.confirm("Hapus tugas ini?", "Semua submisi siswa akan ikut terhapus.")) return;
    await fetch(`/api/tugas-kelas/${tugasId}`, { method: "DELETE" });
    await fetchTugas();
  }

  const displayTugas  = tugasList.length > 0 ? tugasList : DUMMY_TUGAS;
  const isTugasDummy  = tugasList.length === 0 && !tugasLoading;

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
          <p className="text-sm font-bold text-gray-800 dark:text-white">Daftar Tugas</p>
          <p className="text-xs text-gray-400 dark:text-slate-400">{tugasList.length} tugas diberikan</p>
        </div>
        <motion.button
          onClick={() => setShowTugasForm((v) => !v)}
          whileHover={{ scale: 1.03, boxShadow: "0 6px 20px #FF386445" }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md"
          style={{ backgroundColor: "#FF3644" }}
        >
          <Plus size={14} />
          Buat Tugas
        </motion.button>
      </div>

      {/* Inline add form */}
      <AnimatePresence>
        {showTugasForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveTugas}
            className="overflow-hidden rounded-2xl border border-[#FF3644]/20 bg-[#FF3644]/5 p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF3644]">
                <Target size={13} className="text-white" />
              </div>
              <p className="text-sm font-extrabold text-[#FF3644]">Buat Tugas Baru</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">
                  Judul Tugas <span className="text-[#FF3644]">*</span>
                </label>
                <input
                  type="text" required
                  value={tugasForm.judul}
                  onChange={(e) => setTugasForm((p) => ({ ...p, judul: e.target.value }))}
                  placeholder="Judul tugas yang akan diberikan"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">Instruksi</label>
                <textarea
                  rows={2}
                  value={tugasForm.deskripsi}
                  onChange={(e) => setTugasForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  placeholder="Instruksi pengerjaan tugas (opsional)"
                  className={INPUT + " resize-none"}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <AlertCircle size={12} className="text-[#FF3644]" />
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={tugasForm.deadline}
                  onChange={(e) => setTugasForm((p) => ({ ...p, deadline: e.target.value }))}
                  className={INPUT}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTugasForm(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={tugasSaving}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-60"
                  style={{ backgroundColor: "#FF3644" }}
                >
                  {tugasSaving && <Loader2 size={13} className="animate-spin" />}
                  {tugasSaving ? "Membuat…" : "Buat Tugas"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tugas list */}
      {tugasLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {isTugasDummy && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 dark:bg-amber-900/20">
              <AlertCircle size={13} className="shrink-0 text-amber-500" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Menampilkan data contoh · Tambah tugas baru untuk memulai
              </p>
            </div>
          )}
          {displayTugas.map((t, idx) => {
            const over         = isOverdue(t.deadline);
            const isDummyItem  = t.id.startsWith("dummy-");
            const accentColor  = over ? "#FF3644" : "#FFC25B";
            const badgeBg      = over ? "#FFE9EA" : "#FFF5DC";
            const badgeText    = over ? "#CC1A26" : "#8C6500";
            const percent      = Math.min(100, (t._count.submisi / 30) * 100);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.22 }}
                whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
                className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800"
              >
                <div className="w-1.5 shrink-0" style={{ background: `linear-gradient(180deg, ${accentColor}cc, ${accentColor}55)` }} />
                <div className="flex-1 px-5 py-4">
                  <div className="mb-2 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
                      <ClipboardList size={18} style={{ color: accentColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">{t.judul}</p>
                        {isDummyItem && (
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            Contoh
                          </span>
                        )}
                      </div>
                      {t.deskripsi && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">{t.deskripsi}</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {t.deadline && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: badgeBg, color: badgeText }}>
                        <AlertCircle size={9} />
                        {over ? "Lewat: " : "Due: "}{formatDeadline(t.deadline)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0033FF]/10 px-2.5 py-1 text-[10px] font-bold text-[#0033FF] dark:bg-blue-500/20 dark:text-blue-300">
                      <GraduationCap size={9} />
                      {t._count.submisi} submisi
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{formatDate(t.createdAt)}</span>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Progress Pengumpulan</span>
                      <span className="text-[10px] font-extrabold" style={{ color: accentColor }}>{t._count.submisi} terkumpul</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.1 }}
                        className="h-2 rounded-full"
                        style={{ background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {!isDummyItem ? (
                      <motion.button
                        onClick={() => handleDeleteTugas(t.id)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF3644]/10 text-[#FF3644] transition-colors hover:bg-[#FF3644] hover:text-white dark:bg-[#FF3644]/15"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    ) : <div />}
                    <motion.button
                      onClick={() => router.push(`/guru/jadwal-kelas/${id}/tugas/${t.slug ?? t.id}`)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-bold text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})` }}
                    >
                      Lihat Detail
                      <ChevronRight size={11} />
                    </motion.button>
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
