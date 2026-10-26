"use client";

import { useMemo } from "react";
import { Clock, Building2, ChevronRight, FileText, Users } from "lucide-react";
import { toTitleCase } from "@/components/data-siswa/shared";
import type { PenempatanMagang } from "./types";

/** Pengajuan PKL dari siswa yang menunggu admin (dikelompokkan per rombongan). Klik kartu untuk membuka modal pengajuan. */
export function PengajuanMenungguPanel({ list, onBuka }: {
  list: PenempatanMagang[];
  onBuka: (rows: PenempatanMagang[]) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, PenempatanMagang[]>();
    list.filter((p) => p.status === "MENUNGGU").forEach((p) => {
      const key = p.kelompokId ?? p.id;
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return [...map.values()];
  }, [list]);

  if (groups.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE9E2] text-[#E8562B]"><Clock size={17} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Pengajuan Penempatan PKL</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Klik kartu untuk memeriksa surat keterangan, lalu terima atau tolak.</p>
        </div>
        <span className="rounded-xl bg-[#E8562B] px-2.5 py-1 text-xs font-bold text-white">{groups.length}</span>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        {groups.map((rows) => {
          const t = rows[0].tempatMagang;
          const adaSurat = rows.some((r) => r.suratKeteranganUrl);
          return (
            <button key={rows[0].id} type="button" onClick={() => onBuka(rows)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F1EDFA] p-3.5 text-left transition-colors hover:bg-[#E7E0F7] dark:bg-slate-700 dark:hover:bg-slate-600">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#3E03B3] dark:bg-slate-800"><Building2 size={18} /></span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{t.namaTempat}</p>
                  {t.dibuatSiswa && <span className="shrink-0 rounded-xl bg-white px-2 py-0.5 text-[10px] font-bold text-[#E8562B] dark:bg-slate-800">Tempat sendiri</span>}
                </div>
                <p className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                  <Users size={12} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />
                  <span className="line-clamp-2">{rows.map((r) => `${toTitleCase(r.siswa.nama ?? r.siswa.user?.nama ?? "—")} (${r.siswa.kelas?.nama ?? "-"})`).join(", ")}</span>
                </p>
                <p className={`flex items-center gap-1.5 text-[11px] font-bold ${adaSurat ? "text-[#3E03B3] dark:text-[#C4B5FD]" : "text-[#E8562B]"}`}>
                  <FileText size={12} /> {adaSurat ? "Surat keterangan terlampir" : "Belum ada surat keterangan"}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
