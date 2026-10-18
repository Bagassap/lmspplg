"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Calendar, User as UserIcon, ClipboardList } from "lucide-react";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { AppMobileFrame, AppCard, AppEmpty, AppSectionTitle, APP_ACCENT } from "@/components/app/AppUI";
import { icon3dStyle } from "@/components/shared/Icon3D";
import { useIsAppMode } from "@/lib/pwaInstall";

type CatatanItem = {
  id: string;
  judul: string;
  catatan: string;
  poin: number | null;
  tanggal: string;
  dicatatOleh: { id: string; nama: string; role: string };
};

type DetailResponse = {
  siswa: { id: string; nama: string | null; nis: string; kelasId: string };
  catatan: CatatanItem[];
  totalPoin: number;
};

function formatTgl(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", GURU: "Guru", SISWA: "Siswa" };

export default function SiswaCatatanSayaPage() {
  const appMode = useIsAppMode();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catatan-siswa/saya", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="hidden lg:block">
        <DataSiswaHeader title="Catatan Saya" eyebrow="Catatan Saya" />
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-700/50 dark:bg-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#3E03B31a", color: "#3E03B3" }}>
            <NotebookPen size={16} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-slate-800 dark:text-white">{loading ? "—" : data?.catatan.length ?? 0}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Total Catatan</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-700/50 dark:bg-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black" style={{ backgroundColor: "#F26A3D1a", color: "#3E03B3" }}>
            ±
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-slate-800 dark:text-white">{loading ? "—" : data?.totalPoin ?? 0}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Total Poin</p>
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
        {loading && <p className="px-5 py-10 text-center text-sm text-slate-400">Memuat catatan...</p>}
        {!loading && (!data || data.catatan.length === 0) && (
          <div className="px-5 py-14 text-center">
            <NotebookPen size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">Belum ada catatan untukmu. Pertahankan!</p>
          </div>
        )}
        {!loading && data && data.catatan.length > 0 && (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {data.catatan.map((c) => (
              <div key={c.id} className="p-5">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{c.judul}</p>
                  {c.poin != null && (
                    <span className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold bg-[#F6FEE8] dark:bg-[#A1F919]/15 text-[#5D900F] dark:text-[#A1F919]">{c.poin} poin</span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.catatan}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {formatTgl(c.tanggal)}</span>
                  <span className="flex items-center gap-1"><UserIcon size={11} /> Dicatat oleh {c.dicatatOleh.nama} ({ROLE_LABEL[c.dicatatOleh.role] ?? c.dicatatOleh.role})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppMobileFrame eyebrow="Catatan Saya" title="Catatan Saya" legacyBodyClass="">
        {appMode ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Catatan", value: loading ? "—" : data?.catatan.length ?? 0, tone: "indigo" as const, icon: <NotebookPen size={26} color="#fff" /> },
                { label: "Total Poin", value: loading ? "—" : data?.totalPoin ?? 0, tone: "emerald" as const, icon: <span className="text-2xl font-black text-white">±</span> },
              ].map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
                  <span className="flex h-16 w-16 items-center justify-center rounded-[22px]" style={icon3dStyle(t.tone)}>{t.icon}</span>
                  <span className="text-xl font-extrabold leading-none text-slate-900 dark:text-white">{t.value}</span>
                  <span className="-mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{t.label}</span>
                </div>
              ))}
            </div>

            <section className="space-y-3">
              <AppSectionTitle>Daftar Catatan</AppSectionTitle>
              {loading ? (
                [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />)
              ) : !data || data.catatan.length === 0 ? (
                <AppEmpty icon={NotebookPen} title="Belum ada catatan untukmu" desc="Pertahankan!" />
              ) : (
                data.catatan.map((c) => (
                  <AppCard key={c.id}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-bold text-slate-900 dark:text-white">{c.judul}</p>
                      {c.poin != null && (
                        <span className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "#FFE9E2", color: "#F26A3D" }}>
                          {c.poin} poin
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-500 dark:text-slate-400">{c.catatan}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {formatTgl(c.tanggal)}</span>
                      <span className="flex items-center gap-1"><UserIcon size={11} /> {c.dicatatOleh.nama} ({ROLE_LABEL[c.dicatatOleh.role] ?? c.dicatatOleh.role})</span>
                    </div>
                  </AppCard>
                ))
              )}
            </section>
          </>
        ) : (
          <>
        <div className="space-y-3 rounded-[28px] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1E293B]">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl p-4" style={{ background: "#3E03B3" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <NotebookPen size={18} className="text-white" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-base font-extrabold text-white">{loading ? "—" : data?.catatan.length ?? 0}</p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/70">Total Catatan</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl p-4" style={{ background: "#F26A3D" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black text-black bg-black/10">
                ±
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-base font-extrabold text-black">{loading ? "—" : data?.totalPoin ?? 0}</p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-black/70">Total Poin</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[#FFFFFF] dark:bg-slate-900/30">
            {loading && (
              <p className="py-14 text-center text-sm text-slate-400">Memuat catatan...</p>
            )}
            {!loading && (!data || data.catatan.length === 0) && (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#3E03B318" }}>
                  <NotebookPen size={24} style={{ color: "#3E03B3" }} />
                </div>
                <p className="mt-4 text-sm text-slate-400">Belum ada catatan untukmu. Pertahankan!</p>
              </div>
            )}
            {!loading && data && data.catatan.length > 0 && (
              <div className="divide-y divide-white dark:divide-slate-700/40">
                {data.catatan.map((c) => {
                  const accent = c.poin != null ? "#3E03B3" : "#3E03B3";
                  return (
                    <div key={c.id} className="relative p-4 pl-5">
                      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: accent }} />
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}18`, color: accent }}>
                            <ClipboardList size={15} />
                          </span>
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-white">{c.judul}</p>
                        </div>
                        {c.poin != null && (
                          <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${accent}18`, color: accent }}>
                            {c.poin} poin
                          </span>
                        )}
                      </div>
                      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.catatan}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10.5px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {formatTgl(c.tanggal)}</span>
                        <span className="flex items-center gap-1"><UserIcon size={10} /> {c.dicatatOleh.nama} ({ROLE_LABEL[c.dicatatOleh.role] ?? c.dicatatOleh.role})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </AppMobileFrame>
    </div>
  );
}
