"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, FileText, AlertCircle, GraduationCap, CalendarDays, ChevronRight,
} from "lucide-react";
import type { MateriItem } from "./MateriFormModal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

const ROW_PALETTES = [
  { bar: "#0082FB", gradient: "#0082FB", tint: "#EAF3FF" },
  { bar: "#0064E0", gradient: "#0064E0", tint: "#DCEBFF" },
  { bar: "#EF4444", gradient: "#EF4444", tint: "#FEE9EA" },
  { bar: "#8A9E1F", gradient: "#C3F84A", tint: "#F4FFD9" },
];
function rowPalette(i: number) { return ROW_PALETTES[i % ROW_PALETTES.length]; }

export function MateriSiswaPage({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [list, setList] = useState<MateriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mapelFilter, setMapelFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/materi");
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } catch {
        setError("Gagal memuat materi. Pastikan server berjalan.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uniqueMapel = useMemo(() => Array.from(new Set(list.map((m) => m.mapel))).sort(), [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((m) => {
      if (mapelFilter && m.mapel !== mapelFilter) return false;
      if (!q) return true;
      return m.judul.toLowerCase().includes(q) ||
        m.mapel.toLowerCase().includes(q) ||
        (m.deskripsi ?? "").toLowerCase().includes(q);
    });
  }, [list, search, mapelFilter]);

  return (
    <div className="space-y-5">
      <div className="hidden space-y-5 lg:block">
      {!embedded && (
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "#0082FB" }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <BookOpen size={26} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Belajar Mandiri</span>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Materi Pembelajaran</h1>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-5 pt-5 pb-0" style={{ background: "rgba(0,130,251,0.05)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#0082FB" }}>
              <BookOpen size={14} className="text-white" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">Daftar Materi</p>
            <span className="ml-1 rounded-lg bg-[#0082FB]/10 px-2 py-0.5 text-[10px] font-bold text-[#0082FB]">{filtered.length} materi</span>
          </div>
          <div className="relative mb-4">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul materi, mapel, atau deskripsi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:ring-blue-900/30" />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-h-[560px] overflow-auto">
          {loading && <div className="px-5 py-10 text-center text-sm text-slate-400">Memuat data...</div>}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-14 text-center">
              <BookOpen size={32} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">{search.trim() ? `Tidak ada materi dengan kata kunci "${search.trim()}"` : "Belum ada materi dari gurumu"}</p>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/40 sm:hidden">
              {filtered.map((m, idx) => {
                const rp = rowPalette(idx);
                return (
                  <div key={m.id} className="flex items-center gap-2.5 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: rp.gradient }}>
                      <FileText size={14} style={{ color: rp.gradient === "#C3F84A" ? "#1C2B33" : "#FFFFFF" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{m.judul}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          <GraduationCap size={9} /> {m.mapel}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500">
                          <CalendarDays size={9} />{formatDate(m.createdAt)}
                        </span>
                      </div>
                    </div>
                    {m.fileUrl ? (
                      <button onClick={() => router.push(`/siswa/materi/${m.id}`)} title="Buka Modul"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                        style={{ background: "#0082FB" }}>
                        <BookOpen size={14} />
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <table className="hidden w-full min-w-[720px] text-left text-sm sm:table">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-700/40 dark:bg-slate-700/60">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Materi</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Mata Pelajaran</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Dibuat Oleh</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tanggal Dibuat</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => {
                  const rp = rowPalette(idx);
                  return (
                    <tr key={m.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/40 dark:hover:bg-slate-700/20">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: rp.gradient }}>
                            <FileText size={13} style={{ color: rp.gradient === "#C3F84A" ? "#1C2B33" : "#FFFFFF" }} />
                          </div>
                          <p className="max-w-[220px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">{m.judul}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          <GraduationCap size={10} /> {m.mapel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{m.createdBy.nama}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(m.createdAt)}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center justify-end">
                          {m.fileUrl ? (
                            <button onClick={() => router.push(`/siswa/materi/${m.id}`)}
                              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105"
                              style={{ background: "#0082FB" }}>
                              <BookOpen size={12} /> Buka Modul
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul materi, mapel..."
            className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.05)] outline-none focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/15 dark:border-slate-700 dark:bg-[#1C2B33] dark:text-slate-200" />
        </div>

        {uniqueMapel.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={() => setMapelFilter(null)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-colors"
              style={mapelFilter === null ? { background: "#0082FB", color: "#fff" } : { background: "#fff", color: "#64748b" }}>
              Semua
            </button>
            {uniqueMapel.map((mp) => (
              <button key={mp} type="button" onClick={() => setMapelFilter(mp)}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-colors"
                style={mapelFilter === mp ? { background: "#0082FB", color: "#fff" } : { background: "#fff", color: "#64748b" }}>
                {mp}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="rounded-3xl bg-white py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1C2B33]">
            <p className="text-sm text-slate-400">Memuat data...</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:bg-[#1C2B33]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#0082FB18" }}>
              <BookOpen size={24} style={{ color: "#0082FB" }} />
            </div>
            <p className="mt-4 text-sm text-slate-400">{search.trim() ? `Tidak ada materi dengan kata kunci "${search.trim()}"` : "Belum ada materi dari gurumu"}</p>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2.5">
            {filtered.map((m, idx) => {
              const accent = idx % 2 === 0;
              return (
                <motion.button key={m.id} type="button"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  whileTap={m.fileUrl ? { scale: 0.97 } : undefined}
                  disabled={!m.fileUrl}
                  onClick={() => m.fileUrl && router.push(`/siswa/materi/${m.id}`)}
                  className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] p-4 text-left shadow-[0_4px_14px_-4px_rgba(0,0,0,0.10)] transition-shadow disabled:opacity-60 ${accent ? "" : "bg-white dark:bg-[#1C2B33]"}`}
                  style={accent ? { backgroundColor: "#0082FB" } : undefined}>
                  {accent && <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />}
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: accent ? "rgba(255,255,255,0.2)" : "#0082FB18" }}>
                    <FileText size={19} style={{ color: accent ? "#fff" : "#0082FB" }} />
                  </span>
                  <div className="relative min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${accent ? "text-white" : "text-slate-800 dark:text-white"}`}>{m.judul}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[9.5px] font-semibold ${accent ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                        <GraduationCap size={9} /> {m.mapel}
                      </span>
                      <span className={`flex items-center gap-1 text-[9.5px] font-medium ${accent ? "text-white/75" : "text-slate-500 dark:text-slate-400"}`}>
                        <CalendarDays size={9} />{formatDate(m.createdAt)}
                      </span>
                    </div>
                  </div>
                  {m.fileUrl && (
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: accent ? "rgba(255,255,255,0.2)" : "#0082FB14", color: accent ? "#fff" : "#0082FB" }}>
                      <ChevronRight size={15} />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
