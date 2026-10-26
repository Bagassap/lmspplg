"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, UserCheck } from "lucide-react";
import { icon3dStyle } from "@/components/shared/Icon3D";

export type PengajuanPkl = { id: string; kelompokId: string | null; siswa: string; kelas: string; tempat: string; createdAt: string };

/** Kartu dashboard admin: pengajuan PKL dari siswa yang menunggu guru pembimbing. */
export function PengajuanPklCard({ list }: { list: PengajuanPkl[] }) {
  if (!list || list.length === 0) return null;
  const grup = new Map<string, PengajuanPkl[]>();
  list.forEach((p) => grup.set(p.kelompokId ?? p.id, [...(grup.get(p.kelompokId ?? p.id) ?? []), p]));
  const groups = [...grup.values()];

  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B] sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle("amber")}>
          <Briefcase size={22} color="#fff" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">Pengajuan PKL menunggu guru pembimbing</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">{groups.length} pengajuan dari siswa perlu ditetapkan guru pembimbingnya</p>
        </div>
        <span className="rounded-full bg-[#E8562B] px-2.5 py-1 text-xs font-bold text-white">{groups.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        {groups.slice(0, 4).map((rows) => (
          <div key={rows[0].id} className="flex items-center gap-2.5 rounded-2xl bg-[#F1EDFA] px-3.5 py-2.5 dark:bg-slate-700">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{rows[0].tempat}</p>
              <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                {rows.map((r) => `${r.siswa} (${r.kelas})`).join(", ")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link href="/admin/magang/penempatan"
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#3E03B3] text-sm font-bold text-white">
        <UserCheck size={16} /> Tetapkan guru pembimbing <ArrowRight size={15} />
      </Link>
    </div>
  );
}
