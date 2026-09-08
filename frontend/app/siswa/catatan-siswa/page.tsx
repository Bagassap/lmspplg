"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, NotebookPen, Calendar, User as UserIcon, ClipboardList } from "lucide-react";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";

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
  const router = useRouter();
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#0082FB1a", color: "#0082FB" }}>
            <NotebookPen size={16} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-slate-800 dark:text-white">{loading ? "—" : data?.catatan.length ?? 0}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Total Catatan</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-700/50 dark:bg-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black" style={{ backgroundColor: "#EF44441a", color: "#EF4444" }}>
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
                    <span className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: "#FEE9EA", color: "#EF4444" }}>{c.poin} poin</span>
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

      <div className="relative -m-4 lg:hidden" style={{ background: "#0082FB" }}>
        <div className="relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/siswa/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Catatan Saya</h1>
        </div>
        <div className="rounded-t-[28px] bg-[#F1F5F8] p-4 dark:bg-[#1C2B33]">
        <div className="space-y-3 rounded-[28px] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1C2B33]">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl p-4" style={{ background: "#0082FB" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <NotebookPen size={18} className="text-white" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-base font-extrabold text-white">{loading ? "—" : data?.catatan.length ?? 0}</p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/70">Total Catatan</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl p-4" style={{ background: "#EF4444" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black text-white bg-white/20">
                ±
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-base font-extrabold text-white">{loading ? "—" : data?.totalPoin ?? 0}</p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/70">Total Poin</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[#F1F5F8] dark:bg-slate-900/30">
            {loading && (
              <p className="py-14 text-center text-sm text-slate-400">Memuat catatan...</p>
            )}
            {!loading && (!data || data.catatan.length === 0) && (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#0082FB18" }}>
                  <NotebookPen size={24} style={{ color: "#0082FB" }} />
                </div>
                <p className="mt-4 text-sm text-slate-400">Belum ada catatan untukmu. Pertahankan!</p>
              </div>
            )}
            {!loading && data && data.catatan.length > 0 && (
              <div className="divide-y divide-white dark:divide-slate-700/40">
                {data.catatan.map((c) => {
                  const accent = c.poin != null ? "#EF4444" : "#0082FB";
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
        </div>
      </div>
    </div>
  );
}
