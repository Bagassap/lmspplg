"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Trophy } from "lucide-react";
import { NilaiSaya, type SubmisiBernilai } from "@/components/ukk/NilaiSaya";
import { useToast } from "@/components/shared/ToastSystem";

export default function SiswaUkkNilaiSayaPage() {
  const toast = useToast();
  const [items, setItems] = useState<SubmisiBernilai[]>([]);
  const [loading, setLoading] = useState(true);
  const [unduh, setUnduh] = useState(false);

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

  const bernilai = items.filter((s) => s.penilaian);
  const adaNilaiTerlihat = bernilai.some((s) => s.penilaian && !s.penilaian.nilaiTertahan && s.penilaian.rataRata != null);

  async function unduhPdf() {
    setUnduh(true);
    try {
      const res = await fetch("/api/ujian-ukk/submisi/saya/nilai-pdf", { cache: "no-store" });
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
      setUnduh(false);
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFE9FD] text-[#3E03B3] dark:bg-[#3E03B3]/30 dark:text-[#C4B5FD]"><Trophy size={16} /></span>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Nilai Saya</h1>
        </div>
        {adaNilaiTerlihat && (
          <button type="button" onClick={unduhPdf} disabled={unduh}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3E03B3] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60">
            {unduh ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Unduh PDF
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
      ) : bernilai.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFE9FD] text-[#3E03B3] dark:bg-[#3E03B3]/30 dark:text-[#C4B5FD]"><Trophy size={24} /></span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Belum ada nilai</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Nilai muncul setelah guru menilai pengumpulan kamu.</p>
        </div>
      ) : (
        <NilaiSaya items={items} onChanged={muat} judul={false} />
      )}
    </div>
  );
}
