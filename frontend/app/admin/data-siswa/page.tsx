"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users, Search, X, ChevronRight, ChevronLeft, ChevronDown,
  GraduationCap, User, Pencil, Sparkles,
  BookOpen, Phone, MapPin, CalendarDays, Eye, KeyRound,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import SiswaDetailModal from "@/components/data-siswa/SiswaDetailModal";
import { useToast } from "@/components/shared/ToastSystem";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";
import { SUPER_ADMIN_LOGIN_ID } from "@/lib/constants";

type KelasRef = { id: string; nama: string; waliKelasGuru?: { user: { id: string; nama: string } } | null };
type Siswa = {
  id: string; nis: string; nama: string | null; kelas: KelasRef;
  jurusan: string | null; angkatan: number; jenisKelamin: string | null;
  noHp: string | null; alamat: string | null; tempatLahir: string | null;
  tanggalLahir: string | null; namaOrtu: string | null;
  user: { id: string; nama: string; email: string | null } | null;
};
type KelasAc = { main: string; light: string; text: string; dark: string };

const KELAS_COLOR: Record<string, KelasAc> = {
  "X Pengembangan Perangkat Lunak dan Gim 1":  { main: "#6EA7F9", light: "#F0EDFF", text: "#5B3FBD", dark: "#4F8EF7" },
  "X Pengembangan Perangkat Lunak dan Gim 2":  { main: "#0033FF", light: "#EBF0FF", text: "#002BD4", dark: "#0022CC" },
  "X Pengembangan Perangkat Lunak dan Gim 3":  { main: "#6366F1", light: "#EDEFFF", text: "#4338CA", dark: "#4F46E5" },
  "XI Pengembangan Gim 1":                     { main: "#14B8A6", light: "#F0FDFA", text: "#0F766E", dark: "#0D9488" },
  "XI Rekayasa Perangkat Lunak 1":             { main: "#8B5CF6", light: "#F5F0FF", text: "#6D28D9", dark: "#7C3AED" },
  "XI Rekayasa Perangkat Lunak 2":             { main: "#EC4899", light: "#FDF2F8", text: "#9D174D", dark: "#DB2777" },
};
const DEFAULT_AC: KelasAc = { main: "#6EA7F9", light: "#F0EDFF", text: "#5B3FBD", dark: "#4F8EF7" };
const JURUSAN_OPTIONS = [
  "Pengembangan Perangkat Lunak dan Gim",
  "Pengembangan Gim",
  "Rekayasa Perangkat Lunak",
];

const COL_GROUPED = "36px 36px minmax(0,1.8fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.9fr) minmax(0,1fr) minmax(0,0.7fr) 148px";
const COL_FLAT    = "36px 36px minmax(0,1.6fr) minmax(0,0.65fr) minmax(0,0.7fr) minmax(0,0.65fr) minmax(0,0.9fr) minmax(0,1fr) minmax(0,0.65fr) 148px";
const PAGE_SIZE = 10;

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-all hover:border-slate-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:bg-slate-800";
const SELECT =
  "w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-9 text-sm text-slate-800 transition-all hover:border-slate-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/12 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:bg-slate-800";

