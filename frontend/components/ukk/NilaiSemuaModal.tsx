"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search, X } from "lucide-react";
import { ASPEK_NILAI } from "@/lib/ukkAspek";

type NilaiRow = { task: string; skor: Record<string, number>; rataRata: number | null; menungguRevisi: boolean; dinilai: boolean };
type SiswaNilai = { kelas: string; nama: string; nis: string; nilai: NilaiRow[] };
type GrupNilai = { grup: string; lokasi: string; penguji: string; siswa: SiswaNilai[] };

const SINGKAT: Record<string, string> = {
  struktur_data: "Struktur Data",
  spesifikasi_program: "Spesifikasi Program",
  perintah_eksekusi: "Perintah Eksekusi",
  guidelines: "Guidelines & Best Practices",
  terstruktur: "Pemrograman Terstruktur",
  dokumen_kode: "Dokumen Kode",
  debugging: "Debugging",
  unit_test: "Pengujian Unit",
};

function warnaNilai(n: number) {
  if (n >= 85) return "bg-[#E4F5EC] text-[#15803D] dark:bg-[#22A06B]/25 dark:text-[#86EFAC]";
  if (n >= 70) return "bg-[#EFE9FD] text-[#3E03B3] dark:bg-[#3E03B3]/30 dark:text-[#C4B5FD]";
  return "bg-[#FFE9E2] text-[#E8562B] dark:bg-[#F26A3D]/25 dark:text-[#FDBA9B]";
}

