"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Building2, ChevronRight, Search, Users } from "lucide-react";
import { InstansiDetailModal } from "./InstansiDetailModal";
import type { Instansi } from "./types";

export function DaftarInstansiList({ list, loading, judul = "Daftar Instansi PKL", onPilih, pilihId, jenisKelaminSiswa }: {
  list: Instansi[];
  loading: boolean;
  judul?: string;
  onPilih?: (i: Instansi) => void;
  pilihId?: string | null;
  jenisKelaminSiswa?: string | null;
}) {
  const [q, setQ] = useState("");
  const [terbuka, setTerbuka] = useState<Instansi | null>(null);
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FFE9E2", color: "#E8562B" }}><Building2 size={18} /></span>
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
            <Users size={22} className="text-[#F26A3D]" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{q ? "Tidak ada instansi yang cocok" : "Belum ada instansi terverifikasi"}</p>
          </div>
        ) : tampil.map((i) => {
          const dipilih = pilihId === i.id;
          return (
            <button key={i.id} type="button" onClick={() => setTerbuka(i)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-600 ${dipilih ? "bg-[#E4F5EC] ring-2 ring-[#22A06B] dark:bg-slate-600" : "bg-slate-50 dark:bg-slate-700"}`}>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{i.namaTempat}</p>
              <span className="flex shrink-0 items-center gap-1 rounded-xl px-2 py-0.5 text-[11px] font-bold" style={{ background: "#E4F5EC", color: "#22A06B" }}>
                <Users size={11} /> {i.siswa.length}
              </span>
              <ChevronRight size={16} className="shrink-0 text-[#F26A3D]" />
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {terbuka && (
          <InstansiDetailModal instansi={terbuka} dipilih={pilihId === terbuka.id} jenisKelaminSiswa={jenisKelaminSiswa} onPilih={onPilih} onClose={() => setTerbuka(null)} />
        )}
      </AnimatePresence>
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
