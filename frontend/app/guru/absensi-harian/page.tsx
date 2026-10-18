"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, CalendarDays, GraduationCap, BookOpen,
  ArrowRight, ChevronLeft, Eye, X,
  Users, TrendingUp, LogOut, FileText, Download, PieChart, Bell, Check,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { DokumenModal } from "@/components/absensi-harian/DokumenModal";
import { ExportButtons } from "@/components/absensi-harian/ExportButtons";
import { useExportRange } from "@/components/absensi-harian/useExportRange";
import { AbsensiHarianTable } from "@/components/absensi-harian/AbsensiHarianTable";
import { BelumAbsenPanel } from "@/components/absensi-harian/BelumAbsenPanel";
import { LaporanSeringTidakHadir } from "@/components/absensi-harian/LaporanSeringTidakHadir";
import { StatusBadge } from "@/components/absensi-harian/StatusBadge";
import { Avatar } from "@/components/shared/Avatar";
import { MobileDatePicker } from "@/components/shared/MobileDatePicker";
import { PageSizeToggle, paginate } from "@/components/shared/PageSizeToggle";
import {
  STATUS_CFG, PULANG_CFG, MONTH_NAMES, RANGE_MODE_CARDS, todayJakarta, formatTgl,
  avatarColor,
} from "@/components/absensi-harian/shared";
import { OptionCard3D } from "@/components/shared/Icon3D";
import type { Kelas, RekapKelas, SiswaAbsensi, StatusAbsensi, FilterAbsensi } from "@/components/absensi-harian/types";
import { AppCard, AppEmpty, AppSectionTitle } from "@/components/app/AppUI";
import { Rocket } from "@/components/app/Rocket";
import { icon3dStyle, MENU_TONE } from "@/components/shared/Icon3D";
import { useIsAppMode } from "@/lib/pwaInstall";
import { AppStatusSheet } from "@/components/app/AppUI";

