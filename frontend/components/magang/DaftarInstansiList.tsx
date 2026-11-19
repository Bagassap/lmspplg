"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, MapPin, Phone, Search, User, Users } from "lucide-react";
import { toTitleCase, waLink } from "@/components/data-siswa/shared";
import { formatAlamat, type Instansi } from "./types";

export function DaftarInstansiList({ list, loading, judul = "Daftar Instansi PKL", keterangan, onPilih, pilihId }: {
  list: Instansi[];
  loading: boolean;
  judul?: string;
  keterangan?: string;
  onPilih?: (i: Instansi) => void;
  pilihId?: string | null;
}) {
  const [q, setQ] = useState("");
  const tampil = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return list;
    return list.filter((i) =>
      i.namaTempat.toLowerCase().includes(k)
      || formatAlamat(i).toLowerCase().includes(k)
      || i.siswa.some((s) => s.nama.toLowerCase().includes(k)));
  }, [list, q]);

  return (
    <div className="flex min-h-0 flex-col rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><Building2 size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold text-slate-900 dark:text-white">{judul} <span className="font-medium text-slate-500 dark:text-slate-400">({list.length})</span></p>
          <p className="text-xs text-slate-600 dark:text-slate-300">{keterangan ?? "Instansi yang sudah terdaftar dan diverifikasi beserta siswa yang PKL di sana."}</p>
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari instansi, alamat, atau nama siswa…"
          className="h-10 w-full rounded-2xl border-0 bg-[#F1EDFA] pl-9 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400" />
      </div>

      <div className="-mr-2 space-y-2.5 overflow-y-auto pr-2 lg:max-h-[calc(100dvh-260px)]">
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#F1EDFA] dark:bg-slate-700" />)
        ) : tampil.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#F1EDFA] px-4 py-10 text-center dark:bg-slate-700">
            <Users size={22} className="text-[#3E03B3] dark:text-[#C4B5FD]" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{q ? "Tidak ada instansi yang cocok" : "Belum ada instansi terverifikasi"}</p>
          </div>
        ) : tampil.map((i) => {
          const wa = waLink(i.noWaUsaha);
          const penuh = i.sisa !== null && i.sisa <= 0;
          const dipilih = pilihId === i.id;
          return (
            <div key={i.id} className={`rounded-2xl p-3.5 transition-colors ${dipilih ? "bg-[#E7E0F7] ring-2 ring-[#3E03B3] dark:bg-slate-600" : "bg-[#F1EDFA] dark:bg-slate-700"}`}>
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 text-sm font-extrabold text-slate-900 dark:text-white">{i.namaTempat}</p>
                {i.sisa !== null && (
                  <span className={`shrink-0 rounded-xl px-2 py-0.5 text-[10px] font-bold ${penuh ? "bg-white text-[#E8562B] dark:bg-slate-800" : "bg-white text-[#3E03B3] dark:bg-slate-800 dark:text-[#C4B5FD]"}`}>
                    {penuh ? "Kuota penuh" : `Sisa kuota ${i.sisa}`}
                  </span>
                )}
              </div>
              <div className="mt-1.5 space-y-1 text-xs text-slate-700 dark:text-slate-200">
                {i.namaPimpinan && <p className="flex items-start gap-1.5"><User size={12} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> {i.namaPimpinan}</p>}
                <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> {formatAlamat(i)}</p>
                {i.noWaUsaha && (
                  <p className="flex items-center gap-1.5"><Phone size={12} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />
                    {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{i.noWaUsaha}</a> : i.noWaUsaha}
                  </p>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {i.siswa.length === 0 ? (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Belum ada siswa terverifikasi</span>
                ) : i.siswa.map((s) => (
                  <span key={s.id} className="rounded-xl bg-white px-2 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                    {toTitleCase(s.nama)}{s.kelas && <span className="font-medium text-slate-500 dark:text-slate-400"> · {s.kelas}</span>}
                  </span>
                ))}
              </div>
              {onPilih && !penuh && (
                <button type="button" onClick={() => onPilih(i)}
                  className={`mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold ${dipilih ? "bg-[#3E03B3] text-white" : "bg-white text-[#3E03B3] dark:bg-slate-800 dark:text-[#C4B5FD]"}`}>
                  {dipilih ? <><CheckCircle2 size={13} /> Dipilih</> : "Pilih instansi ini"}
                </button>
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
