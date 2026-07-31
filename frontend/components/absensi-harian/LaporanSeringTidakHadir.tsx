"use client";

import { useEffect, useState } from "react";
import { TrendingDown, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { formatTgl } from "./shared";
import type { Kelas, LaporanSeringTidakHadir as LaporanData, PeriodeLaporan } from "./types";

export function LaporanSeringTidakHadir({ kelasList }: { kelasList: Kelas[] }) {
  const [periode, setPeriode] = useState<PeriodeLaporan>("mingguan");
  const [kelasId, setKelasId] = useState<string>("");
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ periode });
    if (kelasId) qs.set("kelasId", kelasId);
    fetch(`/api/absensi-harian/laporan-sering-tidak-hadir?${qs}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d && Array.isArray(d.siswa) ? d : null); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [periode, kelasId]);

  const rows = data?.siswa ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 px-4 py-3.5 dark:border-slate-700/40">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
            <TrendingDown size={16} className="text-red-500" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">Siswa Sering Tidak Hadir</p>
            <p className="truncate text-[11px] text-slate-400">
              {data ? `${formatTgl(data.tanggalMulai)} – ${formatTgl(data.tanggalSelesai)}` : "Memuat..."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {kelasList.length > 1 && (
            <select value={kelasId} onChange={(e) => setKelasId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          )}
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
      </div>

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
            <div key={r.siswaId} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20">
              <span className="w-5 shrink-0 text-center text-[11px] font-extrabold text-slate-300">{i + 1}</span>
              <Avatar
                src={r.fotoProfil}
                nama={r.nama ?? "-"}
                sizePx={32}
                fallbackBg={avatarColorFor(r.nama ?? "-")}
                textClassName="text-[10px] font-extrabold"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{r.nama}</p>
                <p className="truncate text-[11px] text-slate-400">{r.kelasNama} · {r.nis ?? "—"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-500 dark:bg-red-900/20">
                  {r.summary.ALPA}x Alpa
                </span>
                <span className="w-11 shrink-0 text-right text-[11px] font-bold text-slate-400">
                  {r.summary.persentaseKehadiran}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
