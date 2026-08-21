"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Activity, Building2, TrendingUp, AlertTriangle, Search, Filter, Briefcase } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { MonitoringTable } from "@/components/magang/MonitoringTable";
import type { MonitoringResponse, MonitoringRow } from "@/components/magang/monitoring-types";

const STAT_GRADIENTS = ["#0064E0", "#C3F84A", "#0082FB", "#EF4444"];
const STAT_ON_TEXT = ["#FFFFFF", "#1C2B33", "#FFFFFF", "#FFFFFF"];

export default function GuruMagangMonitoringPage() {
  const toast = useToast();
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tempatFilter, setTempatFilter] = useState("");
  const [onlyPerhatian, setOnlyPerhatian] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/magang/monitoring", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      setData(json && Array.isArray(json.rows) ? json : { summary: { totalPenempatan: 0, totalTempat: 0, rataRataKehadiran: 0, perluPerhatianCount: 0 }, rows: [] });
    } catch {
      toast.error("Gagal memuat data monitoring PKL", "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows ?? [];
  const summary = data?.summary ?? { totalPenempatan: 0, totalTempat: 0, rataRataKehadiran: 0, perluPerhatianCount: 0 };

  const tempatOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.tempatMagang.id, r.tempatMagang.namaTempat);
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r: MonitoringRow) => {
      if (tempatFilter && r.tempatMagang.id !== tempatFilter) return false;
      if (onlyPerhatian && !r.perluPerhatian) return false;
      if (!q) return true;
      return (r.siswa.nama ?? "").toLowerCase().includes(q) || r.siswa.nis.toLowerCase().includes(q);
    });
  }, [rows, search, tempatFilter, onlyPerhatian]);

  const STATS = [
    { label: "Siswa Bimbingan Aktif", value: summary.totalPenempatan, suffix: " siswa", icon: Activity },
    { label: "Tempat PKL", value: summary.totalTempat, suffix: " tempat", icon: Building2 },
    { label: "Rata-rata Kehadiran", value: summary.rataRataKehadiran, suffix: "%", icon: TrendingUp },
    { label: "Perlu Perhatian", value: summary.perluPerhatianCount, suffix: " siswa", icon: AlertTriangle },
  ];

  if (!loading && rows.length === 0) {
    return (
      <div className="space-y-5 p-1">
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
              <Activity size={22} className="text-white sm:hidden" />
              <Activity size={26} className="hidden text-white sm:block" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Monitoring PKL</h1>
              <p className="mt-0.5 text-sm text-white/70">Pantau progres kehadiran siswa PKL bimbingan Anda</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
            <Briefcase size={24} className="text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Anda belum menjadi guru pembimbing PKL siswa manapun</p>
          <p className="max-w-sm text-xs text-slate-400">Hubungi admin untuk ditetapkan sebagai pembimbing saat siswa ditempatkan PKL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <Activity size={22} className="text-white sm:hidden" />
            <Activity size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Pemantauan PKL</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Guru Pembimbing</span>
            </div>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Monitoring PKL</h1>
            <p className="mt-0.5 text-sm text-white/70">Pantau progres kehadiran siswa PKL bimbingan Anda</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s, i) => {
          const bg = STAT_GRADIENTS[i % STAT_GRADIENTS.length];
          const onText = STAT_ON_TEXT[i % STAT_ON_TEXT.length];
          return (
            <div key={s.label} className="relative overflow-hidden rounded-2xl p-4" style={{ background: bg, color: onText, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${onText}30` }}>
                <s.icon size={16} />
              </span>
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{loading ? "—" : s.value}{!loading && s.suffix}</p>
              <p className="text-[11px] font-semibold" style={{ color: `${onText}CC` }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#0082FB" }}>
              <Filter size={14} className="text-white" />
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Daftar Monitoring <span className="font-medium text-slate-400">({filtered.length})</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/NIS..."
                className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200" />
            </div>
            <select value={tempatFilter} onChange={(e) => setTempatFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
              <option value="">Semua Tempat</option>
              {tempatOptions.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
            </select>
            <button type="button" onClick={() => setOnlyPerhatian((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                onlyPerhatian ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
              }`}>
              <AlertTriangle size={12} /> Perlu Perhatian
            </button>
          </div>
        </div>

        <MonitoringTable loading={loading} rows={filtered} />
      </div>
    </div>
  );
}
