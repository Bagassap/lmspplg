"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, Users, Eye, Camera, PenTool, FileText,
  Settings2, X, Plus, Pencil, Trash2, GraduationCap, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { StatusBadge } from "@/components/absensi-harian/StatusBadge";
import { DokumenModal } from "@/components/absensi-harian/DokumenModal";
import { printAbsensiPDF } from "@/components/absensi-harian/printAbsensiPDF";
import { STATUS_CFG, CARD_GRADIENTS, getInitials, avatarColor, parseLokasi } from "@/components/absensi-harian/shared";
import type { Kelas, RekapKelas, SiswaAbsensi, StatusAbsensi } from "@/components/absensi-harian/types";

type Guru = { id: string; user: { id: string; nama: string } };

function KelolaKelasModal({ kelasList, guruList, onClose, onSaved }: {
  kelasList: Kelas[]; guruList: Guru[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<Kelas | null>(null);
  const [nama, setNama] = useState("");
  const [waliId, setWaliId] = useState("");
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing({ id: "", nama: "" });
    setNama("");
    setWaliId("");
  }
  function startEdit(k: Kelas) {
    setEditing(k);
    setNama(k.nama);
    setWaliId(k.waliKelasGuru?.user.id ?? "");
  }

  async function save() {
    if (!nama.trim()) { toast.error("Nama kelas wajib diisi", ""); return; }
    setSaving(true);
    try {
      const isNew = !editing?.id;
      const guruEntry = guruList.find((g) => g.user.id === waliId);
      const res = await fetch(isNew ? "/api/kelas" : `/api/kelas/${editing!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, waliKelasGuruId: guruEntry?.id || undefined }),
      });
      if (res.ok) {
        toast.success(isNew ? "Kelas ditambahkan" : "Kelas diperbarui", "");
        setEditing(null);
        onSaved();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menyimpan kelas", "");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(k: Kelas) {
    const res = await fetch(`/api/kelas/${k.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Kelas dihapus", ""); onSaved(); }
    else {
      const d = await res.json().catch(() => null);
      toast.error(d?.message ?? "Gagal menghapus kelas", "");
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        style={{ maxHeight: "88vh" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Settings2 size={16} className="text-violet-500" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">Kelola Kelas</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {editing ? (
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/40">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Nama Kelas</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: XII RPL 1"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Wali Kelas</label>
                <select value={waliId} onChange={(e) => setWaliId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                  <option value="">— Belum ditentukan —</option>
                  {guruList.map((g) => (
                    <option key={g.id} value={g.user.id}>{g.user.nama}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(null)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                  Batal
                </button>
                <button onClick={save} disabled={saving}
                  className="rounded-xl px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#6334F4,#4F46E5)" }}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={startCreate}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 hover:border-violet-400 hover:text-violet-500 dark:border-slate-600">
              <Plus size={14} /> Tambah Kelas
            </button>
          )}

          <div className="mt-3 space-y-2">
            {kelasList.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 dark:border-slate-700/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{k.nama}</p>
                  <p className="truncate text-[11px] text-slate-400">
                    {k.waliKelasGuru?.user.nama ?? "Belum ada wali kelas"} · {k._count?.siswa ?? 0} siswa
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => startEdit(k)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(k)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {kelasList.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">Belum ada kelas</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminAbsensiHarianPage() {
  const toast = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [rekapAll, setRekapAll] = useState<RekapKelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [dokumenSiswa, setDokumenSiswa] = useState<SiswaAbsensi | null>(null);
  const [showKelola, setShowKelola] = useState(false);
  const [kelasPage, setKelasPage] = useState(0);
  const KELAS_PER_PAGE = 4;

  const loadKelasList = useCallback(async () => {
    const res = await fetch("/api/kelas");
    const list = await res.json().catch(() => []);
    setKelasList(Array.isArray(list) ? list : []);
  }, []);

  const loadGuruList = useCallback(async () => {
    const res = await fetch("/api/kelas/guru-list");
    const list = await res.json().catch(() => []);
    setGuruList(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => { loadKelasList(); loadGuruList(); }, [loadKelasList, loadGuruList]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(kelasList.length / KELAS_PER_PAGE) - 1);
    setKelasPage((p) => Math.min(p, maxPage));
  }, [kelasList.length]);

  const loadRekap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi-harian?tanggal=${tanggal}`);
      const data = await res.json().catch(() => []);
      const list: RekapKelas[] = Array.isArray(data) ? data : [];
      setRekapAll(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].kelasId);
    } catch {
      toast.error("Gagal memuat data absensi", "");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  const selected = rekapAll.find((r) => r.kelasId === selectedId) ?? null;
  const siswaList = selected?.siswa ?? [];
  const rekap = selected?.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
  const total = siswaList.length;
  const sudahAbsen = siswaList.filter((s) => s.status !== null).length;
  const hadirPct = total > 0 ? Math.round((rekap.HADIR / total) * 100) : 0;

  return (
    <>
      <div className="space-y-5 p-1">
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "linear-gradient(135deg,#6334F4 0%,#8B5CF6 40%,#EC4899 80%,#F97316 100%)" }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <ClipboardCheck size={26} className="text-white" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Presensi Wajib Harian</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Admin</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi Harian</h1>
                <p className="mt-0.5 text-sm text-white/70">Pantau kehadiran seluruh siswa setiap kelas</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setShowKelola(true)}
                className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25">
                <Settings2 size={14} /> Kelola Kelas
              </button>
              <LiveClock />
            </div>
          </div>
        </div>

        {kelasList.length > KELAS_PER_PAGE && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-400">
              Kelas {kelasPage * KELAS_PER_PAGE + 1}
              –{Math.min((kelasPage + 1) * KELAS_PER_PAGE, kelasList.length)} dari {kelasList.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setKelasPage((p) => Math.max(0, p - 1))}
                disabled={kelasPage === 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() =>
                  setKelasPage((p) =>
                    (p + 1) * KELAS_PER_PAGE < kelasList.length ? p + 1 : p,
                  )
                }
                disabled={(kelasPage + 1) * KELAS_PER_PAGE >= kelasList.length}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kelasList.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl" style={{ background: CARD_GRADIENTS[i], opacity: 0.4 }} />
              ))
            : kelasList.slice(kelasPage * KELAS_PER_PAGE, kelasPage * KELAS_PER_PAGE + KELAS_PER_PAGE).map((k, i) => {
                const r = rekapAll.find((x) => x.kelasId === k.id);
                const hd = r?.rekap.HADIR ?? 0;
                const tt = r?.siswa.length ?? k._count?.siswa ?? 0;
                return (
                  <motion.div key={k.id} onClick={() => setSelectedId(k.id)}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.35, delay: 0.03 * i, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex h-40 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all"
                    style={{
                      background: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                      outline: selectedId === k.id ? "3px solid white" : "3px solid transparent",
                      boxShadow: selectedId === k.id
                        ? "0 0 0 5px rgba(255,255,255,0.30),0 8px 32px rgba(0,0,0,0.18)"
                        : "0 4px 16px rgba(0,0,0,0.10)",
                    }}>
                    <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Kelas</p>
                        <p className="mt-0.5 text-sm font-bold text-white">{k.nama}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <GraduationCap size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-3xl font-bold text-white">
                        {hd}<span className="ml-1 text-base font-semibold text-white/60">/ {tt}</span>
                      </p>
                      <p className="text-[11px] text-white/70 mt-0.5">siswa hadir hari ini</p>
                    </div>
                    <p className="relative text-[11px] font-semibold text-white/80 truncate">
                      Wali: {k.waliKelasGuru?.user.nama ?? "—"}
                    </p>
                  </motion.div>
                );
              })}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</span>
          </div>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <div className="flex-1" />
          <span className="text-xs text-slate-400">{sudahAbsen}/{total} sudah absen</span>
          <button onClick={() => printAbsensiPDF({
            siswaList, kelasNama: selected?.kelas.nama ?? "", tanggal, rekap, total,
          })} disabled={siswaList.length === 0}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-white disabled:opacity-40 transition-all hover:brightness-95 shrink-0"
            style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
            <FileText size={13} /> PDF
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["HADIR", "IZIN", "SAKIT", "ALPA"] as StatusAbsensi[]).map((key) => {
            const cfg = STATUS_CFG[key];
            const Icon = cfg.icon;
            const pct = total > 0 ? Math.round((rekap[key] / total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm" style={{ backgroundColor: cfg.bg }}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: cfg.darkBg }}>
                  <Icon size={20} style={{ color: cfg.clr }} />
                </div>
                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="text-2xl font-black leading-none" style={{ color: cfg.clr }}>{rekap[key]}</span>
                  <span className="text-sm font-bold" style={{ color: cfg.clr }}>{cfg.label}</span>
                </div>
                <div className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold" style={{ backgroundColor: cfg.darkBg, color: cfg.clr }}>
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : siswaList.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Users size={24} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Belum ada siswa di kelas ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-190 divide-y divide-slate-50 dark:divide-slate-700/30">
                {siswaList.map((s, idx) => {
                  const ac = avatarColor(s.nama);
                  const hasDok = !!(s.ttd || s.lokasi || s.foto);
                  const lokasiParsed = parseLokasi(s.lokasi);
                  return (
                    <motion.div key={s.siswaId}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                      className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                      style={{ gridTemplateColumns: "28px 40px 2fr 1.2fr 1fr 1fr 1.4fr 60px 60px 72px" }}>
                      <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{idx + 1}</span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-extrabold text-white shrink-0" style={{ backgroundColor: ac }}>
                        {getInitials(s.nama)}
                      </div>
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{s.nama}</p>
                      <p className="truncate font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">{s.nis ?? "—"}</p>
                      <StatusBadge status={s.status} />
                      <span className="text-center text-sm font-mono text-slate-500">{s.waktuAbsen ?? "—"}</span>
                      <div className="min-w-0">
                        {lokasiParsed ? (
                          <span className="text-[11px] font-mono text-blue-500 truncate block">{lokasiParsed.lat.slice(0, 8)}…</span>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        {s.foto ? <Camera size={13} className="text-emerald-500" /> : <Camera size={13} className="text-slate-200 dark:text-slate-700" />}
                      </div>
                      <div className="flex justify-center">
                        {s.ttd ? <PenTool size={13} className="text-violet-500" /> : <PenTool size={13} className="text-slate-200 dark:text-slate-700" />}
                      </div>
                      <div className="flex justify-end">
                        {hasDok ? (
                          <button onClick={() => setDokumenSiswa(s)}
                            className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
                            style={{ background: "linear-gradient(135deg,#6334F4,#4F8EF7)" }}>
                            <Eye size={11} /> Lihat
                          </button>
                        ) : <span />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {dokumenSiswa && (
          <DokumenModal siswa={dokumenSiswa} tanggal={tanggal} kelas={selected?.kelas.nama ?? ""} onClose={() => setDokumenSiswa(null)} />
        )}
        {showKelola && (
          <KelolaKelasModal kelasList={kelasList} guruList={guruList} onClose={() => setShowKelola(false)} onSaved={() => { loadKelasList(); loadRekap(); }} />
        )}
      </AnimatePresence>
    </>
  );
}
