"use client";

import { Users } from "lucide-react";
import { LiveClock } from "@/components/shared/LiveClock";

export type HeaderStat = { icon: React.ComponentType<{ size?: number; className?: string }>; label: string };

export function DataSiswaHeader({
  roleBadge, title, subtitle, stats,
}: {
  roleBadge: string;
  title: string;
  subtitle: string;
  stats: HeaderStat[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: "linear-gradient(160deg,#977DFF 0%,#0033FF 45%,#0600AF 72%,#00003D 100%)" }}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Users size={26} className="text-white" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Data Siswa</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/90">{roleBadge}</span>
            </div>
            <h1 className="text-2xl font-extrabold leading-tight text-white">{title}</h1>
            <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {stats.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <Icon size={12} className="text-white/70" />
                {label}
              </div>
            ))}
          </div>
          <LiveClock />
        </div>
      </div>
    </div>
  );
}
