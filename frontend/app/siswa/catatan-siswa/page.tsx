"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Calendar, User as UserIcon } from "lucide-react";
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
      <DataSiswaHeader title="Catatan Saya" eyebrow="Catatan Saya" />

      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
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

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
    </div>
  );
}
