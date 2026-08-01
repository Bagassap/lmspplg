"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, ShieldCheck, Medal, AlertTriangle, Flame, Gauge, ChevronRight, X } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { formatTgl, CARD_GRADIENTS } from "./shared";
import type { LaporanSeringTidakHadir as LaporanData, PeriodeLaporan } from "./types";

// Solid gradient (no alpha stops) for the trigger tile, distinct from the
// red/blue used by BelumAbsenPanel's two triggers for visual variety.
const TRIGGER_GRADIENT = "linear-gradient(135deg,#F97316,#EF4444)";

const GRID_COLS = "36px 40px 2fr 1.4fr 80px 1.2fr";

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
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-400 dark:bg-slate-700 dark:text-slate-500">
      {index + 1}
    </span>
  );
}

// Bar color varies with how bad the attendance actually is — red under 50%,
// amber under 75%, blue otherwise.
function severityColor(pct: number) {
  if (pct < 50) return "#FF3644";
  if (pct < 75) return "#E6A800";
  return "#3B7CE8";
}

function StatPill({
  icon: Icon, gradient, iconColor, value, label,
}: {
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 shadow-sm" style={{ background: gradient }}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white">
        <Icon size={14} style={{ color: iconColor }} />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-black text-white">{value}</p>
        <p className="whitespace-nowrap text-[9px] font-bold text-white">{label}</p>
      </div>
    </div>
  );
}

export function LaporanSeringTidakHadir({ kelasId, kelasNama }: { kelasId: string; kelasNama?: string }) {
  const [periode, setPeriode] = useState<PeriodeLaporan>("mingguan");
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
    <>
      <button type="button" onClick={() => setShowModal(true)}
        className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        style={{ background: TRIGGER_GRADIENT }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
          <TrendingDown size={18} className="text-red-500" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-white">Siswa Sering Tidak Hadir</p>
          <p className="truncate text-[11px] font-semibold text-white">
            {loading ? "Memuat..." : `Rata-rata kehadiran ${rataKehadiran}%`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-red-500">
          {totalBermasalah}
        </span>
        <ChevronRight size={15} className="shrink-0 text-white" />
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">

              <div className="flex shrink-0 flex-wrap items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 dark:from-red-950 dark:to-orange-950">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800">
                    <TrendingDown size={17} className="text-red-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      Siswa Sering Tidak Hadir{kelasNama ? ` · ${kelasNama}` : ""}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {data ? `${formatTgl(data.tanggalMulai)} – ${formatTgl(data.tanggalSelesai)}` : "Memuat..."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                  <div className="flex rounded-xl bg-white p-1 dark:bg-slate-800">
                    {([
                      { key: "mingguan", label: "7 Hari" },
                      { key: "bulanan", label: "30 Hari" },
                    ] as { key: PeriodeLaporan; label: string }[]).map((opt) => (
                      <button key={opt.key} type="button" onClick={() => setPeriode(opt.key)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                          periode === opt.key
                            ? "bg-violet-500 text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowModal(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 px-5 py-3">
                <StatPill icon={AlertTriangle} gradient={CARD_GRADIENTS[1]} iconColor="#EF4444" value={String(totalBermasalah)} label="Bermasalah" />
                <StatPill icon={Flame} gradient={CARD_GRADIENTS[2]} iconColor="#F59E0B" value={`${alpaTertinggi}x`} label="Alpa Terbanyak" />
                <StatPill icon={Gauge} gradient={CARD_GRADIENTS[0]} iconColor="#3B7CE8" value={`${rataKehadiran}%`} label="Rata Hadir" />
              </div>

              {loading ? (
                <div className="flex-1 py-10 text-center text-xs font-semibold text-slate-400">Memuat data...</div>
              ) : rows.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
                  <ShieldCheck size={22} className="text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tidak ada siswa dengan catatan alpa pada periode ini
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-auto border-t border-slate-100 dark:border-slate-700">
                  <div className="min-w-150">
                    <div className="grid items-center gap-3 border-b border-slate-100 px-5 py-2.5 dark:border-slate-700"
                      style={{ gridTemplateColumns: GRID_COLS }}>
                      <span />
                      <span />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Siswa</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Kelas</span>
                      <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Alpa</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Kehadiran</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {rows.map((r, i) => {
                        const bar = severityColor(r.summary.persentaseKehadiran);
                        return (
                          <div key={r.siswaId}
                            className="grid items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                            style={{ gridTemplateColumns: GRID_COLS }}>
                            <RankBadge index={i} />
                            <Avatar
                              src={r.fotoProfil}
                              nama={r.nama ?? "-"}
                              sizePx={32}
                              fallbackBg={avatarColorFor(r.nama ?? "-")}
                              textClassName="text-[10px] font-extrabold"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{r.nama}</p>
                            </div>
                            <p className="truncate text-[11px] text-slate-400">{r.kelasNama} · {r.nis ?? "—"}</p>
                            <span className="mx-auto rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-500 dark:bg-red-950">
                              {r.summary.ALPA}x
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <span className="block h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${r.summary.persentaseKehadiran}%`, backgroundColor: bar }} />
                              </span>
                              <span className="w-9 shrink-0 text-right text-[10px] font-bold" style={{ color: bar }}>{r.summary.persentaseKehadiran}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
