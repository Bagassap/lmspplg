"use client";

import { DateInputID } from "@/components/shared/DateInputID";
import { TimeInput24 } from "@/components/shared/TimeInput24";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Clock, LogIn, LogOut, Plus, Trash2, X, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { useIsAppMode } from "@/lib/pwaInstall";
import { AppSheet } from "@/components/app/AppSheet";
import { icon3dStyle } from "@/components/shared/Icon3D";

type JadwalHariIni = {
  tanggal: string;
  isWeekend: boolean;
  hadirStartMinutes: number;
  hadirEndMinutes: number;
  pulangStartMinutes: number;
  pulangEndMinutes: number;
  override: { keterangan: string | null } | null;
};

type JadwalOverride = {
  id: string;
  tanggal: string;
  hadirStartMinutes: number | null;
  hadirEndMinutes: number | null;
  pulangStartMinutes: number | null;
  pulangEndMinutes: number | null;
  keterangan: string | null;
  createdBy: { nama: string } | null;
};

function minutesToTimeInput(minutes: number | null | undefined): string {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function timeInputToMinutes(value: string): number | undefined {
  if (!value) return undefined;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined;
  return h * 60 + m;
}
function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}.${m}`;
}
function fmtRangeWib(start: number, end: number): string {
  return `${fmtMinutes(start)} - ${fmtMinutes(end)} WIB`;
}
function todayJakartaStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}
function formatTanggalWib(tgl: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...opts }).format(new Date(`${tgl}T00:00:00Z`));
}

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all focus:border-[#3E03B3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200";
const LABEL = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500";

export function JadwalAbsenCard() {
  const toast = useToast();
  const app = useIsAppMode();
  const [hariIni, setHariIni] = useState<JadwalHariIni | null>(null);
  const [list, setList] = useState<JadwalOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tanggal: todayJakartaStr(),
    hadirStart: "", hadirEnd: "", pulangStart: "", pulangEnd: "", keterangan: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, lRes] = await Promise.all([
        fetch("/api/absensi-harian/jadwal-override/hari-ini"),
        fetch("/api/absensi-harian/jadwal-override"),
      ]);
      if (hRes.ok) setHariIni(await hRes.json());
      if (lRes.ok) setList(await lRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openForm(preset?: Partial<typeof form>) {
    setForm({
      tanggal: todayJakartaStr(),
      hadirStart: "", hadirEnd: "", pulangStart: "", pulangEnd: "", keterangan: "",
      ...preset,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/absensi-harian/jadwal-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: form.tanggal,
          hadirStartMinutes: timeInputToMinutes(form.hadirStart),
          hadirEndMinutes: timeInputToMinutes(form.hadirEnd),
          pulangStartMinutes: timeInputToMinutes(form.pulangStart),
          pulangEndMinutes: timeInputToMinutes(form.pulangEnd),
          keterangan: form.keterangan || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Gagal menyimpan jadwal");
      toast.success("Jadwal disimpan", `Jadwal absen ${formatTanggalWib(form.tanggal)} berhasil disesuaikan`);
      setShowForm(false);
      load();
    } catch (e) {
      toast.error("Gagal menyimpan jadwal", e instanceof Error ? e.message : "Coba lagi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tanggal: string) {
    if (!confirm(`Hapus penyesuaian jadwal untuk tanggal ${formatTanggalWib(tanggal)}? Jadwal akan kembali normal.`)) return;
    try {
      const res = await fetch(`/api/absensi-harian/jadwal-override/${tanggal}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Gagal menghapus jadwal");
      toast.success("Jadwal dihapus", "Jadwal kembali normal untuk tanggal ini");
      load();
    } catch (e) {
      toast.error("Gagal menghapus jadwal", e instanceof Error ? e.message : "Coba lagi");
    }
  }

  const isOverriddenToday = !!hariIni?.override;

  if (app) {
    const FIELD = "h-11 w-full rounded-2xl border-0 bg-[#F1EDFA] px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E03B3]";
    const CAP = "mb-1 block text-xs font-bold text-slate-700";
    return (
      <>
        <div className="rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle("violet")}>
              <CalendarClock size={22} color="#fff" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">Jadwal Absen</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Jam absen datang &amp; pulang (WIB)</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
          ) : hariIni ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {formatTanggalWib(hariIni.tanggal, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[#E3F8EF] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#059669]"><LogIn size={12} /> Datang</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{hariIni.isWeekend ? "Libur" : fmtRangeWib(hariIni.hadirStartMinutes, hariIni.hadirEndMinutes)}</p>
                </div>
                <div className="rounded-2xl bg-[#E0F2FE] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#0284C7]"><LogOut size={12} /> Pulang</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{hariIni.isWeekend ? "Libur" : fmtRangeWib(hariIni.pulangStartMinutes, hariIni.pulangEndMinutes)}</p>
                </div>
              </div>
              {isOverriddenToday && (
                <p className="mt-2 flex items-start gap-1.5 rounded-2xl bg-[#FFF4E0] px-3 py-2 text-xs font-semibold text-slate-800">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-[#D97706]" />
                  <span>Jadwal hari ini disesuaikan{hariIni.override?.keterangan ? ` — ${hariIni.override.keterangan}` : ""}</span>
                </p>
              )}
            </div>
          ) : null}

          {list.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Penyesuaian jadwal</p>
              {list.map((o) => (
                <div key={o.id} className="flex items-center gap-2 rounded-2xl bg-[#F1EDFA] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{formatTanggalWib(o.tanggal)}</p>
                    <p className="truncate text-xs text-slate-600">
                      {[
                        o.hadirStartMinutes != null || o.hadirEndMinutes != null
                          ? `Datang ${o.hadirStartMinutes != null ? fmtMinutes(o.hadirStartMinutes) : "—"}-${o.hadirEndMinutes != null ? fmtMinutes(o.hadirEndMinutes) : "—"}`
                          : null,
                        o.pulangStartMinutes != null || o.pulangEndMinutes != null
                          ? `Pulang ${o.pulangStartMinutes != null ? fmtMinutes(o.pulangStartMinutes) : "—"}-${o.pulangEndMinutes != null ? fmtMinutes(o.pulangEndMinutes) : "—"}`
                          : null,
                        o.keterangan,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleDelete(o.tanggal)} aria-label="Hapus"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#F26A3D]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => openForm()}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white active:scale-[0.98]">
            <Plus size={16} /> Atur Jadwal
          </button>
        </div>

        <AppSheet open={showForm} onClose={() => setShowForm(false)} title="Atur Jadwal Absen" subtitle="Kosongkan jam yang tidak ingin diubah · WIB"
          footer={
            <button type="submit" form="jadwal-form" disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-60">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Menyimpan..." : "Simpan Jadwal"}
            </button>
          }>
          <form id="jadwal-form" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={CAP}>Tanggal</label>
              <DateInputID value={form.tanggal} onChange={(v) => setForm((f) => ({ ...f, tanggal: v }))} className={FIELD} required />
            </div>
            <div className="rounded-2xl bg-[#E3F8EF] p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#059669]"><LogIn size={13} /> Absen Datang</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={CAP}>Mulai</label>
                  <TimeInput24 value={form.hadirStart} onChange={(v) => setForm((f) => ({ ...f, hadirStart: v }))} className={`${FIELD} bg-white`} />
                </div>
                <div>
                  <label className={CAP}>Selesai</label>
                  <TimeInput24 value={form.hadirEnd} onChange={(v) => setForm((f) => ({ ...f, hadirEnd: v }))} className={`${FIELD} bg-white`} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#E0F2FE] p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#0284C7]"><LogOut size={13} /> Absen Pulang</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={CAP}>Mulai</label>
                  <TimeInput24 value={form.pulangStart} onChange={(v) => setForm((f) => ({ ...f, pulangStart: v }))} className={`${FIELD} bg-white`} />
                </div>
                <div>
                  <label className={CAP}>Selesai</label>
                  <TimeInput24 value={form.pulangEnd} onChange={(v) => setForm((f) => ({ ...f, pulangEnd: v }))} className={`${FIELD} bg-white`} />
                </div>
              </div>
            </div>
            <div>
              <label className={CAP}>Keterangan (opsional)</label>
              <textarea rows={2} value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                placeholder="Contoh: Pulang lebih awal karena acara sekolah" className="w-full resize-none rounded-2xl border-0 bg-[#F1EDFA] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3]" />
            </div>
          </form>
        </AppSheet>
      </>
    );
  }

  return (
    <div className="card-pisah rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#3E03B3" }}>
            <CalendarClock size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Jadwal Absen</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Atur jam absen datang & pulang (WIB)</p>
          </div>
        </div>
        <motion.button
          type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => openForm()}
          className="flex items-center gap-1 rounded-lg bg-[#3E03B3] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#3E03B3]"
        >
          <Plus size={13} /> Atur Jadwal
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
      ) : hariIni ? (
        <div className="grid grid-cols-2 gap-2.5">
          <p className="col-span-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Clock size={11} className="text-[#3E03B3]" />
            {formatTanggalWib(hariIni.tanggal, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · WIB
          </p>
          <div className="rounded-2xl border border-slate-100 p-3 dark:border-slate-700/50">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <LogIn size={11} className="text-[#5D900F] dark:text-[#C4B5FD]" /> Absen Datang
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
              {hariIni.isWeekend ? "Libur" : fmtRangeWib(hariIni.hadirStartMinutes, hariIni.hadirEndMinutes)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 p-3 dark:border-slate-700/50">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <LogOut size={11} className="text-[#00AAFA]" /> Absen Pulang
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
              {hariIni.isWeekend ? "Libur" : fmtRangeWib(hariIni.pulangStartMinutes, hariIni.pulangEndMinutes)}
            </p>
          </div>
          {isOverriddenToday && (
            <div className="col-span-2 flex items-start gap-1.5 rounded-xl bg-[#FFFFFF] px-3 py-2 text-[11px] text-[#000000] dark:bg-slate-700 dark:text-[#C4B5FD]">
              <Sparkles size={12} className="mt-0.5 shrink-0" />
              <span>Jadwal hari ini disesuaikan{hariIni.override?.keterangan ? ` — ${hariIni.override.keterangan}` : ""}</span>
            </div>
          )}
        </div>
      ) : null}

      {list.length > 0 && (
        <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto border-t border-slate-100 pt-3 dark:border-slate-700/50">
          {list.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-700">
              <div className="min-w-0">
                <p className="font-bold text-slate-700 dark:text-slate-200">{formatTanggalWib(o.tanggal)}</p>
                <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                  {[
                    o.hadirStartMinutes != null || o.hadirEndMinutes != null
                      ? `Datang ${o.hadirStartMinutes != null ? fmtMinutes(o.hadirStartMinutes) : "—"}-${o.hadirEndMinutes != null ? fmtMinutes(o.hadirEndMinutes) : "—"} WIB`
                      : null,
                    o.pulangStartMinutes != null || o.pulangEndMinutes != null
                      ? `Pulang ${o.pulangStartMinutes != null ? fmtMinutes(o.pulangStartMinutes) : "—"}-${o.pulangEndMinutes != null ? fmtMinutes(o.pulangEndMinutes) : "—"} WIB`
                      : null,
                    o.keterangan,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button type="button" onClick={() => handleDelete(o.tanggal)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#5D900F] dark:text-[#C4B5FD] hover:bg-[#F6FEE8] hover:text-[#5D900F] hover:dark:text-[#C4B5FD] dark:hover:bg-slate-600">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Atur Jadwal Absen</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Kosongkan jam yang tidak ingin diubah · Semua jam WIB (GMT+7)</p>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className={LABEL}>Tanggal</label>
                  <DateInputID value={form.tanggal} onChange={(v) => setForm((f) => ({ ...f, tanggal: v }))} className={INPUT} required />
                  {form.tanggal && (
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {formatTanggalWib(form.tanggal, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#F6FEE8] bg-[#F6FEE8]/50 p-3 dark:border-[#48700B]/30 dark:bg-slate-700">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#5D900F] dark:text-[#C4B5FD]">
                    <LogIn size={12} /> Absen Datang <span className="normal-case text-[#5D900F]/70 dark:text-[#C4B5FD]">(WIB)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={LABEL}>Mulai</label>
                      <TimeInput24 value={form.hadirStart} onChange={(v) => setForm((f) => ({ ...f, hadirStart: v }))} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Selesai</label>
                      <TimeInput24 value={form.hadirEnd} onChange={(v) => setForm((f) => ({ ...f, hadirEnd: v }))} className={INPUT} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#F1EDFA] bg-slate-100 p-3 dark:border-[#000000]/30 dark:bg-slate-700">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3E03B3] dark:text-[#8F6DD3]">
                    <LogOut size={12} /> Absen Pulang <span className="normal-case text-[#00AAFA]/70 dark:text-[#8F6DD3]/70">(WIB)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={LABEL}>Mulai</label>
                      <TimeInput24 value={form.pulangStart} onChange={(v) => setForm((f) => ({ ...f, pulangStart: v }))} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Selesai</label>
                      <TimeInput24 value={form.pulangEnd} onChange={(v) => setForm((f) => ({ ...f, pulangEnd: v }))} className={INPUT} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Keterangan (opsional)</label>
                  <textarea rows={2} value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                    placeholder="Contoh: Pulang lebih awal karena acara sekolah" className={`${INPUT} resize-none`} />
                </div>

                <div className="mt-1 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
                    Batal
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl bg-[#3E03B3] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#3E03B3] disabled:opacity-60">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? "Menyimpan..." : "Simpan Jadwal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
