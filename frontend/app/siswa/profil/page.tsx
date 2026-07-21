"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, MapPin, BookOpen, Calendar,
  Users, Pencil, Check, X, GraduationCap, Mail, Hash, IdCard,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/ToastSystem";

type SiswaProfil = {
  id: string;
  nis: string;
  nama: string | null;
  kelas: { id: string; nama: string; waliKelasGuru?: { user: { id: string; nama: string } } | null };
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

const HERO_GRADIENT = "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)";
const ACCENT_VIOLET = "linear-gradient(135deg,#6366F1,#4F46E5)";
const ACCENT_ORANGE = "linear-gradient(135deg,#F59E0B,#F97316)";
const PROFILE_CARD_GRADIENT = "linear-gradient(135deg, #4338ca 0%, #2563eb 50%, #0ea5e9 100%)";

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

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:bg-slate-800";

function EditProfilModal({
  siswa, kelasGradient, onClose, onSave,
}: {
  siswa: SiswaProfil;
  kelasGradient: string;
  onClose: () => void;
  onSave: (updated: SiswaProfil) => void;
}) {
  const toast = useToast();
  const [jenisKelamin, setJenisKelamin] = useState(siswa.jenisKelamin ?? "");
  const [tempatLahir, setTempatLahir] = useState(siswa.tempatLahir ?? "");
  const [tanggalLahir, setTanggalLahir] = useState(siswa.tanggalLahir ? siswa.tanggalLahir.slice(0, 10) : "");
  const [namaOrtu, setNamaOrtu] = useState(siswa.namaOrtu ?? "");
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
        body: JSON.stringify({
          jenisKelamin: jenisKelamin || undefined,
          tempatLahir: tempatLahir || undefined,
          tanggalLahir: tanggalLahir || undefined,
          namaOrtu: namaOrtu || undefined,
          noHp: noHp || undefined,
          alamat: alamat || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message.join(", ") : (data?.message ?? `Error ${res.status}`);
        throw new Error(msg);
      }
      toast.success("Profil berhasil diperbarui!", "Data diri kamu telah disimpan.");
      onSave(data as SiswaProfil);
    } catch (e) {
      const msg = e instanceof Error && e.message ? e.message : "Gagal menyimpan. Coba lagi.";
      setError(msg);
      toast.error("Gagal memperbarui profil", msg);
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
          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
            <p className="rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
              Lengkapi data diri kamu di bawah ini.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Jenis Kelamin</label>
              <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className={INPUT}>
                <option value="">— pilih —</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tempat Lahir</label>
                <input type="text" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)}
                  placeholder="Kota" className={INPUT} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tanggal Lahir</label>
                <input type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className={INPUT} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Nama Orang Tua</label>
              <input type="text" value={namaOrtu} onChange={(e) => setNamaOrtu(e.target.value)}
                placeholder="Nama orang tua/wali" className={INPUT} />
            </div>
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
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}
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
    <div className="flex items-start gap-3 py-1">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
        <Icon size={14} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-white" title={value || "—"}>{value || "—"}</p>
      </div>
    </div>
  );
}

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

