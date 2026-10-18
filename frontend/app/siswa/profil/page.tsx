﻿"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, MapPin, BookOpen, Calendar,
  Users, Pencil, Check, X, GraduationCap, Mail, Hash, IdCard, Camera,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/ToastSystem";
import { formatAlamatLengkap } from "@/components/data-siswa/shared";
import { Avatar } from "@/components/shared/Avatar";
import { ChangeFotoProfilModal } from "@/components/shared/ChangeFotoProfilModal";
import { AppProfileCard } from "@/components/app/AppProfileCard";
import { AppMobileFrame, AppBanner, AppInfoRow, AppSectionTitle, AppPillButton } from "@/components/app/AppUI";
import { icon3dStyle } from "@/components/shared/Icon3D";
import { useIsAppMode } from "@/lib/pwaInstall";

type SiswaProfil = {
  id: string;
  nis: string;
  nama: string | null;
  kelas: { id: string; nama: string; waliKelasGuru?: { user: { id: string; nama: string } } | null };
  jurusan: string | null;
  angkatan: number;
  jenisKelamin: string | null;
  noHp: string | null;
  dukuh: string | null;
  rt: string | null;
  rw: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  namaOrtu: string | null;
  user: { id: string; nama: string; email: string | null; fotoProfil?: string | null } | null;
};

const ACCENT_VIOLET = "#3E03B3";
const ACCENT_ORANGE = "#F26A3D";
const PROFILE_CARD_GRADIENT = "#3E03B3";

function getNama(s: SiswaProfil): string { return s.nama ?? s.user?.nama ?? "—"; }
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
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

const INPUT_DEFAULT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#00AAFA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00AAFA]/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:bg-slate-800";

const INPUT_APP =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#3E03B3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:bg-slate-800";

function EditProfilModal({
  siswa, kelasGradient, onClose, onSave,
}: {
  siswa: SiswaProfil;
  kelasGradient: string;
  onClose: () => void;
  onSave: (updated: SiswaProfil) => void;
}) {
  const toast = useToast();
  const app = useIsAppMode();
  const INPUT = app ? INPUT_APP : INPUT_DEFAULT;
  const [jenisKelamin, setJenisKelamin] = useState(siswa.jenisKelamin ?? "");
  const [tempatLahir, setTempatLahir] = useState(siswa.tempatLahir ?? "");
  const [tanggalLahir, setTanggalLahir] = useState(siswa.tanggalLahir ? siswa.tanggalLahir.slice(0, 10) : "");
  const [namaOrtu, setNamaOrtu] = useState(siswa.namaOrtu ?? "");
  const [noHp, setNoHp] = useState(siswa.noHp ?? "");
  const [dukuh, setDukuh] = useState(siswa.dukuh ?? "");
  const [rt, setRt] = useState(siswa.rt ?? "");
  const [rw, setRw] = useState(siswa.rw ?? "");
  const [desa, setDesa] = useState(siswa.desa ?? "");
  const [kecamatan, setKecamatan] = useState(siswa.kecamatan ?? "");
  const [kabupaten, setKabupaten] = useState(siswa.kabupaten ?? "");
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
          dukuh: dukuh || undefined,
          rt: rt || undefined,
          rw: rw || undefined,
          desa: desa || undefined,
          kecamatan: kecamatan || undefined,
          kabupaten: kabupaten || undefined,
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
        className={`fixed inset-0 z-50 flex justify-center ${app ? "items-end" : "items-center p-4"}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className={`relative z-10 w-full max-w-sm overflow-hidden bg-white shadow-2xl dark:bg-[#1E293B] ${app ? "rounded-t-[28px]" : "rounded-3xl"}`}
          initial={app ? { y: "100%" } : { scale: 0.92, opacity: 0 }}
          animate={app ? { y: 0 } : { scale: 1, opacity: 1 }}
          exit={app ? { y: "100%" } : { scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ background: app ? "#F1EDFA" : kelasGradient }}>
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${app ? "bg-white text-[#3E03B3]" : "bg-white/20 text-white"}`}>
                <Pencil size={15} />
              </div>
              <h2 className={`text-base font-semibold ${app ? "text-slate-900" : "text-white"}`}>Edit Profil</h2>
            </div>
            <button
              onClick={onClose}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${app ? "bg-white text-slate-600" : "bg-white/20 text-white hover:bg-white/30"}`}
            >
              <X size={15} />
            </button>
          </div>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
            <p className="rounded-xl bg-[#F1EDFA] px-3.5 py-2.5 text-xs text-[#3E03B3] dark:bg-[#000000]/20 dark:text-[#8F6DD3]">
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
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-700 dark:bg-white/4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Alamat Lengkap</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Dukuh/Dusun</label>
                  <input type="text" value={dukuh} onChange={(e) => setDukuh(e.target.value)}
                    placeholder="Dukuh" className={INPUT} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500">RT</label>
                  <input type="text" value={rt} onChange={(e) => setRt(e.target.value)}
                    placeholder="003" className={INPUT} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500">RW</label>
                  <input type="text" value={rw} onChange={(e) => setRw(e.target.value)}
                    placeholder="005" className={INPUT} />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Desa/Kelurahan</label>
                  <input type="text" value={desa} onChange={(e) => setDesa(e.target.value)}
                    placeholder="Desa" className={INPUT} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Kecamatan</label>
                  <input type="text" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)}
                    placeholder="Kecamatan" className={INPUT} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Kabupaten/Kota</label>
                  <input type="text" value={kabupaten} onChange={(e) => setKabupaten(e.target.value)}
                    placeholder="Kabupaten" className={INPUT} />
                </div>
              </div>
            </div>
            {error && <p className="text-xs text-[#5D900F] dark:text-[#A1F919]">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-700/50">
            <button onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5">
              Batal
            </button>
            <motion.button
              onClick={handleSave} disabled={saving}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(14,165,233,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 ${app ? "rounded-full" : "rounded-xl"}`}
              style={{ background: app ? "#3E03B3" : kelasGradient }}
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
  const fg = gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF";
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1E293B]">
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ background: gradient, color: fg, borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${fg}1A` }}>
            <Icon size={14} />
          </div>
          <span className="text-sm font-semibold">{title}</span>
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
  const fg = gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF";
  return (
    <div className="relative overflow-hidden rounded-xl p-3 text-center" style={{ background: gradient, color: fg }}>
      <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full" style={{ backgroundColor: `${fg}1a` }} />
      <div className="relative flex items-center justify-center gap-1">
        <Icon size={11} style={{ color: `${fg}B3` }} />
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: `${fg}B3` }}>{label}</p>
      </div>
      <p className="relative mt-0.5 text-sm font-extrabold leading-tight">{value}</p>
    </div>
  );
}

