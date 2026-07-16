"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, X, ChevronRight, ChevronLeft, ChevronDown,
  GraduationCap, User, Eye,
} from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";
import SiswaDetailModal from "@/components/data-siswa/SiswaDetailModal";

type KelasRef = { id: string; nama: string; waliKelasGuru?: { user: { id: string; nama: string } } | null };
type Siswa = {
  id: string; nis: string; nama: string | null; kelas: KelasRef;
  jurusan: string | null; angkatan: number; jenisKelamin: string | null;
  noHp: string | null; alamat: string | null; tempatLahir: string | null;
  tanggalLahir: string | null;
  user: { id: string; nama: string; email: string | null } | null;
};
type KelasAc = { main: string; light: string; text: string; dark: string };

const KELAS_COLOR: Record<string, KelasAc> = {
  "X Pengembangan Perangkat Lunak dan Gim 1": { main: "#977DFF", light: "#F0EDFF", text: "#5B3FBD", dark: "#6334F4" },
  "X Pengembangan Perangkat Lunak dan Gim 2": { main: "#0033FF", light: "#EBF0FF", text: "#002BD4", dark: "#0022CC" },
  "X Pengembangan Perangkat Lunak dan Gim 3": { main: "#6366F1", light: "#EDEFFF", text: "#4338CA", dark: "#4F46E5" },
  "XI Pengembangan Gim 1":                    { main: "#14B8A6", light: "#F0FDFA", text: "#0F766E", dark: "#0D9488" },
  "XI Rekayasa Perangkat Lunak 1":            { main: "#8B5CF6", light: "#F5F0FF", text: "#6D28D9", dark: "#7C3AED" },
  "XI Rekayasa Perangkat Lunak 2":            { main: "#EC4899", light: "#FDF2F8", text: "#9D174D", dark: "#DB2777" },
};
const DEFAULT_AC: KelasAc = { main: "#4F8EF7", light: "#EEF4FF", text: "#2563EB", dark: "#3B7CE8" };

const JURUSAN_OPTIONS = [
  "Pengembangan Perangkat Lunak dan Gim",
  "Pengembangan Gim",
  "Rekayasa Perangkat Lunak",
];

const COL_GROUPED = "minmax(0,2fr) minmax(0,0.8fr) minmax(0,0.85fr) minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,0.9fr) 72px";
const COL_FLAT = "minmax(0,1.8fr) minmax(0,0.75fr) minmax(0,0.8fr) minmax(0,0.75fr) minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,0.85fr) 72px";
const PAGE_SIZE = 10;

