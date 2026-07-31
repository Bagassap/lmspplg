"use client";

import { useState } from "react";
import { ChevronDown, PartyPopper } from "lucide-react";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { STATUS_CFG, PULANG_CFG } from "./shared";
import { Avatar } from "@/components/shared/Avatar";
import type { SiswaAbsensi } from "./types";

function CollapsibleList({
  title, icon: Icon, iconBg, iconColor, badgeBg, emptyMessage, items, total, open, onToggle,
}: {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  emptyMessage: string;
  items: SiswaAbsensi[];
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  const pct = total > 0 ? Math.round((items.length / total) * 100) : 0;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <button type="button" onClick={onToggle}
        className="flex w-full flex-col gap-2.5 px-4 pb-3.5 pt-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20">
        <span className="flex w-full items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg }}>
              <Icon size={16} style={{ color: iconColor }} />
            </span>
            <span className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{title}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ backgroundColor: badgeBg }}>
              {items.length}
            </span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </span>
        </span>
        <span className="flex w-full items-center gap-2.5">
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50">
            <span className="block h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: iconColor }} />
          </span>
          <span className="w-9 shrink-0 text-right text-[11px] font-extrabold tabular-nums" style={{ color: iconColor }}>
            {pct}%
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-50 dark:border-slate-700/40">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <PartyPopper size={22} style={{ color: iconColor }} />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{emptyMessage}</p>
            </div>
          ) : (
            <div className="thin-scrollbar grid max-h-72 grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3">
              {items.map((s, i) => (
                <div key={s.siswaId}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                    i % 2 === 0
                      ? "border-transparent"
                      : "border-slate-100 bg-slate-50 dark:border-slate-700/40 dark:bg-slate-900/30"
                  }`}
                  style={i % 2 === 0 ? { borderColor: `${iconColor}22`, backgroundColor: `${iconColor}0F` } : undefined}>
                  <Avatar
                    src={s.fotoProfil}
                    nama={s.nama}
                    sizePx={42}
                    fallbackBg={avatarColorFor(s.nama)}
                    textClassName="text-xs font-extrabold"
                    ring={`0 0 0 2px ${iconColor}33`}
                  />
                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-700 dark:text-slate-200">{s.nama}</span>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ backgroundColor: `${iconColor}1A`, color: iconColor }}>
                    {s.nis ?? "—"}
                  </span>
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
  const [expandedHadir, setExpandedHadir] = useState(false);
  const [expandedPulang, setExpandedPulang] = useState(false);

  const belumHadir = siswaList.filter((s) => !s.status || s.status === "ALPA");
  const belumPulang = siswaList.filter((s) => !s.waktuPulang);

  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
      <CollapsibleList
        title="Siswa Belum Absen Hadir"
        icon={STATUS_CFG.ALPA.icon}
        iconBg={STATUS_CFG.ALPA.bg}
        iconColor={STATUS_CFG.ALPA.clr}
        badgeBg={STATUS_CFG.ALPA.clr}
        emptyMessage="Semua siswa sudah absen hadir!"
        items={belumHadir}
        total={siswaList.length}
        open={expandedHadir}
        onToggle={() => setExpandedHadir((v) => !v)}
      />
      <CollapsibleList
        title="Siswa Belum Absen Pulang"
        icon={PULANG_CFG.icon}
        iconBg={PULANG_CFG.bg}
        iconColor={PULANG_CFG.clr}
        badgeBg={PULANG_CFG.clr}
        emptyMessage="Semua siswa sudah absen pulang!"
        items={belumPulang}
        total={siswaList.length}
        open={expandedPulang}
        onToggle={() => setExpandedPulang((v) => !v)}
      />
    </div>
  );
}
