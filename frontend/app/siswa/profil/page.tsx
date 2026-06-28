"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, ChevronRight, Phone, MapPin, BookOpen, Calendar,
  Users, Pencil, Check, X, GraduationCap, Mail, Hash,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/ToastSystem";

// ─── Types ────────────────────────────────────────────────────────────────────

type SiswaProfil = {
  id: string;
  nis: string;
  nama: string | null;
  kelas: string;
  jurusan: string | null;
  angkatan: number;
  jenisKelamin: string | null;
  noHp: string | null;
  alamat: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  namaOrtu: string | null;
  user: { id: string; nama: string; email: string | null } | null;
};

// ─── Palette (dashboard colors) ──────────────────────────────────────────────

const KELAS_GRADIENT: Record<string, string> = {
  "X Pengembangan Perangkat Lunak dan Gim 1": "linear-gradient(135deg,#a78bfa,#7c3aed)",
  "X Pengembangan Perangkat Lunak dan Gim 2": "linear-gradient(135deg,#60a5fa,#3b82f6)",
  "X Pengembangan Perangkat Lunak dan Gim 3": "linear-gradient(135deg,#818cf8,#4f46e5)",
  "XI Pengembangan Gim 1":                    "linear-gradient(135deg,#34d399,#059669)",
  "XI Rekayasa Perangkat Lunak 1":            "linear-gradient(135deg,#c084fc,#9333ea)",
  "XI Rekayasa Perangkat Lunak 2":            "linear-gradient(135deg,#f472b6,#db2777)",
};
const DEFAULT_GRADIENT = "linear-gradient(135deg,#60a5fa,#3b82f6)";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNama(s: SiswaProfil): string { return s.nama ?? s.user?.nama ?? "—"; }
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function kelasShort(kelas: string): string {
  return kelas
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Pengembangan Gim", "Gim")
    .replace("Rekayasa Perangkat Lunak", "RPL");
}
function formatTanggal(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Input style ─────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#7c3aed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:bg-slate-800";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditProfilModal({
  siswa, kelasGradient, onClose, onSave,
}: {
  siswa: SiswaProfil;
  kelasGradient: string;
  onClose: () => void;
  onSave: (updated: SiswaProfil) => void;
}) {
  const toast = useToast();
  const [noHp, setNoHp] = useState(siswa.noHp ?? "");
  const [alamat, setAlamat] = useState(siswa.alamat ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/siswa/saya", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noHp, alamat }),
      });
      if (!res.ok) throw new Error();
      const data: SiswaProfil = await res.json();
      toast.success("Profil berhasil diperbarui!", "No. HP dan alamat kamu telah disimpan.");
      onSave(data);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
      toast.error("Gagal memperbarui profil", "Terjadi kesalahan saat menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const modal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#1c2434]"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ background: kelasGradient }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <Pencil size={15} className="text-white" />
              </div>
              <h2 className="text-base font-semibold text-white">Edit Profil</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            >
              <X size={15} />
            </button>
          </div>
          <div className="space-y-4 px-6 py-5">
            <p className="rounded-xl bg-violet-50 px-3.5 py-2.5 text-xs text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
              Kamu hanya dapat mengubah No. HP dan Alamat.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">No. HP</label>
              <input type="tel" value={noHp} onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 08123456789" className={INPUT} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Alamat</label>
              <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)}
                rows={3} placeholder="Alamat lengkap..." className={INPUT + " resize-none"} />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-700/50">
            <button onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5">
              Batal
            </button>
            <motion.button
              onClick={handleSave} disabled={saving}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: kelasGradient }}
            >
              {saving
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Check size={15} />}
              Simpan
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}

// ─── Colored Info Field ───────────────────────────────────────────────────────

