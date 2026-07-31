"use client";

import { useEffect, useState } from "react";
import { TrendingDown, ShieldCheck, Medal, AlertTriangle, Flame, Gauge } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { formatTgl, CARD_GRADIENTS } from "./shared";
import type { LaporanSeringTidakHadir as LaporanData, PeriodeLaporan } from "./types";

const RANK_STYLE = [
  { bg: "#FFF6DF", clr: "#C99A1C" }, // gold
  { bg: "#F1F3F7", clr: "#8A96AC" }, // silver
  { bg: "#FCEEE3", clr: "#C97A3D" }, // bronze
];

function RankBadge({ index }: { index: number }) {
  if (index < 3) {
    const style = RANK_STYLE[index];
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: style.bg }}>
        <Medal size={15} style={{ color: style.clr }} />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-400 dark:bg-slate-700/50 dark:text-slate-500">
      {index + 1}
    </span>
  );
}

function StatGradientCard({
  icon: Icon, gradient, value, label,
}: {
  icon: React.ElementType;
  gradient: string;
  value: string;
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 shadow-sm" style={{ background: gradient }}>
      <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-2xl font-black leading-none text-white">{value}</p>
          <p className="mt-1.5 truncate text-[11px] font-bold text-white/75">{label}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export function LaporanSeringTidakHadir({ kelasId, kelasNama }: { kelasId: string; kelasNama?: string }) {
  const [periode, setPeriode] = useState<PeriodeLaporan>("mingguan");
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kelasId) { setData(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ periode, kelasId });
    fetch(`/api/absensi-harian/laporan-sering-tidak-hadir?${qs}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d && Array.isArray(d.siswa) ? d : null); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [periode, kelasId]);

  const rows = data?.siswa ?? [];
  const totalBermasalah = rows.length;
  const alpaTertinggi = rows.reduce((m, r) => Math.max(m, r.summary.ALPA), 0);
  const rataKehadiran = rows.length > 0
    ? Math.round((rows.reduce((s, r) => s + r.summary.persentaseKehadiran, 0) / rows.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
            <TrendingDown size={17} className="text-red-500" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
              Siswa Sering Tidak Hadir{kelasNama ? ` · ${kelasNama}` : ""}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {data ? `${formatTgl(data.tanggalMulai)} – ${formatTgl(data.tanggalSelesai)}` : "Memuat..."}
            </p>
          </div>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-700/50">
          {([
            { key: "mingguan", label: "7 Hari" },
            { key: "bulanan", label: "30 Hari" },
          ] as { key: PeriodeLaporan; label: string }[]).map((opt) => (
            <button key={opt.key} type="button" onClick={() => setPeriode(opt.key)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                periode === opt.key
                  ? "bg-white text-violet-600 shadow-sm dark:bg-slate-800"
                  : "text-slate-500 dark:text-slate-400"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatGradientCard icon={AlertTriangle} gradient={CARD_GRADIENTS[1]} value={String(totalBermasalah)} label="Siswa Bermasalah" />
        <StatGradientCard icon={Flame} gradient={CARD_GRADIENTS[2]} value={`${alpaTertinggi}x`} label="Alpa Terbanyak" />
        <StatGradientCard icon={Gauge} gradient={CARD_GRADIENTS[0]} value={`${rataKehadiran}%`} label="Rata-rata Kehadiran" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="py-10 text-center text-xs font-semibold text-slate-400">Memuat data...</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ShieldCheck size={22} className="text-emerald-400" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tidak ada siswa dengan catatan alpa pada periode ini
            </p>
          </div>
        ) : (
          <div className="thin-scrollbar max-h-96 divide-y divide-slate-50 overflow-y-auto dark:divide-slate-700/30">
            {rows.map((r, i) => (
              <div key={r.siswaId} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20">
                <RankBadge index={i} />
                <Avatar
                  src={r.fotoProfil}
                  nama={r.nama ?? "-"}
                  sizePx={34}
                  fallbackBg={avatarColorFor(r.nama ?? "-")}
                  textClassName="text-[10px] font-extrabold"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{r.nama}</p>
                  <p className="truncate text-[11px] text-slate-400">{r.kelasNama} · {r.nis ?? "—"}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50">
                      <span className="block h-full rounded-full bg-emerald-400 transition-[width] duration-500 ease-out" style={{ width: `${r.summary.persentaseKehadiran}%` }} />
                    </span>
                    <span className="w-9 shrink-0 text-right text-[10px] font-bold text-slate-400">{r.summary.persentaseKehadiran}%</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-500 dark:bg-red-900/20">
                  {r.summary.ALPA}x Alpa
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