function getNama(s: Siswa): string { return s.nama ?? s.user?.nama ?? "—"; }
function getInitials(name: string): string { return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
function toTitleCase(str: string): string {
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function kelasShort(kelas: string): string {
  return kelas
    .replace("Pengembangan Perangkat Lunak dan Gim", "PPLG")
    .replace("Pengembangan Gim", "Gim")
    .replace("Rekayasa Perangkat Lunak", "RPL");
}
function formatTglShort(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function Field({ label, icon: Icon, required, optional, children }: {
  label: string; icon: React.ElementType; required?: boolean; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
        <Icon size={10} className="text-primary/70" />
        {label}
        {required && <span className="normal-case text-[#FF3644]">*</span>}
        {optional && <span className="font-normal normal-case text-gray-400">(opsional)</span>}
      </label>
      {children}
    </div>
  );
}

function EditModal({ siswa, kelasList, onClose, onSave }: {
  siswa: Siswa; kelasList: KelasRef[]; onClose: () => void; onSave: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    nama: siswa.nama ?? "", kelasId: siswa.kelas.id, jurusan: siswa.jurusan ?? "",
    angkatan: String(siswa.angkatan), jenisKelamin: siswa.jenisKelamin ?? "",
    noHp: siswa.noHp ?? "", alamat: siswa.alamat ?? "",
    tempatLahir: siswa.tempatLahir ?? "",
    tanggalLahir: siswa.tanggalLahir ? siswa.tanggalLahir.slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof form, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/siswa/${siswa.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, angkatan: Number(form.angkatan) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
      toast.success("Data berhasil disimpan!", `Data siswa ${getNama(siswa)} telah diperbarui.`);
      onSave();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan. Coba lagi.";
      setError(msg);
      toast.error("Gagal menyimpan data", msg);
    } finally { setSaving(false); }
  }

  const displayNama = toTitleCase(getNama(siswa));
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-999 flex items-end justify-center p-4 sm:items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          initial={{ scale: 0.95, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 24 }} transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}>
          <div className="relative overflow-hidden px-6 py-5"
            style={{ background: "linear-gradient(135deg, #3B7CE8 0%, #4F8EF7 100%)" }}>
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">Edit Data Siswa</p>
                  <h2 className="text-base font-extrabold leading-tight text-white">{displayNama}</h2>
                  <p className="text-[10px] text-white/60">NIS: {siswa.nis}</p>
                </div>
              </div>
              <button onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white/80 transition-all hover:bg-white/25 hover:text-white">
                <X size={15} />
              </button>
            </div>
          </div>
          <div className="max-h-[52vh] overflow-y-auto">
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nama Lengkap" required icon={User}>
                  <input type="text" value={form.nama} onChange={(e) => set("nama", e.target.value)}
                    placeholder="Nama siswa" className={INPUT} />
                </Field>
                <Field label="Jenis Kelamin" icon={User}>
                  <div className="relative">
                    <select value={form.jenisKelamin} onChange={(e) => set("jenisKelamin", e.target.value)} className={SELECT}>
                      <option value="">— pilih —</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </Field>
              </div>
              <Field label="Angkatan" required icon={CalendarDays}>
                <input type="number" value={form.angkatan} onChange={(e) => set("angkatan", e.target.value)} className={INPUT} />
              </Field>
              <Field label="Kelas" required icon={GraduationCap}>
                <div className="relative">
                  <select value={form.kelasId} onChange={(e) => set("kelasId", e.target.value)} className={SELECT}>
                    {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>
              <Field label="Jurusan" icon={BookOpen}>
                <div className="relative">
                  <select value={form.jurusan} onChange={(e) => set("jurusan", e.target.value)} className={SELECT}>
                    <option value="">— pilih —</option>
                    {JURUSAN_OPTIONS.map((j) => <option key={j}>{j}</option>)}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>
              <Field label="No. HP" optional icon={Phone}>
                <input type="tel" value={form.noHp} onChange={(e) => set("noHp", e.target.value)}
                  placeholder="08xxxxxxxxxx" className={INPUT} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tempat Lahir" optional icon={MapPin}>
                  <input type="text" value={form.tempatLahir} onChange={(e) => set("tempatLahir", e.target.value)}
                    placeholder="Kota" className={INPUT} />
                </Field>
                <Field label="Tanggal Lahir" optional icon={CalendarDays}>
                  <input type="date" value={form.tanggalLahir} onChange={(e) => set("tanggalLahir", e.target.value)} className={INPUT} />
                </Field>
              </div>
              <Field label="Alamat" optional icon={MapPin}>
                <textarea value={form.alamat} onChange={(e) => set("alamat", e.target.value)}
                  rows={2} placeholder="Alamat lengkap..." className={INPUT + " resize-none"} />
              </Field>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-slate-800">
            <div />
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                Batal
              </button>
              <motion.button type="button" onClick={handleSave} disabled={saving}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 24px #4F8EF755" }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-md transition-opacity disabled:opacity-60"
                style={{ backgroundColor: "#4F8EF7" }}>
                {saving
                  ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan…</>
                  : <><Sparkles size={14} />Simpan</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`flex h-3.75 w-3.75 shrink-0 items-center justify-center rounded border transition-all ${
        checked
          ? "border-primary bg-primary"
          : "border-gray-300 bg-white hover:border-primary/60 dark:border-slate-600 dark:bg-slate-800"
      }`}>
      {checked && (
        <svg viewBox="0 0 12 10" fill="none" className="h-2.5 w-2.5">
          <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function TableHead({ isFlat, allChecked, onToggleAll }: {
  isFlat: boolean; allChecked: boolean; onToggleAll: () => void;
}) {
  const dataCols = isFlat
    ? ["Nama Siswa", "NIS", "Kelas", "Jenis Kelamin", "Tempat, Tgl Lahir", "Alamat", "No. HP"]
    : ["Nama Siswa", "NIS", "Jenis Kelamin", "Tempat, Tgl Lahir", "Alamat", "No. HP"];
  const colTemplate = isFlat ? COL_FLAT : COL_GROUPED;
  return (
    <div className="border border-transparent pb-2 pt-3"
      style={{ display: "grid", gridTemplateColumns: colTemplate }}>
      <div className="flex items-center justify-center px-3.5 py-1">
        <Checkbox checked={allChecked} onChange={onToggleAll} />
      </div>
      <div className="flex items-center px-3 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">#</span>
      </div>
      {dataCols.map((col) => (
        <div key={col} className="flex items-center px-4 py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">{col}</span>
        </div>
      ))}
      <div className="flex items-center justify-center px-3 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Aksi</span>
      </div>
    </div>
  );
}

function SiswaRow({ siswa, isFlat, onEdit, onDetail, onResetPassword, canResetPassword, index, rowNumber, checked, onCheck }: {
  siswa: Siswa; isFlat: boolean; onEdit: (s: Siswa) => void; onDetail: (s: Siswa) => void;
  onResetPassword: (s: Siswa) => void; canResetPassword: boolean;
  index: number; rowNumber: number; checked: boolean; onCheck: () => void;
}) {
  const ac = KELAS_COLOR[siswa.kelas.nama] ?? DEFAULT_AC;
  const displayNama = toTitleCase(getNama(siswa));
  const colTemplate = isFlat ? COL_FLAT : COL_GROUPED;
  const isP = siswa.jenisKelamin === "Perempuan";
  const isL = siswa.jenisKelamin === "Laki-laki";
  const tglLahir = [siswa.tempatLahir, formatTglShort(siswa.tanggalLahir)].filter(Boolean).join(", ") || "—";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.018, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onDetail(siswa)}
      className={`group cursor-pointer rounded-lg border transition-all duration-150 ${
        checked
          ? "border-primary/30 bg-primary/4 shadow-sm dark:border-primary/30 dark:bg-primary/8"
          : "border-gray-100 bg-white shadow-sm hover:border-primary/25 hover:shadow-md dark:border-slate-700/50 dark:bg-[#1c2434] dark:hover:border-primary/30"
      }`}
      style={{ display: "grid", gridTemplateColumns: colTemplate }}
    >
      <div className="flex items-center justify-center px-3.5 py-3.5">
        <Checkbox checked={checked} onChange={onCheck} />
      </div>
      <div className="flex items-center px-3 py-3.5">
        <span className="text-sm tabular-nums text-gray-400 dark:text-slate-500">{rowNumber}</span>
      </div>
      <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white dark:ring-slate-800"
          style={{ background: isP ? "linear-gradient(135deg,#EC4899,#9D174D)" : "linear-gradient(135deg,#4F8EF7,#3B7CE8)" }}>
          {getInitials(displayNama)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{displayNama}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Angkatan {siswa.angkatan}</p>
        </div>
      </div>
      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">
          {siswa.nis}
        </span>
      </div>
      {isFlat && (
        <div className="flex min-w-0 items-center px-4 py-3.5">
          <span className="truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: ac.light, color: ac.text }}>{kelasShort(siswa.kelas.nama)}</span>
        </div>
      )}
      <div className="flex min-w-0 items-center px-4 py-3.5">
        {isP ? (
          <span className="inline-flex items-center rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-semibold text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">Perempuan</span>
        ) : isL ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">Laki-laki</span>
        ) : <span className="text-sm text-gray-400">—</span>}
      </div>
      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="truncate text-sm text-gray-500 dark:text-gray-400" title={tglLahir}>{tglLahir}</span>
      </div>
      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="truncate text-sm text-gray-500 dark:text-gray-400" title={siswa.alamat ?? ""}>{siswa.alamat ?? "—"}</span>
      </div>
      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="truncate text-sm text-gray-500 dark:text-gray-400">{siswa.noHp ?? "—"}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-3.5">
        <button
          onClick={(e) => { e.stopPropagation(); onDetail(siswa); }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-primary dark:hover:bg-white/10"
          title="Lihat Detail"
        >
          <Eye size={13} />
        </button>
        {siswa.user && canResetPassword && (
          <button
            onClick={(e) => { e.stopPropagation(); onResetPassword(siswa); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            title="Reset Password"
          >
            <KeyRound size={13} />
          </button>
        )}
        <motion.button
          onClick={(e) => { e.stopPropagation(); onEdit(siswa); }}
          whileHover={{ scale: 1.03, boxShadow: "0 4px 14px #4F8EF735" }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-primary"
          style={{ backgroundColor: "#EEF4FF" }}
        >
          <Pencil size={10} /> Edit
        </motion.button>
      </div>
    </motion.div>
  );
}

function PaginationBar({ page, pageCount, total, onPage }: {
  page: number; pageCount: number; total: number; onPage: (p: number) => void;
}) {
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  const pages: (number | "\u2026")[] = [];
  if (pageCount <= 7) {
    for (let i = 0; i < pageCount; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 2) pages.push("\u2026");
    for (let i = Math.max(1, page - 1); i <= Math.min(pageCount - 2, page + 1); i++) pages.push(i);
    if (page < pageCount - 3) pages.push("\u2026");
    pages.push(pageCount - 1);
  }
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-slate-700/40">
      <span className="text-xs text-gray-400 dark:text-slate-500">{start}\u2013{end} dari {total}</span>
      <div className="flex items-center gap-0.5">
        <button onClick={() => onPage(page - 1)} disabled={page === 0}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/10">
          <ChevronLeft size={13} /> Previous
        </button>
        <div className="mx-1 flex items-center gap-0.5">
          {pages.map((p, i) =>
            p === "\u2026" ? (
              <span key={`el-${i}`} className="flex h-8 w-6 items-center justify-center text-xs text-gray-400">\u2026</span>
            ) : (
              <button key={p} onClick={() => onPage(p as number)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  p === page ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}>
                {(p as number) + 1}
              </button>
            )
          )}
        </div>
        <button onClick={() => onPage(page + 1)} disabled={page === pageCount - 1}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/10">
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function KelasSection({ kelas, siswas, onEdit, onDetail, onResetPassword, canResetPassword, selectedIds, onToggle, onToggleAll }: {
  kelas: string; siswas: Siswa[]; onEdit: (s: Siswa) => void; onDetail: (s: Siswa) => void;
  onResetPassword: (s: Siswa) => void; canResetPassword: boolean;
  selectedIds: Set<string>; onToggle: (id: string) => void; onToggleAll: (ids: string[]) => void;
}) {
  const [page, setPage] = useState(0);
  const ac = KELAS_COLOR[kelas] ?? DEFAULT_AC;
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const waliKelas = siswas[0]?.kelas.waliKelasGuru?.user.nama;
  const pageIds = pageItems.map((s) => s.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const selectedInPage = pageIds.filter((id) => selectedIds.has(id)).length;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
      <div className="flex items-center justify-between overflow-hidden rounded-t-2xl px-5 py-3.5"
        style={{ borderBottom: `1px solid ${ac.main}20`, background: `linear-gradient(90deg, ${ac.main}08 0%, transparent 100%)` }}>
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ac.main }} />
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{kelasShort(kelas)}</p>
            {waliKelas && <p className="text-[11px] text-gray-400 dark:text-slate-500">Wali: {waliKelas}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedInPage > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary dark:bg-primary/20">
              {selectedInPage} dipilih
            </span>
          )}
          <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: ac.light, color: ac.text }}>{siswas.length} siswa</span>
        </div>
      </div>
      <div className="overflow-x-auto px-3 pb-3">
        <div className="min-w-[860px]">
          <TableHead isFlat={false} allChecked={allChecked} onToggleAll={() => onToggleAll(pageIds)} />
          <div className="flex flex-col gap-2">
            {pageItems.map((s, i) => (
              <SiswaRow key={s.id} siswa={s} isFlat={false} onEdit={onEdit} onDetail={onDetail} onResetPassword={onResetPassword} canResetPassword={canResetPassword}
                index={i} rowNumber={page * PAGE_SIZE + i + 1}
                checked={selectedIds.has(s.id)} onCheck={() => onToggle(s.id)} />
            ))}
          </div>
        </div>
      </div>
      {pageCount > 1 && <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />}
    </motion.div>
  );
}

function FlatTable({ siswas, onEdit, onDetail, onResetPassword, canResetPassword, selectedIds, onToggle, onToggleAll }: {
  siswas: Siswa[]; onEdit: (s: Siswa) => void; onDetail: (s: Siswa) => void;
  onResetPassword: (s: Siswa) => void; canResetPassword: boolean;
  selectedIds: Set<string>; onToggle: (id: string) => void; onToggleAll: (ids: string[]) => void;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageIds = pageItems.map((s) => s.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 overflow-hidden rounded-t-2xl border-b border-primary/15 bg-primary/4 px-4 py-2.5 dark:border-primary/20 dark:bg-primary/8">
          <span className="text-xs font-semibold text-primary">{selectedIds.size} siswa dipilih</span>
          <button onClick={() => onToggleAll([])}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
            Batal pilih
          </button>
        </div>
      )}
      <div className="overflow-x-auto px-3 pb-3">
        <div className="min-w-[940px]">
          <TableHead isFlat={true} allChecked={allChecked} onToggleAll={() => onToggleAll(pageIds)} />
          <div className="flex flex-col gap-2">
            {pageItems.map((s, i) => (
              <SiswaRow key={s.id} siswa={s} isFlat={true} onEdit={onEdit} onDetail={onDetail} onResetPassword={onResetPassword} canResetPassword={canResetPassword}
                index={i} rowNumber={page * PAGE_SIZE + i + 1}
                checked={selectedIds.has(s.id)} onCheck={() => onToggle(s.id)} />
            ))}
          </div>
        </div>
      </div>
      {pageCount > 1 && <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />}
    </div>
  );
}

export default function AdminDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [editTarget, setEditTarget] = useState<Siswa | null>(null);
  const [detailSiswa, setDetailSiswa] = useState<Siswa | null>(null);
  const [resetTarget, setResetTarget] = useState<Siswa | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [canResetPassword, setCanResetPassword] = useState(false);

  useEffect(() => {
    fetch("/api/kelas").then((r) => r.json()).then((list) => setKelasList(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => setCanResetPassword(me?.loginId === SUPER_ADMIN_LOGIN_ID))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterKelas)   qs.set("kelasId",      filterKelas);
      if (filterJurusan) qs.set("jurusan",      filterJurusan);
      if (filterGender)  qs.set("jenisKelamin", filterGender);
      const res = await fetch(`/api/siswa?${qs}`);
      if (res.ok) setSiswaList(await res.json());
    } finally { setLoading(false); }
  }, [filterKelas, filterJurusan, filterGender]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayed = search
    ? siswaList.filter((s) => { const q = search.toLowerCase(); return getNama(s).toLowerCase().includes(q) || s.nis.includes(q); })
    : siswaList;

  function handleSaved() {
    fetchData();
    setEditTarget(null);
  }
  function toggleId(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleAll(ids: string[]) {
    setSelectedIds((prev) => {
      if (ids.length === 0) return new Set();
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id)); else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  const isFiltered = !!(search || filterKelas || filterJurusan || filterGender);
  const kelasNamaOrder = kelasList.map((k) => k.nama).sort();
  const groupedByKelas = kelasNamaOrder.reduce<Record<string, Siswa[]>>((acc, k) => {
    acc[k] = displayed.filter((s) => s.kelas.nama === k); return acc;
  }, {});
  const totalL = siswaList.filter((s) => s.jenisKelamin === "Laki-laki").length;
  const totalP = siswaList.filter((s) => s.jenisKelamin === "Perempuan").length;
  const kelasSet = new Set(siswaList.map((s) => s.kelas.nama));

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
        style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 left-1/3 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <span>Admin Panel</span><ChevronRight size={11} /><span className="text-white/90">Data Siswa</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
                <Users size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">Data Siswa</h1>
                <p className="mt-0.5 text-sm text-white/70">Kelola data seluruh peserta didik</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <LiveClock />
            <div className="flex flex-wrap justify-end gap-2">
              {[
                { icon: Users,        label: `${loading ? "\u2014" : siswaList.length} Total` },
                { icon: User,         label: `${loading ? "\u2014" : totalL} Laki-laki` },
                { icon: User,         label: `${loading ? "\u2014" : totalP} Perempuan` },
                { icon: GraduationCap,label: `${loading ? "\u2014" : kelasSet.size} Kelas` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  <Icon size={12} className="text-white/70" />{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-48 sm:flex-1">
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau NIS\u2026"
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500" />
          <AnimatePresence>
            {search && (
              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <select value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)}
          className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 shadow-sm focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto">
          <option value="">Semua Jurusan</option>
          {JURUSAN_OPTIONS.map((j) => <option key={j}>{j}</option>)}
        </select>
        <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}
          className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 shadow-sm focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto">
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
        </select>
        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
          className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 shadow-sm focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto">
          <option value="">Semua Gender</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
        <AnimatePresence>
          {isFiltered && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { setSearch(""); setFilterKelas(""); setFilterJurusan(""); setFilterGender(""); }}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-4 text-sm font-medium text-red-500 hover:bg-red-100 sm:w-auto">
              <X size={13} /> Reset
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        {!loading && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {isFiltered
              ? <><span className="font-semibold text-gray-700 dark:text-slate-300">{displayed.length}</span> siswa ditemukan</>
              : <>Total <span className="font-semibold text-gray-700 dark:text-slate-300">{siswaList.length}</span> siswa \u00b7 <span className="font-semibold text-gray-700 dark:text-slate-300">{kelasSet.size}</span> kelas</>
            }
          </p>
        )}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary dark:bg-primary/20">
              <span>{selectedIds.size} dipilih</span>
              <button onClick={() => setSelectedIds(new Set())} className="ml-1 opacity-60 hover:opacity-100"><X size={11} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white py-24 text-center shadow-sm dark:border-slate-700/40 dark:bg-slate-900/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800">
            <Users size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Tidak ada siswa yang ditemukan</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Coba ubah filter atau kata kunci pencarian</p>
        </div>
      ) : isFiltered ? (
        <FlatTable siswas={displayed} onEdit={setEditTarget} onDetail={setDetailSiswa} onResetPassword={setResetTarget} canResetPassword={canResetPassword}
          selectedIds={selectedIds} onToggle={toggleId} onToggleAll={toggleAll} />
      ) : (
        <div className="space-y-4">
          {kelasNamaOrder.filter((k) => (groupedByKelas[k]?.length ?? 0) > 0).map((k) => (
            <KelasSection key={k} kelas={k} siswas={groupedByKelas[k]} onEdit={setEditTarget} onDetail={setDetailSiswa} onResetPassword={setResetTarget} canResetPassword={canResetPassword}
              selectedIds={selectedIds} onToggle={toggleId} onToggleAll={toggleAll} />
          ))}
        </div>
      )}

      {editTarget && <EditModal siswa={editTarget} kelasList={kelasList} onClose={() => setEditTarget(null)} onSave={handleSaved} />}

      {detailSiswa && (
        <SiswaDetailModal siswa={detailSiswa} ac={KELAS_COLOR[detailSiswa.kelas.nama] ?? DEFAULT_AC}
          onClose={() => setDetailSiswa(null)}
          onEdit={() => { setDetailSiswa(null); setEditTarget(detailSiswa); }} />
      )}

      {resetTarget?.user && canResetPassword && (
        <ResetPasswordModal
          userId={resetTarget.user.id}
          userName={toTitleCase(getNama(resetTarget))}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
