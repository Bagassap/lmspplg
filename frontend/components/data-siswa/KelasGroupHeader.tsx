"use client";

import { School, UserCheck, Users, ChevronDown } from "lucide-react";
import { kelasShort } from "./shared";

export function KelasGroupHeader({
  kelas, waliKelas, count, collapsed, onToggle,
}: {
  kelas: string; waliKelas?: string; count: number; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-4 rounded-xl border border-[#c4b5fd] bg-linear-to-r from-[#ede9fe] to-[#dbeafe] px-4.5 py-3.5 text-left transition-shadow hover:shadow-sm dark:border-violet-700/40 dark:from-violet-950/40 dark:to-blue-950/40"
    >
      <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-[#6d28d9]">
        <School size={18} className="text-white" />
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-[15px] font-bold text-[#4c1d95] dark:text-violet-200">{kelasShort(kelas)}</span>
        {waliKelas && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#4c1d95]/70 dark:text-violet-200/70">
            <UserCheck size={12} /> Wali: {waliKelas}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs font-medium text-[#4c1d95]/70 dark:text-violet-200/70">
          <Users size={12} /> {count} siswa
        </span>
      </div>

      <ChevronDown
        size={18}
        className={`shrink-0 text-[#4c1d95] transition-transform duration-200 dark:text-violet-200 ${collapsed ? "rotate-180" : ""}`}
      />
    </button>
  );
}