function MiniStat({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex h-full w-full items-center gap-2 rounded-2xl border-2 border-transparent bg-slate-50 px-3 py-2.5 dark:bg-slate-700/30">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
        <p className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function KirimPengingatCard({ kelasId, tanggal, siswaList, bold }: { kelasId: string; tanggal: string; siswaList: SiswaAbsensi[]; bold?: boolean }) {
  const app = useIsAppMode();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const belum = siswaList.filter((s) => !s.status || s.status === "ALPA");

  async function kirim() {
    if (belum.length === 0 || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/absensi-harian/kirim-pengingat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasId, tanggal }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { toast.error("Gagal mengirim pengingat", data?.message ?? ""); return; }

      const text = belum.map((s, i) => `${i + 1}. ${s.nama}${s.nis ? ` (${s.nis})` : ""}`).join("\n");
      try { await navigator.clipboard.writeText(text); } catch {}

      setSent(true);
      toast.success("Pengingat terkirim!", `Notifikasi masuk ke ${data.count} siswa · daftar nama juga disalin untuk WA`);
      setTimeout(() => setSent(false), 2000);
    } catch {
      toast.error("Server tidak dapat dijangkau", "");
    } finally {
      setSending(false);
    }
  }

  if (bold) {
    return (
      <button type="button" onClick={kirim} disabled={belum.length === 0 || sending}
        className="flex h-full w-full flex-col justify-between rounded-3xl p-4 text-left transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ background: app ? "#F1EDFA" : "#A1F919" }}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ${app ? "text-[#3E03B3]" : "text-[#5D900F] dark:text-[#A1F919]"}`}>
          {sent ? <Check size={16} /> : <Bell size={16} />}
        </span>
        <div className="mt-2 min-w-0">
          <p className={`truncate text-sm font-extrabold ${app ? "text-slate-900" : "text-black"}`}>{sent ? "Terkirim!" : "Kirim Pengingat"}</p>
          <p className={`truncate text-[10.5px] font-semibold ${app ? "text-slate-500" : "text-black/70"}`}>
            {belum.length > 0 ? `${belum.length} siswa belum absen` : "Semua sudah absen"}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button type="button" onClick={kirim} disabled={belum.length === 0 || sending}
      className="flex h-full w-full items-center gap-2 rounded-2xl border-2 border-transparent bg-[#F6FEE8] px-3 py-2.5 text-left transition-all hover:border-[#F6FEE8] disabled:cursor-default disabled:opacity-50 dark:bg-[#48700B]/15 dark:hover:border-[#48700B]/60">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#A1F919] text-black">
        {sent ? <Check size={14} /> : <Bell size={14} />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#48700B] dark:text-[#A1F919]">{sent ? "Terkirim!" : "Kirim Pengingat"}</p>
        <p className="truncate text-[10px] font-semibold text-[#5D900F] dark:text-[#A1F919]/80">
          {belum.length > 0 ? `${belum.length} siswa belum absen` : "Semua sudah absen"}
        </p>
      </div>
    </button>
  );
}

function RingkasanKehadiranCard({
  kelasList, selectedId, onSelectKelas, kelasStat, siswaList, tanggal, rekap, hadirPct, total, pulangCount, belumAbsen, kelasNama,
}: {
  kelasList: Kelas[]; selectedId: string; onSelectKelas: (id: string) => void;
  kelasStat: (k: Kelas) => { hd: number; tt: number; pct: number };
  siswaList: SiswaAbsensi[]; tanggal: string;
  rekap: RekapKelas["rekap"]; hadirPct: number; total: number; pulangCount: number; belumAbsen: number; kelasNama?: string;
}) {
  const segments = [
    { key: "HADIR", value: rekap.HADIR, color: STATUS_CFG.HADIR.clr, label: STATUS_CFG.HADIR.label },
    { key: "IZIN", value: rekap.IZIN, color: STATUS_CFG.IZIN.clr, label: STATUS_CFG.IZIN.label },
    { key: "SAKIT", value: rekap.SAKIT, color: STATUS_CFG.SAKIT.clr, label: STATUS_CFG.SAKIT.label },
    { key: "ALPA", value: rekap.ALPA, color: STATUS_CFG.ALPA.clr, label: STATUS_CFG.ALPA.label },
  ];
  const r = 40;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  const statsPerKelas = kelasList.map((k) => ({ kelas: k, ...kelasStat(k) })).filter((s) => s.tt > 0);
  const avgPct = statsPerKelas.length > 0 ? Math.round(statsPerKelas.reduce((sum, s) => sum + s.pct, 0) / statsPerKelas.length) : 0;
  const terbaik = statsPerKelas.length > 0 ? statsPerKelas.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const terendah = statsPerKelas.length > 0 ? statsPerKelas.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  const showComparison = !!terbaik && !!terendah && terbaik.kelas.id !== terendah.kelas.id;
  const sudahAbsen = total - belumAbsen;
  const progresPct = total > 0 ? Math.round((sudahAbsen / total) * 100) : 0;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#3E03B3" }}>
          <PieChart size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-white">Ringkasan Kehadiran</p>
          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
            Distribusi status siswa hari ini{kelasNama ? ` · ${kelasNama}` : ""}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {showComparison ? (
          <>Rata-rata kehadiran <span className="font-bold text-slate-700 dark:text-slate-200">{avgPct}%</span> dari {kelasList.length} kelas hari ini ·
            tertinggi <span className="font-bold text-[#5D900F] dark:text-[#A1F919]">{terbaik!.kelas.nama} ({terbaik!.pct}%)</span> ·
            perlu perhatian <span className="font-bold text-[#5D900F] dark:text-[#A1F919]">{terendah!.kelas.nama} ({terendah!.pct}%)</span>
          </>
        ) : (
          <>Sudah <span className="font-bold text-slate-700 dark:text-slate-200">{sudahAbsen}</span> dari <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span> siswa tercatat absen hari ini
            {belumAbsen > 0 ? `, ${belumAbsen} lagi belum absen.` : ", semua siswa sudah absen."}
          </>
        )}
      </p>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] items-stretch justify-start gap-2.5">
            {kelasList.map((k) => {
              const s = kelasStat(k);
              const isSelected = k.id === selectedId;
              return (
                <button type="button" key={k.id} onClick={() => onSelectKelas(k.id)}
                  className={`flex h-full w-full items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left transition-all ${
                    isSelected
                      ? "border-[#3E03B3] bg-[#F1EDFA] dark:border-[#8F6DD3] dark:bg-[#000000]/20"
                      : "border-transparent bg-slate-50 hover:border-slate-200 dark:bg-slate-700/40 dark:hover:border-slate-600"
                  }`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    isSelected ? "bg-[#3E03B3] text-white" : "bg-white text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}>
                    <BookOpen size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-bold ${isSelected ? "text-[#3E03B3] dark:text-[#8F6DD3]" : "text-slate-700 dark:text-slate-200"}`}>
                      {k.nama}
                    </p>
                    <p className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {s.hd}/{s.tt} hadir · {s.pct}%
                    </p>
                  </div>
                </button>
              );
            })}

            <MiniStat icon={ClipboardCheck} value={`${sudahAbsen}/${total}`} label={`Progres absen · ${progresPct}%`} />
            <MiniStat icon={LogOut} value={pulangCount} label="Sudah pulang" />
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] justify-start gap-2.5">
            <div style={{ gridColumn: `1 / span ${kelasList.length + 2}` }}>
              <KirimPengingatCard kelasId={selectedId} tanggal={tanggal} siswaList={siswaList} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-6">
          <div className="flex flex-col gap-2.5">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-left">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.label} <span className="text-slate-700 dark:text-slate-200">{s.value}</span></span>
              </div>
            ))}
          </div>
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
              <circle cx="50" cy="50" r={r} stroke="#FFFFFF" strokeWidth="12" fill="none" />
              {total > 0 && segments.filter((s) => s.value > 0).map((s) => {
                const pct = s.value / total;
                const dash = pct * circumference;
                const offset = circumference * (1 - cumulative);
                cumulative += pct;
                return (
                  <circle key={s.key} cx="50" cy="50" r={r} stroke={s.color} strokeWidth="12" fill="none"
                    strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} strokeLinecap="round" />
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{hadirPct}%</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Hadir</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-700">
        <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          <Users size={12} className="text-[#3E03B3]" />
          Total {total} siswa
        </span>
      </div>
    </div>
  );
}

function KehadiranSlimCard({ hadirPct, kelasNama, onClick }: { hadirPct: number; kelasNama?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full flex-col rounded-3xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.98] dark:bg-[#1E293B]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Kehadiran Hari Ini{kelasNama ? ` · ${kelasNama}` : ""}
          </p>
          <p className="mt-0.5 text-2xl font-black text-slate-800 dark:text-white">{hadirPct}%</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ background: "#3E03B3" }}>
            <TrendingUp size={18} />
          </span>
          <ArrowRight size={16} className="text-slate-300" />
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div className="h-full rounded-full transition-all" style={{ width: `${hadirPct}%`, background: "#3E03B3" }} />
      </div>
    </button>
  );
}

function StatusRingRow({ label, icon: Icon, value, total, color, onClick }: {
  label: string; icon: React.ElementType; value: number; total: number; color: string; onClick: () => void;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const r = 15;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2 text-left">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
          <circle cx="18" cy="18" r={r} stroke="#FFFFFF" strokeWidth="4" fill="none" />
          <circle cx="18" cy="18" r={r} stroke={color} strokeWidth="4" fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round" />
        </svg>
        <Icon size={13} className="absolute" style={{ color }} />
      </div>
      <span className="flex-1 text-[13px] font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-white">
        {value}<span className="font-medium text-slate-400 dark:text-slate-500">/{total}</span>
      </span>
    </button>
  );
}

function FlatStatTile({ icon: Icon, value, label, bg, fg }: {
  icon: React.ElementType; value: string | number; label: string; bg: string; fg: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl p-4" style={{ background: bg }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white" style={{ color: bg }}>
        <Icon size={16} />
      </span>
      <div className="mt-2 min-w-0">
        <p className="truncate text-sm font-extrabold" style={{ color: fg }}>{value}</p>
        <p className="truncate text-[10.5px] font-semibold" style={{ color: fg }}>{label}</p>
      </div>
    </div>
  );
}

function MobileSiswaCard({
  s, isPulangView, kelasId, tanggal, onStatusUpdated, onOpenDokumen,
}: {
  s: SiswaAbsensi; isPulangView: boolean;
  kelasId?: string; tanggal?: string; onStatusUpdated?: () => void;
  onOpenDokumen: (s: SiswaAbsensi, source: "hadir" | "pulang") => void;
}) {
  const toast = useToast();
  const app = useIsAppMode();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const canEdit = !!kelasId && !!tanggal && !isPulangView;
  const ac = avatarColor(s.nama);
  const waktu = isPulangView ? s.waktuPulang : s.waktuAbsen;
  const lokasiRaw = isPulangView ? s.lokasiPulang : s.lokasi;
  const fotoRaw = isPulangView ? s.fotoPulang : s.foto;
  const ttdRaw = isPulangView ? s.ttdPulang : s.ttd;
  const hasDok = !!(ttdRaw || lokasiRaw || fotoRaw);
  const openDokumen = () => onOpenDokumen(s, isPulangView ? "pulang" : "hadir");

  async function saveStatus(status: StatusAbsensi) {
    if (!kelasId || !tanggal) return;
    setSaving(true);
    try {
      const res = await fetch("/api/absensi-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasId, tanggal, absensi: [{ siswaId: s.siswaId, status }] }),
      });
      if (res.ok) {
        toast.success("Status kehadiran diperbarui", "");
        onStatusUpdated?.();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal memperbarui status", "");
      }
    } catch {
      toast.error("Server tidak dapat dijangkau", "");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Avatar src={s.fotoProfil} nama={s.nama} sizePx={38} fallbackBg={ac} textClassName="text-[10px] font-extrabold" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{s.nama}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[10.5px] font-medium tabular-nums text-slate-400 dark:text-slate-500">{s.nis ?? "—"}</span>
          {waktu && <span className="text-[10.5px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">· {waktu}</span>}
        </div>
        {editing && app && (
          <AppStatusSheet
            nama={s.nama}
            current={s.status}
            saving={saving}
            onClose={() => setEditing(false)}
            onPick={(k) => saveStatus(k as StatusAbsensi)}
            options={[
              { key: "HADIR", label: "Hadir", desc: "Siswa hadir", icon: STATUS_CFG.HADIR.icon, tone: "emerald" },
              { key: "IZIN", label: "Izin", desc: "Izin tidak masuk", icon: STATUS_CFG.IZIN.icon, tone: "sky" },
              { key: "SAKIT", label: "Sakit", desc: "Sakit tidak masuk", icon: STATUS_CFG.SAKIT.icon, tone: "amber" },
              { key: "ALPA", label: "Alpa", desc: "Tanpa keterangan", icon: STATUS_CFG.ALPA.icon, tone: "violet" },
            ]}
          />
        )}
        {editing && !app && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {(["HADIR", "IZIN", "SAKIT", "ALPA"] as StatusAbsensi[]).map((st) => {
              const cfg = STATUS_CFG[st];
              const active = s.status === st;
              return (
                <button key={st} type="button" disabled={saving} onClick={() => saveStatus(st)}
                  className="rounded-lg border px-2 py-1 text-[10px] font-bold transition-all disabled:cursor-wait disabled:opacity-50"
                  style={{
                    backgroundColor: active ? cfg.bg : "transparent",
                    color: active ? cfg.clr : "#94a3b8",
                    borderColor: active ? cfg.clr + "60" : "#e2e8f040",
                  }}>
                  {cfg.label}
                </button>
              );
            })}
            <button type="button" onClick={() => setEditing(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400">
              <Check size={12} />
            </button>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {isPulangView ? (
          <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold"
            style={{ backgroundColor: PULANG_CFG.bg, color: PULANG_CFG.clr }}>
            <PULANG_CFG.icon size={9} /> Pulang
          </span>
        ) : (
          <button type="button" onClick={() => canEdit && setEditing((v) => !v)} disabled={!canEdit}>
            <StatusBadge status={s.status} />
          </button>
        )}
        {hasDok && (
          <button onClick={openDokumen}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: "#3E03B3" }}>
            <Eye size={10} /> Lihat
          </button>
        )}
      </div>
    </div>
  );
}

export default function GuruAbsensiHarianPage() {
  const router = useRouter();
  const appMode = useIsAppMode();
  const toast = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tanggal, setTanggal] = useState(() => todayJakarta());
  const exportRange = useExportRange(tanggal);
  const [rekapAll, setRekapAll] = useState<RekapKelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [dokumenSiswa, setDokumenSiswa] = useState<SiswaAbsensi | null>(null);
  const [dokumenSource, setDokumenSource] = useState<"hadir" | "pulang">("hadir");
  const [activeFilter, setActiveFilter] = useState<FilterAbsensi | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState<number>(10);
  const [laporanOpen, setLaporanOpen] = useState(false);
  const [statusPageOpen, setStatusPageOpen] = useState(false);

  useEffect(() => {
    fetch("/api/kelas/saya")
      .then((r) => r.json())
      .then((list: Kelas[]) => {
        setKelasList(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadRekap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi-harian?tanggal=${tanggal}`);
      const list = await res.json().catch(() => []);
      setRekapAll(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Gagal memuat data absensi", "");
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => { loadRekap(); }, [loadRekap]);

  useEffect(() => { setTablePage(0); }, [selectedId, tanggal, activeFilter, tablePageSize]);

  const selectedKelas = kelasList.find((k) => k.id === selectedId);
  const selected = rekapAll.find((r) => r.kelasId === selectedId) ?? null;
  const siswaList = selected?.siswa ?? [];
  const rekap = selected?.rekap ?? { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
  const pulangCount = selected?.pulangCount ?? 0;
  const total = siswaList.length;
  const sudahAbsen = siswaList.filter((s) => s.status !== null).length;
  const hadirPct = total > 0 ? Math.round((rekap.HADIR / total) * 100) : 0;

  function kelasStat(k: Kelas) {
    const r = rekapAll.find((x) => x.kelasId === k.id);
    const hd = r?.rekap.HADIR ?? 0;
    const tt = r?.siswa.length ?? k._count?.siswa ?? 0;
    return { hd, tt, pct: tt > 0 ? Math.round((hd / tt) * 100) : 0 };
  }

  const filteredSiswa = !activeFilter
    ? siswaList
    : activeFilter === "PULANG"
      ? siswaList.filter((s) => !!s.waktuPulang)
      : siswaList.filter((s) => s.status === activeFilter);
  const { pageItems: pagedSiswa, pageCount: tablePageCount, start: tableStart, end: tableEnd } = paginate(filteredSiswa, tablePage, tablePageSize);

  function toggleFilter(key: FilterAbsensi) {
    setActiveFilter((prev) => (prev === key ? null : key));
  }

  const filterOptions: { key: FilterAbsensi | null; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { key: null, label: "Semua", icon: Users, count: total, color: "#334155" },
    { key: "HADIR", label: "Hadir", icon: STATUS_CFG.HADIR.icon, count: rekap.HADIR, color: STATUS_CFG.HADIR.clr },
    { key: "IZIN", label: "Izin", icon: STATUS_CFG.IZIN.icon, count: rekap.IZIN, color: STATUS_CFG.IZIN.clr },
    { key: "SAKIT", label: "Sakit", icon: STATUS_CFG.SAKIT.icon, count: rekap.SAKIT, color: STATUS_CFG.SAKIT.clr },
    { key: "ALPA", label: "Alpa", icon: STATUS_CFG.ALPA.icon, count: rekap.ALPA, color: STATUS_CFG.ALPA.clr },
    { key: "PULANG", label: "Pulang", icon: PULANG_CFG.icon, count: pulangCount, color: PULANG_CFG.clr },
  ];

  if (kelasList.length === 0) {
    return (
      <>
        <div className="hidden space-y-5 p-1 lg:block">
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
                style={{ background: "linear-gradient(145deg, #00AAFA 0%, #3E03B3 55%, #2D0281 100%)" }}>
                <ClipboardCheck size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden" />
                <ClipboardCheck size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold leading-tight text-slate-800 dark:text-white sm:text-2xl">Absensi Harian</h1>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Presensi kehadiran harian siswa</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <GraduationCap size={24} className="text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Anda belum menjadi wali kelas manapun</p>
            <p className="max-w-sm text-xs text-slate-400">Hubungi admin untuk ditetapkan sebagai wali kelas agar dapat mengelola absensi harian.</p>
          </div>
        </div>

        {appMode ? (
          <div className="space-y-5 lg:hidden">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Presensi Wajib Harian</p>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Absensi Harian</h1>
            </div>
            <AppEmpty icon={GraduationCap} title="Anda belum menjadi wali kelas manapun" desc="Hubungi admin untuk ditetapkan sebagai wali kelas agar dapat mengelola absensi harian." />
          </div>
        ) : (
        <div className="relative -m-4 lg:hidden" style={{ background: "#3E03B3" }}>
          <div className="relative flex items-center px-4 pb-3 pt-4">
            <button type="button" onClick={() => router.push("/guru/dashboard")}
              className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
              <ChevronLeft size={18} />
            </button>
            <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Absensi Harian</h1>
          </div>
          <div className="rounded-t-[28px] bg-[#FFFFFF] p-4 dark:bg-[#1E293B]">
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1E293B]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <GraduationCap size={24} className="text-slate-300 dark:text-slate-500" />
              </div>
              <p className="px-6 text-sm font-semibold text-slate-500 dark:text-slate-300">Anda belum menjadi wali kelas manapun</p>
              <p className="max-w-xs px-6 text-xs text-slate-400">Hubungi admin untuk ditetapkan sebagai wali kelas agar dapat mengelola absensi harian.</p>
            </div>
          </div>
        </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="hidden space-y-5 p-1 lg:block">
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
                style={{ background: "linear-gradient(145deg, #00AAFA 0%, #3E03B3 55%, #2D0281 100%)" }}>
                <ClipboardCheck size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden" />
                <ClipboardCheck size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Presensi Wajib Harian</span>
                <h1 className="text-xl font-extrabold leading-tight text-slate-800 dark:text-white sm:text-2xl">Absensi Harian</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <RingkasanKehadiranCard
                kelasList={kelasList} selectedId={selectedId} onSelectKelas={setSelectedId} kelasStat={kelasStat}
                siswaList={siswaList} tanggal={tanggal} rekap={rekap} hadirPct={hadirPct} total={total}
                pulangCount={pulangCount} belumAbsen={total - sudahAbsen} kelasNama={selectedKelas?.nama} />
            </div>

            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Keterangan Absensi</p>
                <a href="#status-kehadiran-hari-ini"
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  More <ArrowRight size={12} />
                </a>
              </div>
              <BelumAbsenPanel siswaList={siswaList} />
            </div>
          </div>
        </div>

        <div id="status-kehadiran-hari-ini" className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Status Kehadiran Hari Ini <span className="font-medium text-slate-400">({total})</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatTgl(tanggal)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50 sm:w-full sm:max-w-xs">
                <CalendarDays size={14} className="shrink-0 text-slate-400" />
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none dark:text-slate-200" />
              </div>
            </div>

            <div className="mt-6 mb-2 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-6 pb-2 dark:border-slate-700">
              <span className="mr-1 text-xs font-semibold text-slate-400">Status:</span>
              {filterOptions.map((opt) => {
                const active = activeFilter === opt.key;
                return (
                  <button key={String(opt.key)} type="button"
                    onClick={() => (opt.key === null ? setActiveFilter(null) : toggleFilter(opt.key))}
                    className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={active ? { backgroundColor: opt.color, color: "#fff" } : {}}>
                    <span className={`flex items-center gap-2 ${active ? "text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"}`}>
                      <opt.icon size={16} />
                      {opt.label}
                      <span className={`rounded-md px-2 py-0.5 text-xs ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                        {opt.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[11px] dark:border-slate-700">
              <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <Users size={12} className="text-[#3E03B3]" />
                Total {total} siswa
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <TrendingUp size={12} className="text-[#3E03B3]" />
                Kehadiran {hadirPct}%
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <LogOut size={12} className="text-[#3E03B3]" />
                Sudah pulang {pulangCount} siswa
              </span>
            </div>

            <div className="mt-4 -mx-5 -mb-5 overflow-hidden rounded-b-3xl border-t border-slate-100 dark:border-slate-700">
              <AbsensiHarianTable
                loading={loading}
                hasSiswa={siswaList.length > 0}
                filteredSiswa={filteredSiswa}
                pagedSiswa={pagedSiswa}
                tableStart={tableStart}
                tableEnd={tableEnd}
                activeFilter={activeFilter}
                tablePage={tablePage}
                setTablePage={setTablePage}
                tablePageCount={tablePageCount}
                tablePageSize={tablePageSize}
                setTablePageSize={setTablePageSize}
                onOpenDokumen={(s, source) => { setDokumenSiswa(s); setDokumenSource(source); }}
                kelasId={selectedId}
                tanggal={tanggal}
                onStatusUpdated={loadRekap}
              />
            </div>
          </div>

          <div className="flex h-full flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#3E03B3" }}>
                  <FileText size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Unduh Laporan</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Ekspor rekap absensi ke PDF/Excel</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {RANGE_MODE_CARDS.map((opt) => (
                  <OptionCard3D key={opt.key} icon={opt.icon} tone={opt.tone} label={opt.label} caption={opt.caption}
                    active={exportRange.rangeMode === opt.key} onClick={() => exportRange.setRangeMode(opt.key)} />
                ))}
              </div>

              {exportRange.rangeMode === "mingguan" && (
                <input type="date" value={exportRange.weekAnchor} onChange={(e) => exportRange.setWeekAnchor(e.target.value)}
                  title={`Minggu: ${formatTgl(exportRange.weekRange.start)} – ${formatTgl(exportRange.weekRange.end)}`}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200" />
              )}

              {exportRange.rangeMode === "bulanan" && (
                <div className="mt-2 flex items-center gap-1.5">
                  <select value={exportRange.bulan} onChange={(e) => exportRange.setBulan(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={exportRange.tahun} onChange={(e) => exportRange.setTahun(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              <div className="mt-3">
                <ExportButtons kelasId={selectedId} kelasNama={selectedKelas?.nama ?? "Kelas"} range={exportRange.range} siswaList={siswaList} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                <Download size={11} className="shrink-0 text-[#3E03B3]" />
                Pilih rentang waktu, lalu klik salah satu tombol ekspor
              </p>
            </div>

            <LaporanSeringTidakHadir kelasId={selectedId} kelasNama={selectedKelas?.nama} />
          </div>
        </div>
      </div>

      {appMode && (
        <div className="space-y-6 lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Presensi Wajib Harian</p>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Absensi Harian</h1>
            </div>
            <MobileDatePicker value={tanggal} onChange={setTanggal} />
          </div>

          {kelasList.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {kelasList.map((k) => (
                <button key={k.id} type="button" onClick={() => setSelectedId(k.id)}
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                  style={selectedId === k.id ? { background: "#3E03B3", color: "#fff" } : { background: "#F1F5F9", color: "#475569" }}>
                  {k.nama}
                </button>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setStatusPageOpen(true)}
            className="relative flex w-full items-center overflow-hidden rounded-3xl px-5 py-6 text-left active:scale-[0.99]" style={{ background: "#F1EDFA" }}>
            <div className="relative z-10 flex-1">
              <p className="text-xs font-semibold text-slate-500">Kehadiran hari ini{selectedKelas?.nama ? ` · ${selectedKelas.nama}` : ""}</p>
              <p className="mt-0.5 text-[34px] font-extrabold leading-none tabular-nums" style={{ color: "#3E03B3" }}>{hadirPct}%</p>
              <p className="mt-1.5 text-sm font-semibold text-slate-700">{rekap.HADIR} dari {total} siswa hadir</p>
            </div>
            <div className="relative z-10 -my-2 h-24 w-24 shrink-0"><Rocket /></div>
          </button>

          <section className="space-y-3">
            <AppSectionTitle>Progres &amp; Pengingat</AppSectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col justify-between gap-3 rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={icon3dStyle(MENU_TONE.absensi)}>
                  <ClipboardCheck size={22} color="#fff" />
                </span>
                <div>
                  <p className="text-xl font-extrabold leading-none text-slate-900 dark:text-white">{sudahAbsen}/{total}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Progres Absen</p>
                </div>
              </div>
              <KirimPengingatCard kelasId={selectedId} tanggal={tanggal} siswaList={siswaList} bold />
            </div>
          </section>

          <section>
            <AppSectionTitle>Rincian Status</AppSectionTitle>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {([
                { key: "HADIR" as const, label: "Hadir", value: rekap.HADIR, tone: "emerald" as const, icon: STATUS_CFG.HADIR.icon },
                { key: "IZIN" as const, label: "Izin", value: rekap.IZIN, tone: "sky" as const, icon: STATUS_CFG.IZIN.icon },
                { key: "SAKIT" as const, label: "Sakit", value: rekap.SAKIT, tone: "amber" as const, icon: STATUS_CFG.SAKIT.icon },
                { key: "ALPA" as const, label: "Alpa", value: rekap.ALPA, tone: "violet" as const, icon: STATUS_CFG.ALPA.icon },
              ]).map((r) => (
                <button key={r.key} type="button" onClick={() => { setActiveFilter(r.key); setStatusPageOpen(true); }}
                  className="flex flex-col items-center gap-2 active:scale-95">
                  <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(r.tone)}>
                    <r.icon size={26} color="#fff" />
                  </span>
                  <span className="text-lg font-extrabold leading-none text-slate-900 dark:text-white">{r.value}</span>
                  <span className="-mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{r.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <AppSectionTitle>Belum Absen</AppSectionTitle>
            <AppCard><BelumAbsenPanel siswaList={siswaList} compact /></AppCard>
          </section>

          <LaporanSeringTidakHadir kelasId={selectedId} kelasNama={selectedKelas?.nama} cta />
        </div>
      )}
      <div className={appMode ? "hidden" : "contents"}>
      <div className="relative -m-4 lg:hidden" style={{ background: "#3E03B3" }}>
        <div className="relative flex items-center justify-between px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/guru/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Absensi Harian</h1>
          <MobileDatePicker value={tanggal} onChange={setTanggal} light />
        </div>

        <div className="space-y-4 rounded-t-[28px] bg-[#FFFFFF] p-4 dark:bg-[#1E293B]">

          <KehadiranSlimCard hadirPct={hadirPct} kelasNama={selectedKelas?.nama} onClick={() => setStatusPageOpen(true)} />

          <div className="grid grid-cols-2 gap-2.5">
            <FlatStatTile icon={ClipboardCheck} value={`${sudahAbsen}/${total}`} label="Progres Absen"
              bg="#00AAFA" fg="#FFFFFF" />
            <KirimPengingatCard kelasId={selectedId} tanggal={tanggal} siswaList={siswaList} bold />
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1E293B]">
            <p className="text-[12.5px] font-bold text-slate-800 dark:text-white">Rincian Status</p>
            <div className="mt-1 divide-y divide-slate-100 dark:divide-slate-700/40">
              <StatusRingRow label="Hadir" icon={STATUS_CFG.HADIR.icon} value={rekap.HADIR} total={total}
                color={STATUS_CFG.HADIR.clr} onClick={() => setActiveFilter("HADIR")} />
              <StatusRingRow label="Izin" icon={STATUS_CFG.IZIN.icon} value={rekap.IZIN} total={total}
                color={STATUS_CFG.IZIN.clr} onClick={() => setActiveFilter("IZIN")} />
              <StatusRingRow label="Sakit" icon={STATUS_CFG.SAKIT.icon} value={rekap.SAKIT} total={total}
                color={STATUS_CFG.SAKIT.clr} onClick={() => setActiveFilter("SAKIT")} />
              <StatusRingRow label="Alpa" icon={STATUS_CFG.ALPA.icon} value={rekap.ALPA} total={total}
                color={STATUS_CFG.ALPA.clr} onClick={() => setActiveFilter("ALPA")} />
            </div>
            <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-700/40">
              <BelumAbsenPanel siswaList={siswaList} compact />
            </div>
          </div>

          <LaporanSeringTidakHadir kelasId={selectedId} kelasNama={selectedKelas?.nama} cta />
        </div>
      </div>
      </div>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {statusPageOpen && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-50 flex flex-col bg-[#FFFFFF] dark:bg-[#1E293B]">
              <div className="shrink-0 pb-3 pt-4" style={{ background: appMode ? "#F1EDFA" : "#3E03B3" }}>
                <div className="relative flex items-center justify-between px-4">
                  <button type="button" onClick={() => setStatusPageOpen(false)}
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${appMode ? "bg-white text-slate-700" : "bg-white/15 text-white active:bg-white/25"}`}>
                    <ChevronLeft size={18} />
                  </button>
                  <h1 className={`absolute inset-x-0 text-center text-base font-bold ${appMode ? "text-slate-900" : "text-white"}`}>
                    Status Kehadiran <span className={`font-medium ${appMode ? "text-slate-500" : "text-white/70"}`}>({total})</span>
                  </h1>
                  <button type="button" onClick={() => setLaporanOpen(true)}
                    className={`relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 active:scale-95 ${appMode ? "text-white" : "bg-white"}`} style={appMode ? { background: "#3E03B3" } : { color: "#3E03B3" }}>
                    <Download size={12} />
                    <span className="text-[11px] font-bold">Unduh</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {filterOptions.map((opt) => {
                    const active = activeFilter === opt.key;
                    return (
                      <button key={String(opt.key)} type="button"
                        onClick={() => (opt.key === null ? setActiveFilter(null) : toggleFilter(opt.key))}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
                        style={active ? { backgroundColor: opt.color, color: "#fff" } : { backgroundColor: "#fff" }}>
                        <opt.icon size={13} className={active ? "text-white" : "text-slate-400"} />
                        <span className={active ? "text-white" : "text-slate-500 dark:text-slate-300"}>{opt.label}</span>
                        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold dark:bg-slate-700"
                          style={active ? { color: opt.color } : undefined}>
                          {opt.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 overflow-hidden rounded-3xl bg-white dark:bg-[#1E293B]">
                  {loading ? (
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
                          <div className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                        </div>
                      ))}
                    </div>
                  ) : filteredSiswa.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <Users size={22} className="text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        {siswaList.length === 0 ? "Belum ada siswa di kelas ini" : "Tidak ada siswa dengan status ini"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 px-4 dark:divide-slate-700/40">
                      {pagedSiswa.map((s) => (
                        <MobileSiswaCard key={s.siswaId} s={s} isPulangView={activeFilter === "PULANG"}
                          kelasId={selectedId} tanggal={tanggal} onStatusUpdated={loadRekap} onOpenDokumen={(sw, source) => { setDokumenSiswa(sw); setDokumenSource(source); }} />
                      ))}
                    </div>
                  )}
                </div>

                {filteredSiswa.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-2xl bg-white px-4 py-3 dark:bg-[#1E293B]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">{tableStart}–{tableEnd} dari {filteredSiswa.length}</span>
                      <PageSizeToggle value={tablePageSize} onChange={setTablePageSize} />
                    </div>
                    {tablePageCount > 1 && (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setTablePage((p) => Math.max(0, p - 1))} disabled={tablePage === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500">
                          <ChevronLeft size={14} />
                        </button>
                        <span className="px-1.5 text-xs font-bold text-slate-500 dark:text-slate-300">{tablePage + 1}/{tablePageCount}</span>
                        <button onClick={() => setTablePage((p) => Math.min(tablePageCount - 1, p + 1))} disabled={tablePage >= tablePageCount - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500">
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {laporanOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setLaporanOpen(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 flex w-full flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-[#1E293B]"
                style={{ maxHeight: "88vh" }}>
                <div className="flex items-center justify-between px-5 pt-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: appMode ? "#3E03B3" : "#3E03B3" }}>
                      <FileText size={16} />
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Unduh Laporan</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Ekspor rekap absensi ke PDF/Excel</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setLaporanOpen(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <X size={15} />
                  </button>
                </div>

                <div className="overflow-y-auto px-5 pb-6 pt-4">
                  <div className="grid grid-cols-1 gap-2">
                    {RANGE_MODE_CARDS.map((opt) => (
                      <OptionCard3D key={opt.key} icon={opt.icon} tone={opt.tone} label={opt.label} caption={opt.caption}
                        active={exportRange.rangeMode === opt.key} onClick={() => exportRange.setRangeMode(opt.key)} />
                    ))}
                  </div>

                  {exportRange.rangeMode === "mingguan" && (
                    <input type="date" value={exportRange.weekAnchor} onChange={(e) => exportRange.setWeekAnchor(e.target.value)}
                      title={`Minggu: ${formatTgl(exportRange.weekRange.start)} – ${formatTgl(exportRange.weekRange.end)}`}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200" />
                  )}

                  {exportRange.rangeMode === "bulanan" && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <select value={exportRange.bulan} onChange={(e) => exportRange.setBulan(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                        {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                      <select value={exportRange.tahun} onChange={(e) => exportRange.setTahun(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                        {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="mt-4">
                    <ExportButtons kelasId={selectedId} kelasNama={selectedKelas?.nama ?? "Kelas"} range={exportRange.range} siswaList={siswaList} />
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    <Download size={11} className="shrink-0 text-[#3E03B3]" />
                    Pilih rentang waktu, lalu ketuk salah satu tombol ekspor
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <AnimatePresence>
        {dokumenSiswa && (
          <DokumenModal siswa={dokumenSiswa} tanggal={tanggal} kelas={selectedKelas?.nama ?? ""} source={dokumenSource} onClose={() => setDokumenSiswa(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
