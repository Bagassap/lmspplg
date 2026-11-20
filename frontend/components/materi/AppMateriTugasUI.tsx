"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { icon3dStyle, TONE_ORDER } from "@/components/shared/Icon3D";

export type AppItemMeta = { icon: React.ElementType; text: string; done?: boolean };

export function relDeadline(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Berakhir";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${Math.max(hours, 1)} jam lagi`;
  return `${Math.floor(hours / 24)} hari lagi`;
}

function Tile({ i, icon: Icon, size, iconSize }: { i: number; icon: React.ElementType; size: string; iconSize: number }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-2xl ${size}`} style={icon3dStyle(TONE_ORDER[i % TONE_ORDER.length])}>
      <Icon size={iconSize} color="#fff" />
    </span>
  );
}

export function AppUnderlineTabs<T extends string>({ tabs, value, onChange, layoutId }: {
  tabs: readonly (readonly [T, string, number?])[]; value: T; onChange: (v: T) => void; layoutId: string;
}) {
  return (
    <div className="flex gap-7 border-b border-slate-200 dark:border-slate-700/60">
      {tabs.map(([key, label, badge]) => {
        const active = value === key;
        return (
          <button key={key} type="button" onClick={() => onChange(key)}
            className="relative flex items-center gap-1.5 pb-3 text-[15px] font-semibold transition-colors"
            style={{ color: active ? "#3E03B3" : "#64748b" }}>
            {label}
            {!!badge && <span className="flex h-4 min-w-4 items-center justify-center rounded-md bg-[#3E03B3] px-1 text-[9px] font-bold text-white">{badge}</span>}
            {active && <motion.span layoutId={layoutId} className="absolute inset-x-0 -bottom-px h-0.5 rounded-xl" style={{ background: "#F26A3D" }} />}
          </button>
        );
      })}
    </div>
  );
}

export function AppFeaturedRow<T extends { id: string; judul: string; mapel: string }>({ judul, items, icon, meta, onOpen }: {
  judul: string; items: T[]; icon: React.ElementType; meta: (x: T) => AppItemMeta; onOpen: (x: T) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-extrabold text-slate-900 dark:text-white">{judul}</h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => {
          const m = meta(item);
          return (
            <motion.button key={item.id} type="button" whileTap={{ scale: 0.97 }} onClick={() => onOpen(item)}
              className="w-44 shrink-0 rounded-3xl bg-white p-3 text-left shadow-[0_6px_20px_-6px_rgba(15,23,42,0.18)] dark:bg-[#1E293B]">
              <Tile i={i} icon={icon} size="h-24 w-full" iconSize={34} />
              <p className="mt-3 line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 dark:text-white">{item.judul}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: "#F1F5F9", color: "#3E03B3" }}><FileText size={10} /></span>
                <span className="truncate">{item.mapel}</span>
              </div>
              <p className="mt-2 flex items-center gap-1 text-sm font-extrabold" style={{ color: m.done ? "#3E03B3" : "#F26A3D" }}>
                <m.icon size={13} /> {m.text}
              </p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export function AppListItem({ i, icon, judul, mapel, tanggal, meta, badge, onOpen }: {
  i: number; icon: React.ElementType; judul: string; mapel: string; tanggal: string; meta: AppItemMeta; badge?: number; onOpen: () => void;
}) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-3xl bg-white p-3 text-left shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
      <Tile i={i + 1} icon={icon} size="h-16 w-16" iconSize={26} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{judul}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="truncate">{mapel}</span><span>•</span><span className="shrink-0">{tanggal}</span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold" style={{ color: meta.done ? "#3E03B3" : "#F26A3D" }}>
          <meta.icon size={12} /> {meta.text}
        </p>
      </div>
      {!!badge && <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-xl bg-[#3E03B3] px-2 text-xs font-bold text-white">{badge}</span>}
    </motion.button>
  );
}
