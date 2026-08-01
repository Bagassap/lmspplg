"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, PartyPopper, Search, Copy, Check, X } from "lucide-react";
import { avatarColorFor } from "@/components/data-siswa/shared";
import { STATUS_CFG, PULANG_CFG } from "./shared";
import { Avatar } from "@/components/shared/Avatar";
import { useToast } from "@/components/shared/ToastSystem";
import type { SiswaAbsensi } from "./types";

function Trigger({
  title, icon: Icon, iconBg, iconColor, badgeBg, items, total, onOpen,
}: {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  items: SiswaAbsensi[];
  total: number;
  onOpen: () => void;
}) {
  const pct = total > 0 ? Math.round((items.length / total) * 100) : 0;
  return (
    <button type="button" onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${iconColor}30`, backgroundColor: `${iconColor}08` }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70 dark:bg-slate-900/40">
            <span className="block h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: iconColor }} />
          </span>
          <span className="text-[10px] font-bold" style={{ color: iconColor }}>{pct}%</span>
        </div>
      </div>
      <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white" style={{ backgroundColor: badgeBg }}>
        {items.length}
      </span>
      <ChevronRight size={15} className="shrink-0 text-slate-300" />
    </button>
  );
}

function DetailModal({
  title, icon: Icon, iconBg, iconColor, emptyMessage, items, onClose,
}: {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  emptyMessage: string;
  items: SiswaAbsensi[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => s.nama.toLowerCase().includes(q) || (s.nis ?? "").toLowerCase().includes(q));
  }, [items, query]);

  async function copyNames() {
    const text = items.map((s, i) => `${i + 1}. ${s.nama}${s.nis ? ` (${s.nis})` : ""}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Daftar disalin", `${items.length} nama siap ditempel ke pesan pengingat`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin", "Coba lagi atau salin manual");
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: iconBg }}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-white/10">
              <Icon size={17} style={{ color: iconColor }} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold" style={{ color: iconColor }}>{title}</p>
              <p className="text-[11px] font-semibold" style={{ color: `${iconColor}99` }}>{items.length} siswa</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-slate-500 hover:bg-white dark:bg-white/10 dark:text-slate-300">
            <X size={15} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <PartyPopper size={24} style={{ color: iconColor }} />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-50 px-4 py-3 dark:border-slate-700/40">
              <div className="relative flex-1">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama / NIS..." autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs font-semibold text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  style={{ "--tw-ring-color": `${iconColor}55` } as React.CSSProperties} />
              </div>
              <button type="button" onClick={copyNames}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white transition-transform active:scale-95"
                style={{ backgroundColor: iconColor }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Disalin" : "Salin"}
              </button>
            </div>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-slate-400">Tidak ada yang cocok dengan &ldquo;{query}&rdquo;</p>
            ) : (
              <div className="thin-scrollbar flex-1 divide-y divide-slate-50 overflow-y-auto dark:divide-slate-700/30">
                {filtered.map((s) => (
                  <div key={s.siswaId} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <Avatar
                      src={s.fotoProfil}
                      nama={s.nama}
                      sizePx={34}
                      fallbackBg={avatarColorFor(s.nama)}
                      textClassName="text-[10px] font-extrabold"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{s.nama}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${iconColor}18`, color: iconColor }}>
                      {s.nis ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

export function BelumAbsenPanel({ siswaList }: { siswaList: SiswaAbsensi[] }) {
  const [activeModal, setActiveModal] = useState<"hadir" | "pulang" | null>(null);

  const belumHadir = siswaList.filter((s) => !s.status || s.status === "ALPA");
  const belumPulang = siswaList.filter((s) => !s.waktuPulang);

  return (
    <>
      <div className="space-y-3">
        <Trigger
          title="Siswa Belum Absen Hadir"
          icon={STATUS_CFG.ALPA.icon}
          iconBg={STATUS_CFG.ALPA.bg}
          iconColor={STATUS_CFG.ALPA.clr}
          badgeBg={STATUS_CFG.ALPA.clr}
          items={belumHadir}
          total={siswaList.length}
          onOpen={() => setActiveModal("hadir")}
        />
        <Trigger
          title="Siswa Belum Absen Pulang"
          icon={PULANG_CFG.icon}
          iconBg={PULANG_CFG.bg}
          iconColor={PULANG_CFG.clr}
          badgeBg={PULANG_CFG.clr}
          items={belumPulang}
          total={siswaList.length}
          onOpen={() => setActiveModal("pulang")}
        />
      </div>

      <AnimatePresence>
        {activeModal === "hadir" && (
          <DetailModal
            title="Siswa Belum Absen Hadir"
            icon={STATUS_CFG.ALPA.icon}
            iconBg={STATUS_CFG.ALPA.bg}
            iconColor={STATUS_CFG.ALPA.clr}
            emptyMessage="Semua siswa sudah absen hadir!"
            items={belumHadir}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === "pulang" && (
          <DetailModal
            title="Siswa Belum Absen Pulang"
            icon={PULANG_CFG.icon}
            iconBg={PULANG_CFG.bg}
            iconColor={PULANG_CFG.clr}
            emptyMessage="Semua siswa sudah absen pulang!"
            items={belumPulang}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
