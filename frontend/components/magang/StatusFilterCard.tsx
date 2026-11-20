"use client";

import type { ComponentType, ReactNode } from "react";

export type StatusFilterItem<T extends string> = {
  value: T;
  label: string;
  bg: string;
  clr: string;
  icon: ComponentType<{ size?: number }>;
  count: number;
};

export function StatusFilterCard<T extends string>({ items, value, onChange, aksi }: {
  items: StatusFilterItem<T>[];
  value: T;
  onChange: (v: T) => void;
  aksi?: ReactNode;
}) {
  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {items.map((t) => {
          const aktif = value === t.value;
          return (
            <button key={t.label} type="button" onClick={() => onChange(t.value)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
              style={aktif ? { background: "#3E03B3", color: "#fff" } : { background: "#F1F5F9", color: "#475569" }}>
              <t.icon size={13} />
              <span>{t.label}</span>
              <span className="tabular-nums opacity-80">{t.count}</span>
            </button>
          );
        })}
        {aksi && <div className="flex shrink-0 items-center [&>button]:h-9 [&>button]:w-auto [&>button]:px-3">{aksi}</div>}
      </div>
      <div className="card-pisah hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
        <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</p>
        <div className="grid grid-cols-1 gap-2.5">
          {items.map((t) => {
            const aktif = value === t.value;
            return (
              <button key={t.label} type="button" onClick={() => onChange(t.value)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-all"
                style={aktif
                  ? { background: t.clr, color: "#fff" }
                  : { background: t.bg, color: t.clr }}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={aktif
                    ? { background: "rgba(255,255,255,0.22)", color: "#fff", ["--icon-tile-color" as string]: "#fff" }
                    : { background: `${t.clr}24`, color: t.clr, ["--icon-tile-color" as string]: t.clr }}>
                  <t.icon size={14} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{t.label}</span>
                <span className="shrink-0 text-base font-extrabold tabular-nums">{t.count}</span>
              </button>
            );
          })}
        </div>
        {aksi && <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">{aksi}</div>}
      </div>
    </>
  );
}
