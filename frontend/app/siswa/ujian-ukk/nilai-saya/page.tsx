"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Award, Download, Loader2, Lock, Trophy } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ASPEK_NILAI, type PenilaianUkk } from "@/lib/ukkAspek";

type Row = { id: string; tahapan?: { id: string; judul: string }; penilaian?: PenilaianUkk | null };

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

export default function SiswaUkkNilaiSayaPage() {
  const toast = useToast();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [unduh, setUnduh] = useState<string | null>(null);
  const [revisi, setRevisi] = useState<string | null>(null);

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/ujian-ukk/submisi/saya", { cache: "no-store" });
      if (res.status === 401) { window.location.href = "/login"; return; }
      const d = await res.json().catch(() => []);
      setItems(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const rows = items.filter((s) => s.penilaian);
  const terlihat = rows.filter((s) => !s.penilaian?.nilaiTertahan && s.penilaian?.rataRata != null);
  const rataSemua = terlihat.length ? Math.round((terlihat.reduce((t, s) => t + (s.penilaian?.rataRata ?? 0), 0) / terlihat.length) * 100) / 100 : null;

  async function unduhPdf(id: string) {
    setUnduh(id);
    try {
      const res = await fetch(`/api/ujian-ukk/submisi/saya/nilai-pdf?submisiId=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast.error("Gagal mengunduh PDF", typeof d?.message === "string" ? d.message : "Coba lagi");
        return;
      }
      const blob = await res.blob();
      const nama = /filename="?([^";]+)"?/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "Nilai_UKK.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setUnduh(null);
    }
  }

  async function selesaiRevisi(id: string) {
    setRevisi(id);
    try {
      const res = await fetch(`/api/ujian-ukk/submisi/${id}/revisi-selesai`, { method: "PUT" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast.error("Gagal", typeof d?.message === "string" ? d.message : "Coba lagi");
        return;
      }
      toast.success("Revisi ditandai selesai", "Nilai kamu sekarang terlihat.");
      await muat();
    } finally {
      setRevisi(null);
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFE9FD] text-[#3E03B3] dark:bg-[#3E03B3]/30 dark:text-[#C4B5FD]"><Trophy size={18} /></span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white">Nilai Saya</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Nilai ujian kompetensi keahlian</p>
          </div>
        </div>
        {rataSemua !== null && terlihat.length > 1 && (
          <div className="flex items-center gap-2 rounded-2xl bg-[#EFE9FD] px-4 py-2 dark:bg-[#3E03B3]/30">
            <Award size={16} className="text-[#3E03B3] dark:text-[#C4B5FD]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#3E03B3] dark:text-[#C4B5FD]">Rata-rata semua task</p>
              <p className="text-lg font-extrabold leading-none text-[#3E03B3] dark:text-[#C4B5FD]">{rataSemua}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white py-16 text-center shadow-sm dark:bg-slate-800">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFE9FD] text-[#3E03B3] dark:bg-[#3E03B3]/30 dark:text-[#C4B5FD]"><Trophy size={24} /></span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Belum ada nilai</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Nilai muncul setelah guru menilai pengumpulan kamu.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="bg-[#3E03B3] text-[11px] font-bold uppercase tracking-wide text-white">
                  <th className="w-12 px-4 py-3 text-center">No</th>
                  <th className="min-w-[180px] px-3 py-3">Task</th>
                  {ASPEK_NILAI.map((a) => (
                    <th key={a.key} title={a.label} className="px-2 py-3 text-center leading-tight">{SINGKAT[a.key]}</th>
                  ))}
                  <th className="px-3 py-3 text-center">Jumlah</th>
                  <th className="px-3 py-3 text-center">Rata-rata</th>
                  <th className="px-4 py-3 text-center">PDF</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => {
                  const p = s.penilaian!;
                  const tertahan = !!p.nilaiTertahan;
                  const jumlah = !tertahan && p.skor ? ASPEK_NILAI.reduce((t, a) => t + (p.skor?.[a.key] ?? 0), 0) : null;
                  const zebra = i % 2 === 1 ? "bg-slate-50 dark:bg-slate-700/30" : "";
                  return (
                    <Fragment key={s.id}>
                      <tr className={`border-b border-slate-100 dark:border-slate-700/60 ${zebra}`}>
                        <td className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{i + 1}</td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{s.tahapan?.judul ?? "Task UKK"}</p>
                          {tertahan && <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#E8562B]"><Lock size={11} /> Nilai keluar setelah revisi selesai</p>}
                        </td>
                        {ASPEK_NILAI.map((a) => {
                          const v = tertahan ? null : p.skor?.[a.key];
                          return (
                            <td key={a.key} className="px-2 py-3 text-center">
                              {v === null || v === undefined ? (
                                <span className="text-xs text-slate-400">{tertahan ? "•••" : "—"}</span>
                              ) : (
                                <span className={`inline-block min-w-9 rounded-lg px-2 py-1 text-xs font-bold ${warnaNilai(v)}`}>{v}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center text-sm font-bold text-slate-800 dark:text-slate-100">{jumlah ?? "•••"}</td>
                        <td className="px-3 py-3 text-center">
                          {!tertahan && p.rataRata != null ? (
                            <span className="inline-block rounded-xl bg-[#3E03B3] px-3 py-1.5 text-sm font-extrabold text-white">{p.rataRata}</span>
                          ) : (
                            <span className="text-xs text-slate-400">{tertahan ? "•••" : "—"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" disabled={tertahan || p.rataRata == null || unduh === s.id} onClick={() => unduhPdf(s.id)}
                            title={tertahan ? "Selesaikan revisi dulu" : "Unduh PDF"}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#EFE9FD] px-3 py-1.5 text-[11px] font-bold text-[#3E03B3] transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#3E03B3]/30 dark:text-[#C4B5FD]">
                            {unduh === s.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
                          </button>
                        </td>
                      </tr>
                      {tertahan && p.pesanRevisi && (
                        <tr className={`border-b border-slate-100 dark:border-slate-700/60 ${zebra}`}>
                          <td />
                          <td colSpan={ASPEK_NILAI.length + 4} className="px-3 pb-3">
                            <div className="rounded-xl bg-[#FFE9E2] px-3 py-2.5 dark:bg-[#F26A3D]/20">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#E8562B]">Revisi dari guru</p>
                              <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-100">{p.pesanRevisi}</p>
                              <button type="button" disabled={revisi === s.id} onClick={() => selesaiRevisi(s.id)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#E8562B] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60">
                                {revisi === s.id && <Loader2 size={12} className="animate-spin" />} Saya sudah menyelesaikan revisi
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nilai akhir tiap task adalah rata-rata dari {ASPEK_NILAI.length} aspek. Geser tabel ke samping untuk melihat semua kolom.
          </p>
        </div>
      )}
    </div>
  );
}
