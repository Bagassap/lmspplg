"use client";

import { useMemo } from "react";
import { Clock, Building2, FileText, UserCheck, Users, X } from "lucide-react";
import { toTitleCase } from "@/components/data-siswa/shared";
import type { PenempatanMagang } from "./types";

/** Pengajuan PKL dari siswa yang menunggu admin menetapkan guru pembimbing (dikelompokkan per rombongan). */
export function PengajuanMenungguPanel({ list, onTetapkan, onTolak }: {
  list: PenempatanMagang[];
  onTetapkan: (rows: PenempatanMagang[]) => void;
  onTolak: (rows: PenempatanMagang[]) => void;
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
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Pengajuan Menunggu Guru Pembimbing</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Periksa surat keterangan siswa, lalu terima (tetapkan guru pembimbing) atau tolak.</p>
        </div>
        <span className="rounded-full bg-[#E8562B] px-2.5 py-1 text-xs font-bold text-white">{groups.length}</span>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        {groups.map((rows) => {
          const t = rows[0].tempatMagang;
          return (
            <div key={rows[0].id} className="flex flex-col gap-2 rounded-2xl bg-[#F1EDFA] p-3.5 dark:bg-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#3E03B3]"><Building2 size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{t.namaTempat}</p>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-300">{t.alamat ?? "Tempat dari daftar guru"}</p>
                </div>
                {t.dibuatSiswa && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#E8562B]">Tempat baru</span>}
              </div>
              <p className="flex items-start gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                <Users size={13} className="mt-0.5 shrink-0 text-[#3E03B3]" />
                <span>{rows.map((r) => `${toTitleCase(r.siswa.nama ?? r.siswa.user?.nama ?? "—")} (${r.siswa.kelas?.nama ?? "-"})`).join(", ")}</span>
              </p>
              {rows[0].suratKeteranganUrl ? (
                <a href={`/api/uploads${rows[0].suratKeteranganUrl}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#3E03B3] underline dark:text-[#C4B5FD]">
                  <FileText size={13} className="shrink-0" /> <span className="truncate">Surat keterangan: {rows[0].suratKeteranganNama ?? "Lihat berkas"}</span>
                </a>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><FileText size={13} className="shrink-0" /> Tidak ada surat keterangan</p>
              )}
              <div className="mt-1 flex gap-2">
                <button type="button" onClick={() => onTetapkan(rows)}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#3E03B3] text-xs font-bold text-white">
                  <UserCheck size={14} /> Terima &amp; tetapkan guru
                </button>
                <button type="button" onClick={() => onTolak(rows)}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-[#E8562B] dark:bg-slate-800">
                  <X size={14} /> Tolak
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
