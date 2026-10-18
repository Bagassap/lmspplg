"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, ChevronLeft, ClipboardList, Clock, FileText, Search, Paperclip,
  User as UserIcon, Users, CheckCircle2,
} from "lucide-react";
import { icon3dStyle, TONE_ORDER } from "@/components/shared/Icon3D";
import {
  formatTgl, formatTglJam, isTugasActive, statusInfo, type TugasItem, type TugasSubmisiItem,
} from "@/components/tugas/types";
import type { MateriItem } from "@/components/materi/MateriFormModal";

const ACCENT = "#3E03B3";
const PURPLE = "#3E03B3";

type Tab = "materi" | "tugas";
type Selected = { kind: "materi"; item: MateriItem; i: number } | { kind: "tugas"; item: TugasItem; i: number } | null;

const TIPE_LABEL: Record<string, string> = {
  SUBMIT: "Unggah File",
  PRAKTIK: "Praktik Kode",
  PILIHAN_GANDA: "Pilihan Ganda",
  ESSAY: "Esai",
};

function relDeadline(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Berakhir";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${Math.max(hours, 1)} jam lagi`;
  return `${Math.floor(hours / 24)} hari lagi`;
}

function Tile({ i, icon: Icon, size, iconSize, rounded }: {
  i: number; icon: React.ElementType; size: string; iconSize: number; rounded: string;
}) {
  return (
    <span className={`flex shrink-0 items-center justify-center ${size} ${rounded}`} style={icon3dStyle(TONE_ORDER[i % TONE_ORDER.length])}>
      <Icon size={iconSize} color="#fff" />
    </span>
  );
}

function MetaIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${color}22`, color }}>
      {children}
    </span>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${PURPLE}22`, color: PURPLE }}>
        <Icon size={13} />
      </span>
      <span className="flex-1 text-[13px] font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <span className="max-w-[55%] truncate text-right text-[13px] font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

