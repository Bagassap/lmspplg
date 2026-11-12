"use client";

import { useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ASPEK_NILAI, type PenilaianUkk } from "@/lib/ukkAspek";

export type SubmisiBernilai = { id: string; tahapan?: { id: string; judul: string }; penilaian?: PenilaianUkk | null };

export function NilaiSaya({ items, onChanged }: { items: SubmisiBernilai[]; onChanged: () => void }) {
  const toast = useToast();
  const [proses, setProses] = useState<string | null>(null);
  const [buka, setBuka] = useState<string | null>(null);
  const rows = items.filter((s) => s.penilaian);
  if (rows.length === 0) return null;

  async function selesai(id: string) {
    setProses(id);
    try {
      const res = await fetch(`/api/ujian-ukk/submisi/${id}/revisi-selesai`, { method: "PUT" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast.error("Gagal", d?.message ?? "Coba lagi");
        return;
      }
      toast.success("Revisi ditandai selesai", "Nilai kamu sekarang terlihat.");
      onChanged();
    } finally {
      setProses(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EFE9FD] text-[#3E03B3]"><ClipboardCheck size={15} /></span>
        <p className="text-base font-bold text-slate-800 dark:text-slate-100">Nilai UKK</p>
      </div>
      <div className="space-y-2.5">
        {rows.map((s) => {
          const p = s.penilaian!;
          const tertahan = !!p.nilaiTertahan;
          const terbuka = buka === s.id;
          return (
            <div key={s.id} className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{s.tahapan?.judul ?? "Task UKK"}</p>
                  {tertahan ? (
                    <p className="text-xs font-semibold text-[#E8562B]">Nilai keluar setelah revisi selesai</p>
                  ) : p.rataRata != null ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300">Rata-rata dari {ASPEK_NILAI.length} aspek</p>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-300">Penilaian belum lengkap</p>
                  )}
                </div>
                {!tertahan && p.rataRata != null && (
                  <span className="shrink-0 rounded-xl bg-[#3E03B3] px-3 py-1.5 text-lg font-extrabold text-white">{p.rataRata}</span>
                )}
              </div>

              {p.pesanRevisi && (
                <div className="mt-2.5 rounded-xl bg-[#FFE9E2] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#E8562B]">Revisi dari guru</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-800">{p.pesanRevisi}</p>
                  {tertahan && (
                    <button type="button" disabled={proses === s.id} onClick={() => selesai(s.id)}
                      className="mt-2 flex items-center gap-1.5 rounded-xl bg-[#E8562B] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60">
                      {proses === s.id && <Loader2 size={12} className="animate-spin" />} Saya sudah menyelesaikan revisi
                    </button>
                  )}
                </div>
              )}

              {!tertahan && p.skor && (
                <>
                  <button type="button" onClick={() => setBuka(terbuka ? null : s.id)} className="mt-2 text-[11px] font-bold text-[#3E03B3] dark:text-[#C4B5FD]">
                    {terbuka ? "Sembunyikan rincian" : "Lihat rincian nilai"}
                  </button>
                  {terbuka && (
                    <ul className="mt-2 space-y-1.5">
                      {ASPEK_NILAI.map((a) => (
                        <li key={a.key} className="flex items-start justify-between gap-3 text-xs">
                          <span className="text-slate-700 dark:text-slate-200">{a.label}</span>
                          <span className="shrink-0 font-bold text-slate-900 dark:text-white">{p.skor?.[a.key] ?? "—"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
