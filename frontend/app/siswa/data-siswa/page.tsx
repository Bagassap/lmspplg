"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ChevronRight,
  Phone,
  MapPin,
  BookOpen,
  Calendar,
  Users,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNama(s: SiswaProfil): string {
  return s.nama ?? s.user?.nama ?? "—";
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatTanggal(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function kelasShort(kelas: string): string {
  return kelas
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Pengembangan Gim", "Gim")
    .replace("Rekayasa Perangkat Lunak", "RPL");
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
        <Icon size={14} className="text-violet-600 dark:text-violet-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-white">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditProfilModal({
  siswa,
  onClose,
  onSave,
}: {
  siswa: SiswaProfil;
  onClose: () => void;
  onSave: (updated: SiswaProfil) => void;
}) {
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
      onSave(data);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-sm rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Profil</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Kamu hanya dapat mengubah No. HP dan Alamat.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">No. HP</label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Alamat</label>
              <textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                rows={3}
                placeholder="Alamat lengkap..."
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/10">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Check size={15} />
              )}
              Simpan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SiswaDataDiriPage() {
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (error || !profil) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <User size={48} className="text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400">{error || "Profil tidak ditemukan."}</p>
      </div>
    );
  }

  const nama = getNama(profil);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
        style={{ background: "linear-gradient(135deg, #0033FF 0%, #2952FF 50%, #977DFF 100%)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/60">
              <span>Dashboard</span>
              <ChevronRight size={12} />
              <span className="text-white/90">Data Diri</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Data Diri</h1>
                <p className="text-xs text-white/70">Informasi profil kamu</p>
              </div>
            </div>
          </div>
          <LiveClock />
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {[
            { label: kelasShort(profil.kelas.nama), icon: BookOpen },
            { label: profil.jurusan ?? "—", icon: Users },
            { label: String(profil.angkatan), icon: Calendar },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
              <Icon size={13} className="text-white/80" />
              <span className="text-xs font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Profile card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        {/* Avatar + name */}
        <div className="mb-6 flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg ${profil.jenisKelamin === "Perempuan" ? "bg-linear-to-br from-pink-400 to-rose-500" : "bg-linear-to-br from-violet-500 to-blue-600"}`}
          >
            {getInitials(nama)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{nama}</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {profil.nis} · {profil.jenisKelamin ?? "—"}
            </p>
            {profil.user?.email && (
              <p className="text-xs text-violet-500 dark:text-violet-400">{profil.user.email}</p>
            )}
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="ml-auto flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/30"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>

        {/* Info grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={Phone} label="No. HP" value={profil.noHp} />
          <InfoRow icon={Users} label="Nama Orang Tua" value={profil.namaOrtu} />
          <InfoRow icon={Calendar} label="Tempat, Tanggal Lahir" value={profil.tempatLahir ? `${profil.tempatLahir}, ${formatTanggal(profil.tanggalLahir)}` : formatTanggal(profil.tanggalLahir)} />
          <InfoRow icon={BookOpen} label="Kelas" value={profil.kelas.nama} />
          <div className="sm:col-span-2">
            <InfoRow icon={MapPin} label="Alamat" value={profil.alamat} />
          </div>
        </div>
      </motion.div>

      {/* Edit modal */}
      {showEdit && (
        <EditProfilModal
          siswa={profil}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => { setProfil(updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
}