export default function SiswaProfilPage() {
  const appMode = useIsAppMode();
  const [profil, setProfil] = useState<SiswaProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showChangeFoto, setShowChangeFoto] = useState(false);
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
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#3E03B3] border-t-violet-600" style={appMode ? { borderColor: "#3E03B3", borderTopColor: "transparent" } : undefined} />
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
    ? "#3E03B3"
    : kelasGrad;
  const tglLahir = [profil.tempatLahir, formatTanggal(profil.tanggalLahir)].filter(Boolean).join(", ") || "—";
  const jurusanShort = (profil.jurusan ?? "—")
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Rekayasa Perangkat Lunak", "RPL")
    .replace("Pengembangan Gim", "Gim");

  return (
    <div className="space-y-5">
      {appMode && (
        <>
      <AppMobileFrame eyebrow="Akun" title="Profil Saya" backHref="/siswa/dashboard">
        <AppProfileCard fallback={{ nama, fotoProfil: profil.user?.fotoProfil, role: "SISWA" }} />

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Angkatan", value: String(profil.angkatan), tone: "indigo" as const, icon: Calendar },
            { label: "Jurusan", value: jurusanShort, tone: "sky" as const, icon: BookOpen },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px]" style={icon3dStyle(t.tone)}>
                <t.icon size={24} color="#fff" />
              </span>
              <span className="text-lg font-extrabold leading-none text-slate-900 dark:text-white">{t.value}</span>
              <span className="-mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{t.label}</span>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <AppSectionTitle>Informasi Pribadi</AppSectionTitle>
          <AppInfoRow icon={Users} label="Jenis Kelamin" value={profil.jenisKelamin || "—"} />
          <AppInfoRow icon={Calendar} label="Tempat, Tgl Lahir" value={tglLahir} />
          <AppInfoRow icon={GraduationCap} label="Kelas" value={profil.kelas.nama} />
          <AppInfoRow icon={BookOpen} label="Jurusan" value={profil.jurusan || "—"} />
          <AppInfoRow icon={Users} label="Nama Orang Tua" value={profil.namaOrtu || "—"} />
          <AppInfoRow icon={Hash} label="NIS" value={profil.nis} />
        </section>

        <section className="space-y-3">
          <AppSectionTitle>Kontak &amp; Lokasi</AppSectionTitle>
          <AppInfoRow icon={Phone} label="No. HP" value={profil.noHp || "—"} />
          <AppInfoRow icon={MapPin} label="Alamat Lengkap" value={formatAlamatLengkap(profil) || "—"} />
        </section>

        <AppPillButton onClick={() => setShowEdit(true)}><Pencil size={16} /> Edit Profil</AppPillButton>
      </AppMobileFrame>
        </>
      )}
      <div className={appMode ? "hidden space-y-5 lg:block" : "space-y-5"}>
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
              style={{ background: "linear-gradient(145deg, #0EA5E9 0%, #3E03B3 55%, #2D0281 100%)" }}>
              <User size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden" />
              <User size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Profil Saya</span>
              <h1 className="text-xl font-extrabold leading-tight text-slate-800 dark:text-white sm:text-2xl">Profil Saya</h1>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-5 lg:grid-cols-3"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1E293B]">
          <div className="relative h-24" style={{ background: kelasGrad }}>
            <span className="absolute right-3 top-3 rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {kelasShort(profil.kelas.nama)}
            </span>
          </div>

          <div className="flex flex-col items-center px-6 pb-6">
            <div className="relative -mt-12 mb-4">
              <div className="rounded-full shadow-xl ring-4 ring-white dark:ring-[#1E293B]">
                <Avatar
                  src={profil.user?.fotoProfil}
                  nama={nama}
                  sizePx={96}
                  fallbackBg={avatarGrad}
                  textClassName="text-2xl font-extrabold"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowChangeFoto(true)}
                title="Ganti foto profil"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-md transition hover:brightness-90 dark:border-[#000000]"
                style={{ background: kelasGrad }}
              >
                <Camera size={13} />
              </button>
            </div>

            <h2 className="text-center text-lg font-extrabold text-slate-800 dark:text-white">{nama}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#3E03B3]/10 px-3.5 py-1.5 dark:bg-[#8F6DD3]/15">
              <IdCard size={14} className="text-[#3E03B3] dark:text-[#8F6DD3]" />
              <span className="font-mono text-sm font-extrabold tracking-wide text-[#3E03B3] dark:text-[#8F6DD3]">
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
              <span className={`mt-3 rounded-lg px-3.5 py-1.5 text-[11px] font-bold ${
                isP
                  ? "bg-[#3E03B3] text-[#3E03B3] dark:bg-[#00AAFA]/20 dark:text-[#3E03B3]"
                  : "bg-[#3E03B3] text-[#3E03B3] dark:bg-[#00AAFA]/20 dark:text-[#3E03B3]"
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
              whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(14,165,233,0.4)" }}
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
                iconBg={isP ? "#F1EDFA" : "#F1EDFA"} iconColor={isP ? "#0F172A" : "#3E03B3"} />
              <InfoField icon={Calendar} label="Tempat, Tgl Lahir" value={tglLahir}
                iconBg="#F1EDFA" iconColor="#0EA5E9" />
              <InfoField icon={GraduationCap} label="Kelas" value={profil.kelas.nama}
                iconBg="#F1EDFA" iconColor="#0EA5E9" />
              <InfoField icon={BookOpen} label="Jurusan" value={profil.jurusan}
                iconBg="#F1EDFA" iconColor="#0EA5E9" />
              <InfoField icon={Users} label="Nama Orang Tua" value={profil.namaOrtu}
                iconBg="#F1EDFA" iconColor="#3E03B3" />
              <InfoField icon={Hash} label="NIS" value={profil.nis}
                iconBg="#F1EDFA" iconColor="#3E03B3" />
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
                iconBg="#F1EDFA" iconColor="#3E03B3" />
              <InfoField icon={MapPin} label="Alamat Lengkap" value={formatAlamatLengkap(profil)}
                iconBg="#F1EDFA" iconColor="#3E03B3" />
            </div>
          </SectionCard>
        </div>
      </motion.div>


      </div>

      {showEdit && (
        <EditProfilModal
          siswa={profil}
          kelasGradient={kelasGrad}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => { setProfil(updated); setShowEdit(false); }}
        />
      )}

      {showChangeFoto && (
        <ChangeFotoProfilModal gradient={appMode ? "#3E03B3" : kelasGrad} onClose={() => setShowChangeFoto(false)} />
      )}
    </div>
  );
}
