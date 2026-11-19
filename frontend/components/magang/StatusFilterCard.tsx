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
      <p className="mb-3 px-1 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {items.map((t) => {
          const aktif = value === t.value;
          return (
            <button key={t.label} type="button" onClick={() => onChange(t.value)}
              className="flex items-center gap-2.5 rounded-2xl border-l-4 px-3 py-2.5 text-left transition-colors"
              style={aktif ? { background: t.bg, borderColor: t.clr } : { background: "transparent", borderColor: "transparent" }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.clr }}>
                <t.icon size={17} />
              </span>
              <span className={`min-w-0 flex-1 truncate text-sm font-bold ${aktif ? "" : "text-slate-600 dark:text-slate-300"}`} style={aktif ? { color: t.clr } : undefined}>{t.label}</span>
              <span className="shrink-0 text-lg font-extrabold tabular-nums" style={{ color: t.clr }}>{t.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