function InfoField({
  icon: Icon, label, value, iconBg, iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/4">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
        <Icon size={14} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-white">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title, gradient, icon: Icon, children, action,
}: {
  title: string;
  gradient: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ background: gradient, borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <Icon size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        {action}
      </div>
      <div className="space-y-2.5 p-4">{children}</div>
    </div>
  );
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────

function MiniStat({ label, value, gradient }: { label: string; value: string; gradient: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl p-3 text-center" style={{ background: gradient }}>
      <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full bg-white/10" />
      <p className="relative text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
      <p className="relative mt-0.5 text-sm font-extrabold text-white leading-tight">{value}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SiswaProfilPage() {
  const [profil, setProfil] = useState<SiswaProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/siswa/saya")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProfil)
      .catch(() => setError("Profil tidak ditemukan. Hubungi admin."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (error || !profil) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <User size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm text-slate-400">{error || "Profil tidak ditemukan."}</p>
      </div>
    );
  }

  const nama = toTitleCase(getNama(profil));
  const isP = profil.jenisKelamin === "Perempuan";
  const kelasGrad = KELAS_GRADIENT[profil.kelas] ?? DEFAULT_GRADIENT;
  const avatarGrad = isP
    ? "linear-gradient(135deg,#f472b6,#db2777)"
    : kelasGrad;
  const tglLahir = [profil.tempatLahir, formatTanggal(profil.tanggalLahir)].filter(Boolean).join(", ") || "—";
  const jurusanShort = (profil.jurusan ?? "—")
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Rekayasa Perangkat Lunak", "RPL")
    .replace("Pengembangan Gim", "Gim");

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
        style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 35%,#3b82f6 65%,#06b6d4 100%)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-14 left-24 h-44 w-44 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-3 right-1/3 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <span>Siswa</span><ChevronRight size={11} /><span className="text-white/90">Profil Saya</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">Profil Saya</h1>
                <p className="mt-0.5 text-sm text-white/70">Informasi data diri kamu</p>
              </div>
            </div>
          </div>
          <LiveClock />
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {[
            { label: kelasShort(profil.kelas), bg: "bg-white/15" },
            { label: profil.jurusan ?? "—", bg: "bg-white/10" },
            { label: `Angkatan ${profil.angkatan}`, bg: "bg-white/10" },
            { label: profil.jenisKelamin ?? "—", bg: isP ? "bg-pink-400/30" : "bg-sky-400/20" },
          ].map(({ label, bg }, i) => (
            <span key={i} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm ${bg}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Layout: left profile + right info ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-5 lg:grid-cols-3"
      >
        {/* ── Left: Profile Card ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
          {/* Gradient cover */}
          <div className="relative h-24" style={{ background: kelasGrad }}>
            <div className="pointer-events-none absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
            {/* kelas badge */}
            <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {kelasShort(profil.kelas)}
            </span>
          </div>

          <div className="flex flex-col items-center px-6 pb-6">
            {/* Avatar overlapping cover */}
            <div className="relative -mt-12 mb-4">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-xl ring-4 ring-white dark:ring-[#1c2434]"
                style={{ background: avatarGrad }}
              >
                {getInitials(nama)}
              </div>
            </div>

            {/* Name & info */}
            <h2 className="text-center text-lg font-extrabold text-slate-800 dark:text-white">{nama}</h2>
            <div className="mt-1 flex items-center gap-1.5">
              <Hash size={11} className="text-slate-400" />
              <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{profil.nis}</span>
            </div>
            {profil.user?.email && (
              <div className="mt-1 flex items-center gap-1.5">
                <Mail size={11} className="text-slate-400" />
                <span className="text-xs text-slate-400 dark:text-slate-500">{profil.user.email}</span>
              </div>
            )}

            {/* Gender chip */}
            {profil.jenisKelamin && (
              <span className={`mt-3 rounded-full px-3.5 py-1.5 text-[11px] font-bold ${
                isP
                  ? "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400"
                  : "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
              }`}>
                {profil.jenisKelamin}
              </span>
            )}

            {/* Divider */}
            <div className="my-5 w-full border-t border-slate-100 dark:border-slate-700/50" />

            {/* Colorful stats */}
            <div className="grid w-full grid-cols-2 gap-2.5">
              <MiniStat label="Angkatan" value={String(profil.angkatan)}
                gradient="linear-gradient(135deg,#a78bfa,#7c3aed)" />
              <MiniStat label="Jurusan" value={jurusanShort}
                gradient="linear-gradient(135deg,#34d399,#059669)" />
            </div>

            {/* Edit button */}
            <motion.button
              onClick={() => setShowEdit(true)}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: kelasGrad }}
            >
              <Pencil size={14} />
              Edit Profil
            </motion.button>
          </div>
        </div>

        {/* ── Right: Info Cards ── */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Informasi Pribadi — purple gradient header */}
          <SectionCard
            title="Informasi Pribadi"
            icon={User}
            gradient="linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%)"
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <InfoField icon={Users} label="Jenis Kelamin" value={profil.jenisKelamin}
                iconBg={isP ? "#fdf2f8" : "#eff6ff"} iconColor={isP ? "#db2777" : "#3b82f6"} />
              <InfoField icon={Calendar} label="Tempat, Tgl Lahir" value={tglLahir}
                iconBg="#fff7ed" iconColor="#ea580c" />
              <InfoField icon={GraduationCap} label="Kelas" value={profil.kelas}
                iconBg="#f5f3ff" iconColor="#7c3aed" />
              <InfoField icon={BookOpen} label="Jurusan" value={profil.jurusan}
                iconBg="#eef2ff" iconColor="#4f46e5" />
              <InfoField icon={Users} label="Nama Orang Tua" value={profil.namaOrtu}
                iconBg="#f0fdf4" iconColor="#16a34a" />
              <InfoField icon={Hash} label="NIS" value={profil.nis}
                iconBg="#ecfeff" iconColor="#0891b2" />
            </div>
          </SectionCard>

          {/* Kontak & Lokasi — teal gradient header */}
          <SectionCard
            title="Kontak & Lokasi"
            icon={Phone}
            gradient="linear-gradient(135deg,#34d399 0%,#059669 100%)"
            action={
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/30"
              >
                <Pencil size={11} />
                Edit
              </button>
            }
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <InfoField icon={Phone} label="No. HP" value={profil.noHp}
                iconBg="#eff6ff" iconColor="#3b82f6" />
              <InfoField icon={MapPin} label="Alamat" value={profil.alamat}
                iconBg="#fff7ed" iconColor="#f97316" />
            </div>
          </SectionCard>
        </div>
      </motion.div>

      {showEdit && (
        <EditProfilModal
          siswa={profil}
          kelasGradient={kelasGrad}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => { setProfil(updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
}