function getNama(s: Siswa): string { return s.nama ?? s.user?.nama ?? "—"; }
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
function formatTglShort(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function TableHead({ isFlat }: { isFlat: boolean }) {
  const colTemplate = isFlat ? COL_FLAT : COL_GROUPED;
  const dataCols = isFlat
    ? ["Nama Siswa", "NIS", "Kelas", "Jenis Kelamin", "Tempat, Tgl Lahir", "Alamat", "No. HP"]
    : ["Nama Siswa", "NIS", "Jenis Kelamin", "Tempat, Tgl Lahir", "Alamat", "No. HP"];
  return (
    <div
      className="border border-transparent pb-2 pt-3"
      style={{ display: "grid", gridTemplateColumns: colTemplate }}
    >
      {dataCols.map((col) => (
        <div key={col} className="flex items-center px-4 py-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {col}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-center px-3 py-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Detail
        </span>
      </div>
    </div>
  );
}

function SiswaRow({
  siswa, isFlat, onDetail, index,
}: {
  siswa: Siswa; isFlat: boolean; onDetail: (s: Siswa) => void; index: number;
}) {
  const ac = KELAS_COLOR[siswa.kelas.nama] ?? DEFAULT_AC;
  const displayNama = toTitleCase(getNama(siswa));
  const colTemplate = isFlat ? COL_FLAT : COL_GROUPED;
  const isP = siswa.jenisKelamin === "Perempuan";
  const isL = siswa.jenisKelamin === "Laki-laki";
  const tglLahir =
    [siswa.tempatLahir, formatTglShort(siswa.tanggalLahir)].filter(Boolean).join(", ") || "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.018, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onDetail(siswa)}
      whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
      className="cursor-pointer rounded-lg border border-slate-100 bg-white shadow-sm transition-all duration-150 hover:border-primary/25 dark:border-slate-700/50 dark:bg-[#1c2434]"
      style={{ display: "grid", gridTemplateColumns: colTemplate }}
    >
      <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white dark:ring-slate-800"
          style={{
            background: isP
              ? "linear-gradient(135deg,#EC4899,#9D174D)"
              : "linear-gradient(135deg,#4F8EF7,#3B7CE8)",
          }}
        >
          {getInitials(displayNama)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{displayNama}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Angkatan {siswa.angkatan}</p>
        </div>
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {siswa.nis}
        </span>
      </div>

      {isFlat && (
        <div className="flex min-w-0 items-center px-4 py-3.5">
          <span
            className="truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: ac.light, color: ac.text }}
          >
            {kelasShort(siswa.kelas.nama)}
          </span>
        </div>
      )}

      <div className="flex min-w-0 items-center px-4 py-3.5">
        {isP ? (
          <span className="inline-flex items-center rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-semibold text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">
            Perempuan
          </span>
        ) : isL ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            Laki-laki
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="truncate text-sm text-slate-500 dark:text-slate-400" title={tglLahir}>
          {tglLahir}
        </span>
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span
          className="truncate text-sm text-slate-500 dark:text-slate-400"
          title={siswa.alamat ?? ""}
        >
          {siswa.alamat ?? "—"}
        </span>
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="text-sm text-slate-500 dark:text-slate-400">{siswa.noHp ?? "—"}</span>
      </div>

      <div className="flex items-center justify-center px-3 py-3.5">
        <button
          onClick={(e) => { e.stopPropagation(); onDetail(siswa); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-primary-light hover:text-primary"
          title="Lihat Detail"
        >
          <Eye size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function PaginationBar({
  page, pageCount, total, onPage,
}: {
  page: number; pageCount: number; total: number; onPage: (p: number) => void;
}) {
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  const pages: (number | "…")[] = [];
  if (pageCount <= 7) {
    for (let i = 0; i < pageCount; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 2) pages.push("…");
    for (let i = Math.max(1, page - 1); i <= Math.min(pageCount - 2, page + 1); i++) pages.push(i);
    if (page < pageCount - 3) pages.push("…");
    pages.push(pageCount - 1);
  }
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-700/40">
      <span className="text-xs text-slate-400 dark:text-slate-500">{start}–{end} dari {total}</span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPage(page - 1)} disabled={page === 0}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/10"
        >
          <ChevronLeft size={13} /> Previous
        </button>
        <div className="mx-1 flex items-center gap-0.5">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={i} className="px-1 text-xs text-slate-400">…</span>
            ) : (
              <button
                key={p} onClick={() => onPage(p as number)}
                className={`h-7 min-w-7 rounded-lg px-2 text-xs font-medium transition-all ${
                  p === page
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                {(p as number) + 1}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => onPage(page + 1)} disabled={page === pageCount - 1}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/10"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function KelasSection({
  kelas, siswas, onDetail,
}: {
  kelas: string; siswas: Siswa[]; onDetail: (s: Siswa) => void;
}) {
  const [page, setPage] = useState(0);
  const ac = KELAS_COLOR[kelas] ?? DEFAULT_AC;
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const waliKelas = siswas[0]?.kelas.waliKelasGuru?.user.nama;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]"
    >
      <div
        className="flex items-center justify-between overflow-hidden rounded-t-2xl px-5 py-3.5"
        style={{ borderBottom: `1px solid ${ac.main}20`, background: `linear-gradient(90deg, ${ac.main}08 0%, transparent 100%)` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ac.main }} />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{kelasShort(kelas)}</p>
            {waliKelas && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Wali: {waliKelas}</p>
            )}
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: ac.light, color: ac.text }}
        >
          {siswas.length} siswa
        </span>
      </div>
      <div className="overflow-x-auto px-3 pb-3">
        <div className="min-w-[760px]">
          <TableHead isFlat={false} />
          <div className="flex flex-col gap-2">
            {pageItems.map((s, i) => (
              <SiswaRow key={s.id} siswa={s} isFlat={false} onDetail={onDetail} index={i} />
            ))}
          </div>
        </div>
      </div>
      {pageCount > 1 && (
        <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />
      )}
    </motion.div>
  );
}

function FlatTable({ siswas, onDetail }: { siswas: Siswa[]; onDetail: (s: Siswa) => void }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(siswas.length / PAGE_SIZE);
  const pageItems = siswas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
      <div className="overflow-x-auto px-3 pb-3">
        <div className="min-w-[840px]">
          <TableHead isFlat={true} />
          <div className="flex flex-col gap-2">
            {pageItems.map((s, i) => (
              <SiswaRow key={s.id} siswa={s} isFlat={true} onDetail={onDetail} index={i} />
            ))}
          </div>
        </div>
      </div>
      {pageCount > 1 && (
        <PaginationBar page={page} pageCount={pageCount} total={siswas.length} onPage={setPage} />
      )}
    </div>
  );
}

export default function GuruDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [detailSiswa, setDetailSiswa] = useState<Siswa | null>(null);

  useEffect(() => {
    fetch("/api/kelas").then((r) => r.json()).then((list) => setKelasList(Array.isArray(list) ? list : [])).catch(() => {});
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
    } finally {
      setLoading(false);
    }
  }, [filterKelas, filterJurusan, filterGender]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayed = search
    ? siswaList.filter((s) => {
        const q = search.toLowerCase();
        return getNama(s).toLowerCase().includes(q) || s.nis.includes(q);
      })
    : siswaList;

  const isFiltered = !!(search || filterKelas || filterJurusan || filterGender);
  const kelasNamaOrder = kelasList.map((k) => k.nama).sort();
  const groupedByKelas = kelasNamaOrder.reduce<Record<string, Siswa[]>>((acc, k) => {
    acc[k] = displayed.filter((s) => s.kelas.nama === k);
    return acc;
  }, {});
  const totalL = siswaList.filter((s) => s.jenisKelamin === "Laki-laki").length;
  const totalP = siswaList.filter((s) => s.jenisKelamin === "Perempuan").length;
  const kelasSet = new Set(siswaList.map((s) => s.kelas.nama));

  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
        style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 left-1/3 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <span>Guru Panel</span>
              <ChevronRight size={11} />
              <span className="text-white/90">Data Siswa</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">Data Siswa</h1>
                <p className="mt-0.5 text-sm text-white/70">Lihat daftar seluruh peserta didik</p>
              </div>
            </div>
          </div>
          <LiveClock />
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {[
            { icon: Users, label: `${loading ? "—" : siswaList.length} Total` },
            { icon: User, label: `${loading ? "—" : totalL} Laki-laki` },
            { icon: User, label: `${loading ? "—" : totalP} Perempuan` },
            { icon: GraduationCap, label: `${loading ? "—" : kelasSet.size} Kelas` },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <Icon size={12} className="text-white/70" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-48 sm:flex-1">
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NIS…"
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filterJurusan}
            onChange={(e) => setFilterJurusan(e.target.value)}
            className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-slate-50 pl-4 pr-8 text-sm text-slate-600 shadow-sm focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto"
          >
            <option value="">Semua Jurusan</option>
            {JURUSAN_OPTIONS.map((j) => <option key={j}>{j}</option>)}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-slate-50 pl-4 pr-8 text-sm text-slate-600 shadow-sm focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => <option key={k.id} value={k.id}>{kelasShort(k.nama)}</option>)}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-slate-50 pl-4 pr-8 text-sm text-slate-600 shadow-sm focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-auto"
          >
            <option value="">Semua Gender</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <AnimatePresence>
          {isFiltered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { setSearch(""); setFilterKelas(""); setFilterJurusan(""); setFilterGender(""); }}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-4 text-sm font-medium text-red-500 hover:bg-red-100 sm:w-auto"
            >
              <X size={13} /> Reset
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {isFiltered ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{displayed.length}</span> siswa ditemukan
            </>
          ) : (
            <>
              Total{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{siswaList.length}</span> siswa ·{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{kelasSet.size}</span> kelas
            </>
          )}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-24 text-center shadow-sm dark:border-slate-700/50 dark:bg-[#1c2434]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
            <Users size={32} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Tidak ada siswa yang ditemukan
          </p>
        </div>
      ) : isFiltered ? (
        <FlatTable siswas={displayed} onDetail={setDetailSiswa} />
      ) : (
        <div className="space-y-4">
          {kelasNamaOrder.filter((k) => (groupedByKelas[k]?.length ?? 0) > 0).map((k) => (
            <KelasSection key={k} kelas={k} siswas={groupedByKelas[k]} onDetail={setDetailSiswa} />
          ))}
        </div>
      )}

      {detailSiswa && (
        <SiswaDetailModal
          siswa={detailSiswa}
          ac={KELAS_COLOR[detailSiswa.kelas.nama] ?? DEFAULT_AC}
          onClose={() => setDetailSiswa(null)}
        />
      )}
    </div>
  );
}
