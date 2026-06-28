"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, Clock, MapPin, User, CheckCircle,
  XCircle, AlertCircle, ChevronDown, Save, Users, Search,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

type StatusAbsensi = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

type Tahapan = {
  id: string; judul: string; tanggal: string;
  jamMulai: string; jamSelesai: string; lokasi: string; penguji?: string;
};

type SiswaAbsensi = {
  siswaId: string; nama: string;
  status: StatusAbsensi | null; waktuAbsen?: string;
};

type AbsensiData = {
  tahapanId: string; tahapan: Tahapan; tanggal: string;
  rekap: Record<StatusAbsensi, number>;
  siswa: SiswaAbsensi[];
};

const STATUS_CONFIG: Record<StatusAbsensi, { label: string; bg: string; clr: string; icon: React.ReactNode }> = {
  HADIR: { label: "Hadir",  bg: "#ECFDF5", clr: "#10B981", icon: <CheckCircle size={13}/> },
  IZIN:  { label: "Izin",   bg: "#EFF6FF", clr: "#3B82F6", icon: <AlertCircle size={13}/> },
  SAKIT: { label: "Sakit",  bg: "#FFF7ED", clr: "#F97316", icon: <AlertCircle size={13}/> },
  ALPA:  { label: "Alpa",   bg: "#FFF1F2", clr: "#F43F5E", icon: <XCircle size={13}/> },
};

