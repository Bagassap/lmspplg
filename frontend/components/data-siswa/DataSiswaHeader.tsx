"use client";

import { ChevronRight, Users } from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";

export type HeaderStat = { icon: React.ComponentType<{ size?: number; className?: string }>; label: string };

export function DataSiswaHeader({
  panelLabel, roleBadge, title, subtitle, stats,
}: {
  panelLabel: string;
  roleBadge: string;
  title: string;
  subtitle: string;
  stats: HeaderStat[];
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-7 md:px-8 md:py-8"
      style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2.5 flex items-center gap-2 text-[11px] font-medium text-white/60">
            <span>{panelLabel}</span>
            <ChevronRight size={11} />
            <span className="text-white/90">Data Siswa</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">{roleBadge}</span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
              <Users size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">{title}</h1>
              <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <LiveClock />
          <div className="flex flex-wrap justify-end gap-2">
            {stats.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <Icon size={12} className="text-white/70" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
