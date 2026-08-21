"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FileUp, Users, CheckCircle2, XCircle, Search, Filter, Briefcase } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { LaporDiriTable } from "@/components/magang/LaporDiriTable";
import { BackToHubLink } from "@/components/magang/BackToHubLink";
import type { LaporDiriResponse, LaporDiriRow } from "@/components/magang/lapor-diri-types";

const STAT_GRADIENTS = ["#0064E0", "#00D67F", "#EF4444"];

function periodeLabel(periode: string): string {
  const [y, m] = periode.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function GuruLaporDiriPage() {
  const toast = useToast();
  const [data, setData] = useState<LaporDiriResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyBelum, setOnlyBelum] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/magang/lapor-diri", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      setData(json && Array.isArray(json.rows) ? json : { periode: "", summary: { total: 0, sudahLapor: 0, belumLapor: 0 }, rows: [] });
    } catch {
      toast.error("Gagal memuat data lapor diri PKL", "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = data?.rows ?? [];
  const summary = data?.summary ?? { total: 0, sudahLapor: 0, belumLapor: 0 };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r: LaporDiriRow) => {
      if (onlyBelum && r.sudahLapor) return false;
      if (!q) return true;
      return (r.siswa.nama ?? "").toLowerCase().includes(q) || r.siswa.nis.toLowerCase().includes(q);
    });
  }, [rows, search, onlyBelum]);

  const STATS = [
    { label: "Siswa Bimbingan", value: summary.total, icon: Users },
    { label: "Sudah Lapor", value: summary.sudahLapor, icon: CheckCircle2 },
    { label: "Belum Lapor", value: summary.belumLapor, icon: XCircle },
  ];

  if (!loading && rows.length === 0) {
    return (
      <div className="space-y-5 p-1">
        <BackToHubLink href="/guru/magang/rekap" />
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
              <FileUp size={22} className="text-white sm:hidden" />
              <FileUp size={26} className="hidden text-white sm:block" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Lapor Diri</h1>
              <p className="mt-0.5 text-sm text-white/70">Status laporan bulanan siswa PKL bimbingan Anda</p>
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
      <BackToHubLink href="/guru/magang/rekap" />
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <FileUp size={22} className="text-white sm:hidden" />
            <FileUp size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Laporan Bulanan PKL</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">Guru Pembimbing</span>
            </div>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Lapor Diri</h1>
            <p className="mt-0.5 text-sm text-white/70">
              {data?.periode ? `Status laporan bulanan periode ${periodeLabel(data.periode)}` : "Status laporan bulanan siswa bimbingan Anda"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((s, i) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl p-4" style={{ background: STAT_GRADIENTS[i], color: "#FFFFFF", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <s.icon size={16} />
            </span>
            <p className="mt-3 text-2xl font-extrabold tabular-nums">{loading ? "—" : s.value}</p>
            <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#0082FB" }}>
              <Filter size={14} className="text-white" />
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Daftar Lapor Diri <span className="font-medium text-slate-400">({filtered.length})</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/NIS..."
                className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200" />
            </div>
            <button type="button" onClick={() => setOnlyBelum((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                onlyBelum ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
              }`}>
              <XCircle size={12} /> Belum Lapor
            </button>
          </div>
        </div>

        <LaporDiriTable loading={loading} rows={filtered} />
      </div>
    </div>
  );
}