export function SiswaAppMateriTugas({
  materi, tugas, loading, initialTab, onKumpulkan, onLihatSubmisi,
}: {
  materi: MateriItem[];
  tugas: TugasItem[];
  loading: boolean;
  initialTab: Tab;
  onKumpulkan: (t: TugasItem) => void;
  onLihatSubmisi: (s: TugasSubmisiItem, t: TugasItem) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [mapel, setMapel] = useState<string>("Semua");
  const [selected, setSelected] = useState<Selected>(null);

  const materiSorted = useMemo(
    () => [...materi].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [materi],
  );
  const tugasSorted = useMemo(() => {
    const aktif = tugas.filter(isTugasActive).sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
    const lewat = tugas.filter((t) => !isTugasActive(t)).sort((a, b) => +new Date(b.deadline) - +new Date(a.deadline));
    return [...aktif, ...lewat];
  }, [tugas]);

  const source = tab === "materi" ? materiSorted : tugasSorted;
  const mapelList = useMemo(
    () => ["Semua", ...Array.from(new Set(source.map((x) => x.mapel).filter(Boolean)))],
    [source],
  );

  const q = search.trim().toLowerCase();
  const filtered = source.filter(
    (x) => (mapel === "Semua" || x.mapel === mapel) && (!q || x.judul.toLowerCase().includes(q) || x.mapel.toLowerCase().includes(q)),
  );
  const featured = filtered.slice(0, 5);

  function switchTab(t: Tab) {
    setTab(t);
    setMapel("Semua");
    setSearch("");
  }

  function openDetail(item: MateriItem | TugasItem, i: number) {
    setSelected(tab === "materi" ? { kind: "materi", item: item as MateriItem, i } : { kind: "tugas", item: item as TugasItem, i });
  }

  function itemMeta(item: MateriItem | TugasItem) {
    if (tab === "materi") {
      return { icon: Clock, text: formatTgl((item as MateriItem).createdAt), done: false };
    }
    const t = item as TugasItem;
    if ((t.submisi?.length ?? 0) > 0) return { icon: CheckCircle2, text: "Terkumpul", done: true };
    return { icon: Clock, text: relDeadline(t.deadline), done: false };
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Belajar &amp; Praktik</p>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Materi &amp; Tugas</h1>
      </div>

      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "materi" ? "Cari materi..." : "Cari tugas..."}
          className="w-full rounded-full bg-slate-100 py-3.5 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#3E03B3]/30 dark:bg-slate-800 dark:text-slate-200"
        />
      </div>

      <div className="flex gap-7 border-b border-slate-200 dark:border-slate-700/60">
        {([["materi", "Materi"], ["tugas", "Tugas"]] as const).map(([key, label]) => {
          const active = tab === key;
          return (
            <button key={key} type="button" onClick={() => switchTab(key)}
              className="relative pb-3 text-[15px] font-semibold transition-colors"
              style={{ color: active ? ACCENT : "#94a3b8" }}>
              {label}
              {active && <motion.span layoutId="app-mt-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ background: ACCENT }} />}
            </button>
          );
        })}
      </div>

      {mapelList.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mapelList.map((m) => {
            const active = mapel === m;
            return (
              <button key={m} type="button" onClick={() => setMapel(m)}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                style={active ? { background: ACCENT, color: "#fff" } : { background: "#F1F5F9", color: "#475569" }}>
                {m}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          {q || mapel !== "Semua" ? "Tidak ada hasil" : tab === "materi" ? "Belum ada materi" : "Belum ada tugas"}
        </p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-extrabold text-slate-900 dark:text-white">
              {tab === "materi" ? "Materi Terbaru" : "Tugas Terdekat"}
            </h2>
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featured.map((item, i) => {
                const meta = itemMeta(item);
                return (
                  <motion.button
                    key={item.id} type="button" whileTap={{ scale: 0.97 }}
                    onClick={() => openDetail(item, i)}
                    className="w-44 shrink-0 rounded-3xl bg-white p-3 text-left shadow-[0_6px_20px_-6px_rgba(15,23,42,0.18)] dark:bg-[#1E293B]"
                  >
                    <Tile i={i} icon={tab === "materi" ? BookOpen : ClipboardList} size="h-24 w-full" iconSize={34} rounded="rounded-2xl" />
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 dark:text-white">{item.judul}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <MetaIcon color={PURPLE}><FileText size={10} /></MetaIcon>
                      <span className="truncate">{item.mapel}</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-sm font-extrabold" style={{ color: meta.done ? "#5D900F" : "#F26A3D" }}>
                      <meta.icon size={13} /> {meta.text}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold text-slate-900 dark:text-white">
              {tab === "materi" ? "Semua Materi" : "Semua Tugas"}
            </h2>
            <ul className="space-y-3">
              {filtered.map((item, i) => {
                const meta = itemMeta(item);
                return (
                  <li key={item.id}>
                    <motion.button
                      type="button" whileTap={{ scale: 0.98 }}
                      onClick={() => openDetail(item, i)}
                      className="flex w-full items-center gap-4 rounded-3xl bg-white p-3 text-left shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]"
                    >
                      <Tile i={i + 1} icon={tab === "materi" ? BookOpen : ClipboardList} size="h-16 w-16" iconSize={26} rounded="rounded-2xl" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{item.judul}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate">{item.mapel}</span>
                          <span>•</span>
                          <span className="shrink-0">{tab === "materi" ? formatTgl((item as MateriItem).createdAt) : formatTgl((item as TugasItem).deadline)}</span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold" style={{ color: meta.done ? "#5D900F" : "#F26A3D" }}>
                          <meta.icon size={12} /> {meta.text}
                        </p>
                      </div>
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <AnimatePresence>
        {selected && (
          <DetailScreen
            key={selected.item.id}
            selected={selected}
            onBack={() => setSelected(null)}
            onBuka={(id) => router.push(`/siswa/materi/${id}`)}
            onKumpulkan={(t) => { setSelected(null); onKumpulkan(t); }}
            onLihatSubmisi={(s, t) => { setSelected(null); onLihatSubmisi(s, t); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailScreen({ selected, onBack, onBuka, onKumpulkan, onLihatSubmisi }: {
  selected: NonNullable<Selected>;
  onBack: () => void;
  onBuka: (materiId: string) => void;
  onKumpulkan: (t: TugasItem) => void;
  onLihatSubmisi: (s: TugasSubmisiItem, t: TugasItem) => void;
}) {
  const isMateri = selected.kind === "materi";
  const m = isMateri ? selected.item : null;
  const t = !isMateri ? selected.item : null;

  const judul = (m ?? t)!.judul;
  const mapel = (m ?? t)!.mapel;
  const deskripsi = (m ?? t)!.deskripsi;
  const guru = (m ?? t)!.createdBy?.nama;
  const submisi = t?.submisi?.[0];
  const aktif = t ? isTugasActive(t) : true;

  const chip = m ? `${mapel} • ${formatTgl(m.createdAt)}` : `${mapel} • ${TIPE_LABEL[t!.tipe] ?? t!.tipe}`;
  const infoLine = m ? null : submisi ? `Status: ${statusInfo(submisi.status).label}` : aktif ? `Sisa waktu: ${relDeadline(t!.deadline)}` : "Waktu pengumpulan berakhir";

  let cta: { label: string; disabled?: boolean; onClick: () => void };
  if (m) cta = { label: "Buka Materi", onClick: () => onBuka(m.id) };
  else if (submisi) cta = { label: "Lihat Pengumpulan", onClick: () => onLihatSubmisi(submisi, t!) };
  else if (!aktif) cta = { label: "Waktu Habis", disabled: true, onClick: () => {} };
  else cta = { label: t!.tipe === "SUBMIT" ? "Kumpulkan Tugas" : "Kerjakan Sekarang", onClick: () => onKumpulkan(t!) };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white dark:bg-[#0F172A] lg:hidden"
    >
      <div className="relative h-60 shrink-0" style={icon3dStyle(TONE_ORDER[selected.i % TONE_ORDER.length])}>
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          {isMateri ? <BookOpen size={84} color="rgba(255,255,255,0.9)" /> : <ClipboardList size={84} color="rgba(255,255,255,0.9)" />}
        </div>
        <button type="button" onClick={onBack} aria-label="Kembali"
          className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md">
          <ChevronLeft size={20} />
        </button>
        <span className="absolute bottom-10 left-4 max-w-[85%] truncate rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-md">
          {chip}
        </span>
      </div>

      <div className="relative -mt-6 flex-1 rounded-t-[28px] bg-white px-5 pb-32 pt-6 dark:bg-[#0F172A]">
        <h1 className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-white">{judul}</h1>
        {guru && (
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <UserIcon size={14} /> {guru}
          </p>
        )}
        {infoLine && <p className="mt-2 text-lg font-extrabold" style={{ color: "#F26A3D" }}>{infoLine}</p>}

        <h2 className="mt-6 text-base font-extrabold text-slate-900 dark:text-white">Deskripsi</h2>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {deskripsi?.trim() || (isMateri ? "Belum ada deskripsi untuk materi ini." : "Belum ada deskripsi untuk tugas ini.")}
        </p>

        <h2 className="mt-6 text-base font-extrabold" style={{ color: ACCENT }}>Detail</h2>
        <div className="mt-3 space-y-2.5">
          <Row icon={FileText} label="Mata Pelajaran" value={mapel} />
          {m && <Row icon={Clock} label="Diunggah" value={formatTgl(m.createdAt)} />}
          {m && m.kelasList.length > 0 && <Row icon={Users} label="Kelas" value={m.kelasList.map((k) => k.nama).join(", ")} />}
          {m && <Row icon={Paperclip} label="Berkas" value={m.fileName ?? "Materi interaktif"} />}
          {t && <Row icon={ClipboardList} label="Jenis Tugas" value={TIPE_LABEL[t.tipe] ?? t.tipe} />}
          {t && <Row icon={Clock} label="Batas Waktu" value={formatTglJam(t.deadline)} />}
          {t && submisi && typeof submisi.nilai === "number" && <Row icon={CheckCircle2} label="Nilai" value={String(submisi.nilai)} />}
          {t?.fileUrl && <Row icon={Paperclip} label="Lampiran" value={t.fileName ?? "Unduh"} />}
        </div>
        {t?.fileUrl && (
          <a href={t.fileUrl} target="_blank" rel="noopener noreferrer"
            className="mt-3 block text-center text-sm font-bold underline" style={{ color: PURPLE }}>
            Buka lampiran tugas
          </a>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-white via-white/95 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 dark:from-[#0F172A] dark:via-[#0F172A]/95">
        <button type="button" onClick={cta.onClick} disabled={cta.disabled}
          className="w-full rounded-full py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(62,3,179,0.7)] transition active:scale-[0.98] disabled:opacity-50"
          style={{ background: ACCENT }}>
          {cta.label}
        </button>
      </div>
    </motion.div>
  );
}
