"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, Users, Eye, Camera, PenTool, FileText, Save, GraduationCap, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LiveClock } from "@/components/shared/LiveClock";
import { DokumenModal } from "@/components/absensi-harian/DokumenModal";
import { downloadAbsensiPdf } from "@/components/absensi-harian/downloadAbsensiPdf";
import { STATUS_CFG, PULANG_CFG, CARD_GRADIENTS, getInitials, avatarColor, parseLokasi } from "@/components/absensi-harian/shared";
import type { Kelas, RekapKelas, SiswaAbsensi, StatusAbsensi, FilterAbsensi } from "@/components/absensi-harian/types";

const TABLE_PAGE_SIZE = 10;

export default function GuruAbsensiHarianPage() {
  const toast = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<RekapKelas | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, StatusAbsensi>>({});
  const [dokumenSiswa, setDokumenSiswa] = useState<SiswaAbsensi | null>(null);
  const [dokumenSource, setDokumenSource] = useState<"hadir" | "pulang">("hadir");
  const [activeFilter, setActiveFilter] = useState<FilterAbsensi | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch("/api/kelas/saya")
      .then((r) => r.json())
      .then((list: Kelas[]) => {
        setKelasList(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadRekap = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi-harian?kelasId=${selectedId}&tanggal=${tanggal}`);
      const list = await res.json().catch(() => []);
      const d: RekapKelas | undefined = Array.isArray(list) ? list[0] : undefined;
      setData(d ?? null);
      const init: Record<string, StatusAbsensi> = {};
      d?.siswa.forEach((s) => { if (s.status) init[s.siswaId] = s.status; });
      setDraft(init);
    } catch {
      toast.error("Gagal memuat data absensi", "");
    } finally {
      setLoading(false);
    }
  }, [selectedId, tanggal]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    const absensi = Object.entries(draft).map(([siswaId, status]) => ({ siswaId, status }));
    try {
      const r = await fetch("/api/absensi-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasId: selectedId, tanggal, absensi }),
      });
      if (r.ok) { toast.success("Absensi disimpan!", ""); loadRekap(); }
      else {
        const d = await r.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menyimpan absensi", "");
      }
    } finally {
      setSaving(false);
    }
  }

  function setAllHadir() {
    if (!data) return;
    const next: Record<string, StatusAbsensi> = {};
    data.siswa.forEach((s) => { next[s.siswaId] = "HADIR"; });
    setDraft(next);
  }

  useEffect(() => { setTablePage(0); }, [selectedId, tanggal, activeFilter]);

  const selectedKelas = kelasList.find((k) => k.id === selectedId);
  const siswaList = data?.siswa ?? [];
  const rekap = data?.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
  const pulangCount = data?.pulangCount ?? 0;
  const total = siswaList.length;
  const sudahAbsen = siswaList.filter((s) => s.status !== null).length;
  const hadirPct = total > 0 ? Math.round((rekap.HADIR / total) * 100) : 0;
  const terisi = Object.keys(draft).length;

  const filteredSiswa = !activeFilter
    ? siswaList
    : activeFilter === "PULANG"
      ? siswaList.filter((s) => !!s.waktuPulang)
      : siswaList.filter((s) => s.status === activeFilter);
  const tablePageCount = Math.max(1, Math.ceil(filteredSiswa.length / TABLE_PAGE_SIZE));
  const pagedSiswa = filteredSiswa.slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE);

  function toggleFilter(key: FilterAbsensi) {
    setActiveFilter((prev) => (prev === key ? null : key));
  }

  async function handleDownloadPdf() {
    if (!selectedId) return;
    setPdfLoading(true);
    try {
      const result = await downloadAbsensiPdf({
        kelasId: selectedId, tanggal, kelasNama: selectedKelas?.nama ?? "Kelas",
      });
      if (!result.ok) toast.error("Gagal membuat PDF", result.message);
    } finally {
      setPdfLoading(false);
    }
  }

  if (kelasList.length === 0) {
    return (
      <div className="space-y-5 p-1">
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ClipboardCheck size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi Harian</h1>
              <p className="mt-0.5 text-sm text-white/70">Presensi kehadiran harian siswa</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
            <GraduationCap size={24} className="text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Anda belum menjadi wali kelas manapun</p>
          <p className="max-w-sm text-xs text-slate-400">Hubungi admin untuk ditetapkan sebagai wali kelas agar dapat mengelola absensi harian.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 p-1">
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
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
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Wali Kelas</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-white">Absensi Harian</h1>
                <p className="mt-0.5 text-sm text-white/70">Catat kehadiran siswa di kelas yang Anda wali-i</p>
              </div>
            </div>
            <LiveClock />
          </div>
        </div>

        {kelasList.length > 1 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kelasList.map((k, i) => (
              <motion.div key={k.id} onClick={() => setSelectedId(k.id)}
                whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="relative flex h-32 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all"
                style={{
                  background: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                  outline: selectedId === k.id ? "3px solid white" : "3px solid transparent",
                }}>
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Kelas</p>
                <p className="text-sm font-bold text-white">{k.nama}</p>
                <p className="text-[11px] text-white/70">{k._count?.siswa ?? 0} siswa</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</span>
          </div>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <div className="flex-1" />
          <span className="text-xs text-slate-400">{sudahAbsen}/{total} sudah absen</span>
          <button onClick={setAllHadir}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all hover:brightness-95 shrink-0"
            style={{ backgroundColor: "#E8F8F1", color: "#10B981", borderColor: "#10B98140" }}>
            Hadir Semua
          </button>
          <button onClick={handleDownloadPdf}
            disabled={siswaList.length === 0 || pdfLoading}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-white disabled:opacity-40 transition-all hover:brightness-95 shrink-0"
            style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
            {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            {pdfLoading ? "Membuat PDF..." : "PDF"}
          </button>
          <button onClick={handleSave} disabled={saving || terisi === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50 transition-all hover:brightness-95 shrink-0"
            style={{ background: "linear-gradient(135deg,#6334F4,#4F46E5)" }}>
            <Save size={13} />{saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>

        {selectedKelas && (
          <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ background: CARD_GRADIENTS[0] }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 shadow-sm">
                  <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">Kelas Wali</p>
                  <p className="text-lg font-extrabold leading-tight text-white">{selectedKelas.nama}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-xl bg-white/20 px-3 py-1 text-lg font-extrabold text-white backdrop-blur-sm">{hadirPct}%</span>
                <span className="text-[10px] text-white/60">{sudahAbsen}/{total} hadir</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {(["HADIR", "PULANG", "IZIN", "SAKIT", "ALPA"] as FilterAbsensi[]).map((key, i) => {
            const cfg = key === "PULANG" ? PULANG_CFG : STATUS_CFG[key];
            const Icon = cfg.icon;
            const count = key === "PULANG" ? pulangCount : rekap[key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const active = activeFilter === key;
            return (
              <button key={key} type="button" onClick={() => toggleFilter(key)}
                className={`flex min-w-0 items-center gap-2 rounded-2xl px-3 py-3 text-left shadow-sm transition-all sm:gap-3 sm:px-4 sm:py-3.5 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
                style={{
                  backgroundColor: cfg.bg,
                  outline: active ? `2px solid ${cfg.clr}` : "2px solid transparent",
                  outlineOffset: active ? "2px" : "0",
                }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11" style={{ backgroundColor: cfg.darkBg }}>
                  <Icon size={18} className="sm:hidden" style={{ color: cfg.clr }} />
                  <Icon size={20} className="hidden sm:block" style={{ color: cfg.clr }} />
                </div>
                <div className="flex min-w-0 flex-1 items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl font-black leading-none sm:text-2xl" style={{ color: cfg.clr }}>{count}</span>
                  <span className="truncate text-xs font-bold sm:text-sm" style={{ color: cfg.clr }}>{cfg.label}</span>
                </div>
                <div className="shrink-0 rounded-lg px-1.5 py-1 text-[9px] font-extrabold sm:px-2 sm:text-[10px]" style={{ backgroundColor: cfg.darkBg, color: cfg.clr }}>
                  {pct}%
                </div>
              </button>
            );
          })}
        </div>
        {activeFilter && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Menampilkan siswa dengan status</span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
              style={{ backgroundColor: (activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).darkBg, color: (activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).clr }}>
              {(activeFilter === "PULANG" ? PULANG_CFG : STATUS_CFG[activeFilter]).label}
            </span>
            <button onClick={() => setActiveFilter(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              (tampilkan semua)
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-7 w-32 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
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
          ) : filteredSiswa.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Users size={24} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Tidak ada siswa dengan status ini</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-225">
                  <div className="grid items-center gap-3 border-b border-slate-100 px-5 py-2.5 dark:border-slate-700/40"
                    style={{ gridTemplateColumns: "28px 40px 2fr 1.2fr 2.4fr 1fr 1.4fr 60px 60px 84px" }}>
                    <span />
                    <span />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nama</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">NIS</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</span>
                    <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Waktu</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lokasi</span>
                    <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Foto</span>
                    <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">TTD</span>
                    <span className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Aksi</span>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                  {pagedSiswa.map((s, idx) => {
                    const ac = avatarColor(s.nama);
                    const isPulangView = activeFilter === "PULANG";
                    const waktu = isPulangView ? s.waktuPulang : s.waktuAbsen;
                    const lokasiRaw = isPulangView ? s.lokasiPulang : s.lokasi;
                    const fotoRaw = isPulangView ? s.fotoPulang : s.foto;
                    const ttdRaw = isPulangView ? s.ttdPulang : s.ttd;
                    const hasDok = !!(ttdRaw || lokasiRaw || fotoRaw);
                    const lokasiParsed = parseLokasi(lokasiRaw);
                    const cur = draft[s.siswaId] ?? s.status;
                    const openDokumen = () => { setDokumenSiswa(s); setDokumenSource(isPulangView ? "pulang" : "hadir"); };
                    return (
                      <motion.div key={s.siswaId}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                        className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                        style={{ gridTemplateColumns: "28px 40px 2fr 1.2fr 2.4fr 1fr 1.4fr 60px 60px 84px" }}>
                        <span className="text-center text-[11px] font-bold text-slate-300 dark:text-slate-600">{tablePage * TABLE_PAGE_SIZE + idx + 1}</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-extrabold text-white shrink-0" style={{ backgroundColor: ac }}>
                          {getInitials(s.nama)}
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{s.nama}</p>
                        <p className="truncate font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">{s.nis ?? "—"}</p>
                        {isPulangView ? (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ backgroundColor: PULANG_CFG.bg, color: PULANG_CFG.clr }}>
                            <PULANG_CFG.icon size={10} /> Pulang
                          </span>
                        ) : (
                          <div className="flex gap-1">
                            {(["HADIR", "IZIN", "SAKIT", "ALPA"] as StatusAbsensi[]).map((st) => {
                              const cfg = STATUS_CFG[st];
                              const active = cur === st;
                              return (
                                <button key={st} onClick={() => setDraft((p) => ({ ...p, [s.siswaId]: st }))}
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg border transition-all hover:scale-105"
                                  style={{
                                    backgroundColor: active ? cfg.bg : "transparent",
                                    color: active ? cfg.clr : "#94a3b8",
                                    borderColor: active ? cfg.clr + "60" : "#e2e8f040",
                                  }}>
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <span className="text-center text-sm font-mono text-slate-500">{waktu ?? "—"}</span>
                        <div className="min-w-0">
                          {lokasiParsed ? (
                            <button onClick={openDokumen} title="Lihat lokasi absen"
                              className="block max-w-full truncate text-left font-mono text-[11px] text-blue-500 hover:underline">
                              {lokasiParsed.lat.slice(0, 8)}…
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-300">—</span>
                          )}
                        </div>
                        <div className="flex justify-center">
                          {fotoRaw ? (
                            <button onClick={openDokumen} title="Lihat foto selfie"
                              className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                              <Camera size={13} className="text-emerald-500" />
                            </button>
                          ) : <Camera size={13} className="text-slate-200 dark:text-slate-700" />}
                        </div>
                        <div className="flex justify-center">
                          {ttdRaw ? (
                            <button onClick={openDokumen} title="Lihat tanda tangan"
                              className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20">
                              <PenTool size={13} className="text-violet-500" />
                            </button>
                          ) : <PenTool size={13} className="text-slate-200 dark:text-slate-700" />}
                        </div>
                        <div className="flex justify-end">
                          {hasDok ? (
                            <button onClick={openDokumen}
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
              </div>
              {filteredSiswa.length > TABLE_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/40 px-5 py-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {tablePage * TABLE_PAGE_SIZE + 1}–{Math.min((tablePage + 1) * TABLE_PAGE_SIZE, filteredSiswa.length)} dari {filteredSiswa.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setTablePage((p) => Math.max(0, p - 1))} disabled={tablePage === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tablePage + 1}/{tablePageCount}</span>
                    <button onClick={() => setTablePage((p) => Math.min(tablePageCount - 1, p + 1))} disabled={tablePage >= tablePageCount - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/40 px-5 py-3">
            <div className="text-xs text-slate-400 dark:text-slate-500">
              <span className="font-bold text-slate-600 dark:text-slate-300">{rekap.HADIR}</span>/{total} siswa hadir
              {terisi > 0 && <span className="ml-3 text-violet-500 font-semibold">{terisi} status siap disimpan</span>}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dokumenSiswa && (
          <DokumenModal siswa={dokumenSiswa} tanggal={tanggal} kelas={selectedKelas?.nama ?? ""} source={dokumenSource} onClose={() => setDokumenSiswa(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