function MiniStat({
  label, value, gradient, icon: Icon,
}: { label: string; value: string; gradient: string; icon: React.ElementType }) {
  return (
    <div className="relative overflow-hidden rounded-xl p-3 text-center" style={{ background: gradient }}>
      <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full bg-white/10" />
      <div className="relative flex items-center justify-center gap-1">
        <Icon size={11} className="text-white/70" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
      </div>
      <p className="relative mt-0.5 text-sm font-extrabold text-white leading-tight">{value}</p>
    </div>
  );
}

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
  const kelasGrad = PROFILE_CARD_GRADIENT;
  const avatarGrad = isP
    ? "linear-gradient(135deg,#EC4899,#db2777)"
    : kelasGrad;
  const tglLahir = [profil.tempatLahir, formatTanggal(profil.tanggalLahir)].filter(Boolean).join(", ") || "—";
  const jurusanShort = (profil.jurusan ?? "—")
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Rekayasa Perangkat Lunak", "RPL")
    .replace("Pengembangan Gim", "Gim");

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: HERO_GRADIENT }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <User size={26} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Profil Saya</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Siswa</span>
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Profil Saya</h1>
              <p className="mt-0.5 text-sm text-white/70">Informasi data diri kamu</p>
            </div>
          </div>
          <LiveClock />
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {[
            { label: kelasShort(profil.kelas.nama), bg: "bg-white/15" },
            { label: profil.jurusan ?? "—", bg: "bg-white/10" },
            { label: `Angkatan ${profil.angkatan}`, bg: "bg-white/10" },
            { label: profil.jenisKelamin ?? "—", bg: isP ? "bg-pink-400/30" : "bg-sky-400/20" },
          ].map(({ label, bg }, i) => (
            <span key={i} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm ${bg}`}>
              {label}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-5 lg:grid-cols-3"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
          <div className="relative h-24" style={{ background: kelasGrad }}>
            <div className="pointer-events-none absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
            <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {kelasShort(profil.kelas.nama)}
            </span>
          </div>

          <div className="flex flex-col items-center px-6 pb-6">
            <div className="relative -mt-12 mb-4">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-xl ring-4 ring-white dark:ring-[#1c2434]"
                style={{ background: avatarGrad }}
              >
                {getInitials(nama)}
              </div>
            </div>

            <h2 className="text-center text-lg font-extrabold text-slate-800 dark:text-white">{nama}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3.5 py-1.5 dark:bg-blue-400/15">
              <IdCard size={14} className="text-blue-600 dark:text-blue-300" />
              <span className="font-mono text-sm font-extrabold tracking-wide text-blue-600 dark:text-blue-300">
                NIS {profil.nis}
              </span>
            </div>
            {profil.user?.email && (
              <div className="mt-1 flex items-center gap-1.5">
                <Mail size={11} className="text-slate-400" />
                <span className="text-xs text-slate-400 dark:text-slate-500">{profil.user.email}</span>
              </div>
            )}

            {profil.jenisKelamin && (
              <span className={`mt-3 rounded-full px-3.5 py-1.5 text-[11px] font-bold ${
                isP
                  ? "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400"
                  : "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
              }`}>
                {profil.jenisKelamin}
              </span>
            )}

            <div className="my-5 w-full border-t border-slate-100 dark:border-slate-700/50" />

            <div className="grid w-full grid-cols-2 gap-2.5">
              <MiniStat label="Angkatan" value={String(profil.angkatan)}
                gradient={ACCENT_VIOLET} icon={Calendar} />
              <MiniStat label="Jurusan" value={jurusanShort}
                gradient={ACCENT_ORANGE} icon={BookOpen} />
            </div>

            <motion.button
              onClick={() => setShowEdit(true)}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: kelasGrad }}
            >
              <Pencil size={14} />
              Edit Profil
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <SectionCard
            title="Informasi Pribadi"
            icon={User}
            gradient={ACCENT_VIOLET}
          >
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField icon={Users} label="Jenis Kelamin" value={profil.jenisKelamin}
                iconBg={isP ? "#fdf2f8" : "#eff6ff"} iconColor={isP ? "#db2777" : "#3b82f6"} />
              <InfoField icon={Calendar} label="Tempat, Tgl Lahir" value={tglLahir}
                iconBg="#fff7ed" iconColor="#ea580c" />
              <InfoField icon={GraduationCap} label="Kelas" value={profil.kelas.nama}
                iconBg="#f5f3ff" iconColor="#7c3aed" />
              <InfoField icon={BookOpen} label="Jurusan" value={profil.jurusan}
                iconBg="#eef2ff" iconColor="#4f46e5" />
              <InfoField icon={Users} label="Nama Orang Tua" value={profil.namaOrtu}
                iconBg="#f0fdf4" iconColor="#16a34a" />
              <InfoField icon={Hash} label="NIS" value={profil.nis}
                iconBg="#ecfeff" iconColor="#0891b2" />
            </div>
          </SectionCard>

          <SectionCard
            title="Kontak & Lokasi"
            icon={Phone}
            gradient={ACCENT_ORANGE}
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
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
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