export function NilaiSemuaModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<GrupNilai[] | null>(null);
  const [galat, setGalat] = useState("");
  const [grup, setGrup] = useState("");
  const [cari, setCari] = useState("");

  useEffect(() => {
    let batal = false;
    fetch("/api/ujian-ukk/nilai/rekap", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (batal) return;
        if (!r.ok || !Array.isArray(d)) { setGalat(typeof d?.message === "string" ? d.message : "Gagal memuat nilai"); return; }
        setData(d);
        setGrup(d[0]?.grup ?? "");
      })
      .catch(() => { if (!batal) setGalat("Server tidak dapat dijangkau"); });
    return () => { batal = true; };
  }, []);

  const aktif = useMemo(() => data?.find((g) => g.grup === grup) ?? null, [data, grup]);
  const siswa = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return (aktif?.siswa ?? []).filter((s) => !q || s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q));
  }, [aktif, cari]);

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[92vh] w-full max-w-[1600px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5 sm:px-8 sm:pt-7">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Nilai UKK Siswa</h3>
          </div>
          <a href="/api/ujian-ukk/nilai/export-excel" download
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3E03B3] px-3.5 py-2 text-xs font-bold text-white">
            <Download size={13} /> Unduh Excel
          </a>
          <button type="button" onClick={onClose} aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:text-[#C4B5FD]"><X size={16} /></button>
        </div>

        {galat ? (
          <p className="px-8 py-16 text-center text-sm font-semibold text-[#E8562B]">{galat}</p>
        ) : !data ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#3E03B3] dark:text-[#C4B5FD]" /></div>
        ) : data.length === 0 ? (
          <p className="px-8 py-16 text-center text-sm font-semibold text-slate-500">Belum ada kelas XII</p>
        ) : (
          <>
            <div className="flex shrink-0 flex-col gap-3 px-5 pb-3 sm:px-8">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {data.map((g) => {
                  const on = g.grup === grup;
                  return (
                    <button key={g.grup} type="button" onClick={() => setGrup(g.grup)}
                      className={`shrink-0 rounded-xl px-3.5 py-2 text-left transition-all ${on ? "bg-[#3E03B3] text-white" : "bg-[#F1EDFA] text-[#3E03B3] dark:text-[#C4B5FD]"}`}>
                      <span className="block text-xs font-bold leading-tight">{g.lokasi} <span className={on ? "text-white/75" : "opacity-70"}>({g.siswa.length})</span></span>
                      {g.penguji && <span className={`block text-[10px] font-semibold leading-tight ${on ? "text-white/80" : "opacity-75"}`}>Pengawas: {g.penguji}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama, NIS, atau kelas..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#8F6DD3] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 pb-5 sm:px-8 sm:pb-7">
              <div className="rounded-2xl border border-slate-100 max-lg:overflow-x-auto dark:border-slate-700">
                <table className="w-full border-collapse text-left max-lg:min-w-[1040px] lg:table-fixed">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wide text-white">
                      <th className="w-10 bg-[#3E03B3] px-1 py-3 text-center">No</th>
                      <th className="w-[7%] bg-[#3E03B3] px-2 py-3">Kelas</th>
                      <th className="w-[12%] bg-[#3E03B3] px-2 py-3">Nama</th>
                      <th className="w-[6%] bg-[#3E03B3] px-2 py-3">NIS</th>
                      <th className="w-[10%] bg-[#3E03B3] px-2 py-3">Task</th>
                      {ASPEK_NILAI.map((a) => (
                        <th key={a.key} title={a.label} className="bg-[#F26A3D] px-1 py-3 text-center text-[10px] leading-tight">{SINGKAT[a.key]}</th>
                      ))}
                      <th className="w-[6%] bg-slate-900 px-1 py-3 text-center">Jumlah</th>
                      <th className="w-[7%] bg-slate-900 px-1 py-3 text-center">Rata-rata</th>
                      <th className="w-[9%] bg-slate-900 px-1 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswa.length === 0 ? (
                      <tr><td colSpan={ASPEK_NILAI.length + 8} className="py-12 text-center text-xs font-semibold text-slate-500">Tidak ada siswa</td></tr>
                    ) : siswa.map((s, i) => {
                      const baris = s.nilai.length ? s.nilai : [null];
                      return (
                        <Fragment key={`${s.nis}-${i}`}>
                          {baris.map((n, j) => {
                            const jumlah = n ? ASPEK_NILAI.reduce((t, a) => t + (n.skor[a.key] ?? 0), 0) : null;
                            return (
                              <tr key={j} className="border-b border-slate-100 dark:border-slate-700/60">
                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-center text-xs font-bold text-slate-600 dark:bg-[#3E03B3]/15 dark:text-slate-300">{j === 0 ? i + 1 : ""}</td>
                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-xs font-semibold text-slate-700 dark:bg-[#3E03B3]/15 dark:text-slate-200">{j === 0 ? s.kelas : ""}</td>
                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-sm font-bold text-slate-900 dark:bg-[#3E03B3]/15 dark:text-white">{j === 0 ? s.nama : ""}</td>
                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-xs text-slate-600 dark:bg-[#3E03B3]/15 dark:text-slate-300">{j === 0 ? s.nis : ""}</td>
                                <td className="bg-[#F1EDFA] px-2 py-2.5 text-xs font-semibold text-slate-800 dark:bg-[#3E03B3]/15 dark:text-slate-100">{n ? n.task : "—"}</td>
                                {ASPEK_NILAI.map((a) => {
                                  const v = n?.skor[a.key];
                                  return (
                                    <td key={a.key} className="px-1 py-2.5 text-center">
                                      {v === undefined || v === null ? <span className="text-xs text-slate-400">—</span>
                                        : <span className={`inline-block min-w-8 rounded-lg px-1.5 py-1 text-xs font-bold ${warnaNilai(v)}`}>{v}</span>}
                                    </td>
                                  );
                                })}
                                <td className="bg-slate-100 px-2 py-2.5 text-center text-sm font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">{jumlah ?? "—"}</td>
                                <td className="bg-slate-100 px-2 py-2.5 text-center dark:bg-slate-800">
                                  {n?.rataRata != null ? <span className="inline-block rounded-xl bg-[#3E03B3] px-3 py-1 text-sm font-extrabold text-white">{n.rataRata}</span> : <span className="text-xs text-slate-400">—</span>}
                                </td>
                                <td className="bg-slate-100 px-2 py-2.5 text-center text-[11px] font-bold dark:bg-slate-800">
                                  {!n ? <span className="text-slate-400">Belum dinilai</span>
                                    : !n.dinilai ? <span className="text-slate-500 dark:text-slate-300">Belum dinilai</span>
                                    : n.menungguRevisi ? <span className="text-[#E8562B]">Menunggu revisi siswa</span>
                                    : n.rataRata === null ? <span className="text-slate-500">Belum lengkap</span>
                                    : <span className="text-[#3E03B3] dark:text-[#C4B5FD]">Nilai keluar</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
