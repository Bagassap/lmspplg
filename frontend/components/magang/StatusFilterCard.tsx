"use client";

import type { ComponentType } from "react";

export type StatusFilterItem<T extends string> = {
  value: T;
  label: string;
  bg: string;
  clr: string;
  icon: ComponentType<{ size?: number }>;
  count: number;
};

export function StatusFilterCard<T extends string>({ items, value, onChange }: {
  items: StatusFilterItem<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="card-pisah rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</p>
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
        {items.map((t) => {
          const aktif = value === t.value;
          return (
            <button key={t.label} type="button" onClick={() => onChange(t.value)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-all"
              style={aktif
                ? { background: t.clr, color: "#fff", boxShadow: `0 8px 20px -8px ${t.clr}` }
                : { background: t.bg, color: t.clr }}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${aktif ? "" : "bg-white/70 dark:bg-slate-900/40"}`}
                style={aktif ? { background: "rgba(255,255,255,0.22)", color: "#fff" } : { color: t.clr }}>
                <t.icon size={14} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{t.label}</span>
              <span className="shrink-0 text-base font-extrabold tabular-nums">{t.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
