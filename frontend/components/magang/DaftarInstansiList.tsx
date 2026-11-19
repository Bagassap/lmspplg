"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ChevronDown, Search, Users } from "lucide-react";
import { toTitleCase } from "@/components/data-siswa/shared";
import type { Instansi } from "./types";

export function DaftarInstansiList({ list, loading, judul = "Daftar Instansi PKL", onPilih, pilihId }: {
  list: Instansi[];
  loading: boolean;
  judul?: string;
  onPilih?: (i: Instansi) => void;
  pilihId?: string | null;
}) {
  const [q, setQ] = useState("");
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const tampil = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return list;
    return list.filter((i) =>
      i.namaTempat.toLowerCase().includes(k)
      || i.siswa.some((s) => s.nama.toLowerCase().includes(k)));
  }, [list, q]);

  return (
    <div className="card-pisah flex min-h-0 flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><Building2 size={18} /></span>
        <p className="min-w-0 flex-1 text-sm font-bold text-slate-800 dark:text-white">{judul} <span className="font-medium text-slate-400 dark:text-slate-500">({list.length})</span></p>
      </div>

      <div className="relative mt-4 mb-2">
        <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari instansi atau nama siswa…"
          className="h-9 w-full rounded-xl border-0 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400" />
      </div>

      <div className="-mr-2 space-y-2 overflow-y-auto pr-2 lg:max-h-[calc(100dvh-260px)]">
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)
        ) : tampil.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Users size={22} className="text-[#3E03B3] dark:text-[#C4B5FD]" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{q ? "Tidak ada instansi yang cocok" : "Belum ada instansi terverifikasi"}</p>
          </div>
        ) : tampil.map((i) => {
          const penuh = i.sisa !== null && i.sisa <= 0;
          const dipilih = pilihId === i.id;
          const buka = terbuka === i.id;
          return (
            <div key={i.id} className={`overflow-hidden rounded-xl transition-colors ${dipilih ? "bg-[#E7E0F7] ring-2 ring-[#3E03B3] dark:bg-slate-600" : "bg-slate-50 dark:bg-slate-700"}`}>
              <button type="button" onClick={() => setTerbuka(buka ? null : i.id)} aria-expanded={buka}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{i.namaTempat}</p>
                <span className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-2 py-0.5 text-[11px] font-bold text-[#3E03B3] dark:bg-slate-800 dark:text-[#C4B5FD]">
                  <Users size={11} /> {i.siswa.length}
                </span>
                <ChevronDown size={16} className={`shrink-0 text-[#3E03B3] transition-transform dark:text-[#C4B5FD] ${buka ? "rotate-180" : ""}`} />
              </button>
              {buka && (
                <div className="space-y-1.5 px-3 pb-3">
                  {i.siswa.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Belum ada siswa terverifikasi</p>
                  ) : i.siswa.map((s, n) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 dark:bg-slate-800">
                      <span className="w-4 shrink-0 text-[10px] font-bold text-slate-400">{n + 1}.</span>
                      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-100">{toTitleCase(s.nama)}</p>
                      {s.kelas && <span className="shrink-0 text-[10px] text-slate-400">{s.kelas}</span>}
                    </div>
                  ))}
                  {onPilih && !penuh && (
                    <button type="button" onClick={() => onPilih(i)}
                      className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold ${dipilih ? "bg-[#3E03B3] text-white" : "bg-white text-[#3E03B3] dark:bg-slate-800 dark:text-[#C4B5FD]"}`}>
                      {dipilih ? <><CheckCircle2 size={13} /> Dipilih</> : "Pilih instansi ini"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function useDaftarInstansi() {
  const [list, setList] = useState<Instansi[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    fetch("/api/magang/tempat/instansi", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { list, loading, reload };
}