function formatTgl(tgl?: string) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function GuruUkkAbsensiPage() {
  const toast = useToast();

  const [tahapanList, setTahapanList] = useState<Tahapan[]>([]);
  const [selectedId,  setSelectedId]  = useState<string>("");
  const [tanggal,     setTanggal]     = useState(() => new Date().toISOString().slice(0, 10));
  const [data,        setData]        = useState<AbsensiData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [draft,       setDraft]       = useState<Record<string, StatusAbsensi>>({});
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    fetch("/api/ujian-ukk/tahapan")
      .then(r => r.json())
      .then((list: Tahapan[]) => {
        const tasks = (Array.isArray(list) ? list : []).filter(t => (t as any).hariKe !== 0);
        setTahapanList(tasks);
        if (tasks.length > 0) setSelectedId(tasks[0].id);
      })
      .catch(() => {});
  }, []);

  const loadAbsensi = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ujian-ukk/absensi?tahapanId=${selectedId}&tanggal=${tanggal}`);
      const d: AbsensiData = await res.json();
      setData(d);
      const init: Record<string, StatusAbsensi> = {};
      d.siswa.forEach(s => { if (s.status) init[s.siswaId] = s.status; });
      setDraft(init);
    } catch {
      toast.error("Gagal memuat data absensi", "");
    } finally {
      setLoading(false);
    }
  }, [selectedId, tanggal]);

  useEffect(() => { loadAbsensi(); }, [loadAbsensi]);

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    const absensi = Object.entries(draft).map(([siswaId, status]) => ({ siswaId, status }));
    try {
      const r = await fetch("/api/ujian-ukk/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahapanId: selectedId, tanggal, absensi }),
      });
      if (r.ok) { toast.success("Absensi disimpan!", ""); loadAbsensi(); }
      else toast.error("Gagal menyimpan", "");
    } finally {
      setSaving(false);
    }
  }

  function setAllHadir() {
    if (!data) return;
    const next: Record<string, StatusAbsensi> = {};
    data.siswa.forEach(s => { next[s.siswaId] = "HADIR"; });
    setDraft(next);
  }

  const selectedTahapan = tahapanList.find(t => t.id === selectedId);
  const filtered = (data?.siswa ?? []).filter(s => s.nama.toLowerCase().includes(search.toLowerCase()));
  const rekap    = data?.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
  const total    = data?.siswa.length ?? 0;
  const terisi   = Object.keys(draft).length;

  return (
    <div className="space-y-5 p-1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)"}}>
          <ClipboardCheck size={18} className="text-white"/>
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Absensi UKK</h1>
          <p className="text-xs text-slate-400">Catat kehadiran siswa di lab yang Anda uji</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex flex-wrap gap-3 items-end shadow-sm">
        <div className="flex-1 min-w-48">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sesi / Lab</p>
          <div className="relative">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 pr-8 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {tahapanList.map(t => <option key={t.id} value={t.id}>{t.judul}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          </div>
        </div>
        <div className="flex-1 min-w-40">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal</p>
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
        <button onClick={setAllHadir}
          className="text-xs font-bold px-3 py-2 rounded-xl border transition-all hover:brightness-95 shrink-0"
          style={{backgroundColor:"#ECFDF5", color:"#10B981", borderColor:"#10B98140"}}>
          Hadir Semua
        </button>
        <button onClick={handleSave} disabled={saving || terisi === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shrink-0 disabled:opacity-50 transition-all hover:brightness-95"
          style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)"}}>
          <Save size={14}/>{saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {/* Info tahapan */}
      {selectedTahapan && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)"}}>
          <div className="relative px-5 py-4">
            <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10"/>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <ClipboardCheck size={18} className="text-white"/>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Lab Saya</p>
                  <p className="text-base font-extrabold text-white">{selectedTahapan.judul}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 ml-auto text-[11px] text-white/80">
                <span className="flex items-center gap-1"><CalendarDays size={11}/>{formatTgl(selectedTahapan.tanggal)}</span>
                <span className="flex items-center gap-1"><Clock size={11}/>{selectedTahapan.jamMulai}–{selectedTahapan.jamSelesai}</span>
                <span className="flex items-center gap-1"><MapPin size={11}/>{selectedTahapan.lokasi}</span>
                {selectedTahapan.penguji && <span className="flex items-center gap-1"><User size={11}/>{selectedTahapan.penguji}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rekap */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(rekap) as [StatusAbsensi, number][]).map(([st, n]) => {
          const cfg = STATUS_CONFIG[st];
          return (
            <div key={st} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{cfg.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{backgroundColor:cfg.bg, color:cfg.clr}}>{cfg.icon}</div>
              </div>
              <p className="text-2xl font-extrabold" style={{color:cfg.clr}}>{n}</p>
              <p className="text-[10px] text-slate-400">{total > 0 ? Math.round(n/total*100) : 0}% dari {total} siswa</p>
            </div>
          );
        })}
      </div>

      {/* Tabel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-indigo-500"/>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Daftar Siswa
              {total > 0 && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full text-white font-bold" style={{backgroundColor:"#6366F1"}}>{terisi}/{total}</span>}
            </span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari siswa..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 focus:outline-none w-44"/>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={32} className="mx-auto mb-3 text-slate-200"/>
            <p className="text-sm text-slate-400">{total === 0 ? "Belum ada siswa di-assign ke sesi ini" : "Tidak ada hasil"}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {filtered.map((s, idx) => {
              const cur = draft[s.siswaId] ?? null;
              return (
                <motion.div key={s.siswaId} initial={{opacity:0,y:3}} animate={{opacity:1,y:0}} transition={{delay:idx*0.03}}
                  className="px-5 py-3 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{background:"linear-gradient(135deg,#6366F1,#4F46E5)"}}>
                    {idx+1}
                  </div>
                  <p className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{s.nama}</p>
                  {s.waktuAbsen && <span className="text-[10px] text-slate-400 hidden sm:block">{s.waktuAbsen}</span>}
                  <div className="flex gap-1.5 shrink-0">
                    {(["HADIR","IZIN","SAKIT","ALPA"] as StatusAbsensi[]).map(st => {
                      const cfg = STATUS_CONFIG[st];
                      const active = cur === st;
                      return (
                        <button key={st} onClick={() => setDraft(p => ({...p, [s.siswaId]: st}))}
                          className="text-xs font-bold px-2.5 py-1 rounded-lg border transition-all"
                          style={{
                            backgroundColor: active ? cfg.bg : "transparent",
                            color: active ? cfg.clr : "#94a3b8",
                            borderColor: active ? cfg.clr+"60" : "#e2e8f0",
                          }}>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
