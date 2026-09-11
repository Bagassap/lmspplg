"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Search, FileText, Download, Pencil, Trash2, Eye,
  AlertCircle, GraduationCap, CalendarDays,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { MateriFormModal, type MateriItem } from "./MateriFormModal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

const ROW_PALETTES = [
  { bar: "#0082FB", gradient: "#0082FB" },
  { bar: "#00D67F", gradient: "#00D67F" },
  { bar: "#EF4444", gradient: "#EF4444" },
  { bar: "#8A9E1F", gradient: "#C3F84A" },
  { bar: "#0064E0", gradient: "#0064E0" },
];
function rowPalette(i: number) { return ROW_PALETTES[i % ROW_PALETTES.length]; }

export function MateriListPage({
  embedded = false, currentUserId, currentUserRole, mapelOptions, canCreate = true,
  mobileNative = false, search: controlledSearch, onSearchChange: controlledOnSearchChange,
}: {
  embedded?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  mapelOptions?: string[];
  canCreate?: boolean;
  mobileNative?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
} = {}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const rolePrefix = pathname?.startsWith("/admin") ? "/admin" : "/guru";
  const canEdit = (m: MateriItem) => !currentUserRole || currentUserRole === "ADMIN" || m.createdBy.id === currentUserId;
  const [list, setList] = useState<MateriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch ?? internalSearch;
  const setSearch = controlledOnSearchChange ?? setInternalSearch;
  const [mapelFilter, setMapelFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MateriItem | null>(null);

  const fetchList = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  async function handleDelete(m: MateriItem) {
    if (!await toast.confirm("Hapus materi?", `"${m.judul}" akan dihapus permanen.`)) return;
    const res = await fetch(`/api/materi/${m.id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) => prev.filter((x) => x.id !== m.id));
      toast.success("Materi dihapus", m.judul);
    } else {
      toast.error("Gagal menghapus materi");
    }
  }

  const uniqueMapel = useMemo(() => Array.from(new Set(list.map((m) => m.mapel))).sort(), [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((m) => {
      if (mapelFilter && m.mapel !== mapelFilter) return false;
      if (!q) return true;
      return m.judul.toLowerCase().includes(q) ||
        m.mapel.toLowerCase().includes(q) ||
        m.kelasList.some((k) => k.nama.toLowerCase().includes(q));
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Manajemen Materi</span>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Materi Pembelajaran</h1>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-5 pt-5 pb-0" style={{ background: "rgba(0,130,251,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#0082FB" }}>
                <BookOpen size={14} className="text-white" />
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">Daftar Materi</p>
              <span className="ml-1 rounded-lg bg-[#0082FB]/10 px-2 py-0.5 text-[10px] font-bold text-[#0082FB]">{filtered.length} materi</span>
            </div>
            {canCreate && (
              <button onClick={() => { setEditItem(null); setModalOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white shadow-sm"
                style={{ background: "#0082FB" }}>
                <Plus size={13} /> Tambah Materi
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul materi, mapel, atau kelas..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:focus:ring-blue-900/30" />
          </div>
        </div>

        <AnimatePresence>
          {!canCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-[#F1F5F8] bg-[#F1F5F8] px-4 py-3 text-sm text-[#1C2B33] dark:border-[#1C2B33]/40 dark:bg-[#1C2B33]/20 dark:text-[#C3F84A]">
              <AlertCircle size={14} className="shrink-0" />
              Anda belum terdaftar sebagai pengampu mata pelajaran apa pun, jadi belum bisa menambahkan materi. Hubungi admin bila ini keliru.
            </motion.div>
          )}
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
              <p className="text-sm text-slate-400 mb-4">{search.trim() ? `Tidak ada materi dengan kata kunci "${search.trim()}"` : "Belum ada materi"}</p>
              {!search.trim() && canCreate && (
                <motion.button
                  onClick={() => { setEditItem(null); setModalOpen(true); }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="mx-auto flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white"
                  style={{ background: "#0082FB" }}>
                  <Plus size={14} /> Tambah Materi Pertama
                </motion.button>
              )}
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-700/40 dark:bg-slate-700/60">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Materi</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Mata Pelajaran</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Kelas</th>
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
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {m.kelasList.length ? (
                          <div className="flex flex-wrap gap-1">
                            {m.kelasList.map((k) => (
                              <span key={k.id} className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                {k.nama}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "Semua Kelas"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{m.createdBy.nama}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(m.createdAt)}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => router.push(`${rolePrefix}/materi/${m.id}`)} title="Lihat materi"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20">
                            <Eye size={14} />
                          </button>
                          {m.fileUrl && (
                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" title="Unduh file"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20">
                              <Download size={14} />
                            </a>
                          )}
                          {canEdit(m) && (
                            <>
                              <button onClick={() => { setEditItem(m); setModalOpen(true); }} title="Edit"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-[#F1F5F8] hover:text-[#C3F84A] dark:hover:bg-[#1C2B33]/20">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDelete(m)} title="Hapus"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                                <Trash2 size={14} />
                              </button>
                            </>
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

      {mobileNative && (
        <div className="relative isolate -mx-4 space-y-3 lg:hidden">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{filtered.length} materi</span>
            {canCreate && (
              <button type="button" onClick={() => { setEditItem(null); setModalOpen(true); }}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                style={{ background: "#0082FB" }}>
                <Plus size={13} /> Tambah
              </button>
            )}
          </div>

          {uniqueMapel.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            {!canCreate && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-2xl border border-[#F1F5F8] bg-[#F1F5F8] px-4 py-3 text-sm text-[#1C2B33] dark:border-[#1C2B33]/40 dark:bg-[#1C2B33]/20 dark:text-[#C3F84A]">
                <AlertCircle size={14} className="shrink-0" />
                Anda belum terdaftar sebagai pengampu mata pelajaran apa pun, jadi belum bisa menambahkan materi.
              </motion.div>
            )}
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
              <p className="mt-4 text-sm text-slate-400">{search.trim() ? `Tidak ada materi dengan kata kunci "${search.trim()}"` : "Belum ada materi"}</p>
              {!search.trim() && canCreate && (
                <motion.button onClick={() => { setEditItem(null); setModalOpen(true); }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-4 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white"
                  style={{ background: "#0082FB" }}>
                  <Plus size={14} /> Tambah Materi Pertama
                </motion.button>
              )}
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="space-y-2.5">
              {filtered.map((m, idx) => {
                const accent = idx % 2 === 0;
                return (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className={`relative overflow-hidden rounded-[22px] p-4 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.10)] ${accent ? "" : "bg-white dark:bg-[#1C2B33]"}`}
                    style={accent ? { backgroundColor: "#0082FB" } : undefined}>
                    {accent && <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />}
                    <div className="relative flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: accent ? "rgba(255,255,255,0.2)" : "#0082FB18" }}>
                        <FileText size={18} style={{ color: accent ? "#fff" : "#0082FB" }} />
                      </span>
                      <div className="min-w-0 flex-1">
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
                    </div>
                    <div className={`relative mt-3 flex items-center justify-between gap-2 border-t pt-3 ${accent ? "border-white/20" : "border-black/[0.06] dark:border-slate-700/50"}`}>
                      <span className={`truncate text-[10.5px] ${accent ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                        {m.createdBy.nama}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => router.push(`${rolePrefix}/materi/${m.id}`)} title="Lihat materi"
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${accent ? "text-white/85 hover:bg-white/20" : "text-slate-400 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20"}`}>
                          <Eye size={14} />
                        </button>
                        {m.fileUrl && (
                          <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" title="Unduh file"
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${accent ? "text-white/85 hover:bg-white/20" : "text-slate-400 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20"}`}>
                            <Download size={14} />
                          </a>
                        )}
                        {canEdit(m) && (
                          <>
                            <button type="button" onClick={() => { setEditItem(m); setModalOpen(true); }} title="Edit"
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${accent ? "text-white/85 hover:bg-white/20" : "text-slate-400 hover:bg-[#F1F5F8] hover:text-[#8A9E1F] dark:hover:bg-[#1C2B33]/20"}`}>
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => handleDelete(m)} title="Hapus"
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${accent ? "text-white/85 hover:bg-white/20" : "text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"}`}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <MateriFormModal
        open={modalOpen}
        materi={editItem}
        mapelOptions={mapelOptions}
        onClose={() => setModalOpen(false)}
        onSaved={(saved) => {
          setList((prev) => {
            const exists = prev.some((x) => x.id === saved.id);
            return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
          });
        }}
      />
    </div>
  );
}
