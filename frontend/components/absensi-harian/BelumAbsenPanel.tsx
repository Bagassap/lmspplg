"use client";

import { useState } from "react";
import { ChevronDown, UserX, LogOut } from "lucide-react";
import type { SiswaAbsensi } from "./types";

function CollapsibleList({
  title, icon: Icon, color, items,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  items: { nama: string; nis?: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Icon size={15} style={{ color }} />
          {title} <span style={{ color }}>({items.length})</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-slate-50 px-4 py-3 dark:border-slate-700/40">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Semua siswa sudah tercatat.</p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {items.map((s, i) => (
                <div key={i}
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs odd:bg-slate-50 dark:odd:bg-slate-700/30">
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{s.nama}</span>
                  <span className="shrink-0 text-slate-400 dark:text-slate-500">{s.nis ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BelumAbsenPanel({ siswaList }: { siswaList: SiswaAbsensi[] }) {
  const belumHadir = siswaList.filter((s) => !s.status || s.status === "ALPA");
  const belumPulang = siswaList.filter((s) => !s.waktuPulang);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <CollapsibleList title="Siswa Belum Absen Hadir" icon={UserX} color="#FF3644" items={belumHadir} />
      <CollapsibleList title="Siswa Belum Absen Pulang" icon={LogOut} color="#3B7CE8" items={belumPulang} />
    </div>
  );
}
