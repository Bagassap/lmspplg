"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ASPEK_NILAI, hitungRata, type PenilaianUkk } from "@/lib/ukkAspek";

export function PenilaianModal({
  submisiId, nama, awal, onClose, onSaved,
}: {
  submisiId: string; nama: string; awal?: PenilaianUkk | null; onClose: () => void; onSaved: (p: PenilaianUkk) => void;
}) {
  const toast = useToast();
  const [skor, setSkor] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const a of ASPEK_NILAI) {
      const v = awal?.skor?.[a.key];
      o[a.key] = v === undefined || v === null ? "" : String(v);
    }
    return o;
  });
  const [revisi, setRevisi] = useState(awal?.pesanRevisi ?? "");
  const [saving, setSaving] = useState(false);
  const rata = useMemo(() => hitungRata(skor), [skor]);
  const jumlah = useMemo(() => ASPEK_NILAI.reduce((a, x) => a + (Number(skor[x.key]) || 0), 0), [skor]);
  const menunggu = !!revisi.trim() && !(awal?.pesanRevisi === revisi.trim() && awal?.revisiSelesai);

  async function simpan() {
    for (const a of ASPEK_NILAI) {
      const v = skor[a.key];
      if (v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 100)) {
        toast.error("Nilai tidak valid", "Setiap aspek harus angka 0 sampai 100.");
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, number> = {};
      for (const a of ASPEK_NILAI) if (skor[a.key] !== "") body[a.key] = Number(skor[a.key]);
      const res = await fetch(`/api/ujian-ukk/submisi/${submisiId}/penilaian`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skor: body, pesanRevisi: revisi.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error("Gagal menyimpan nilai", Array.isArray(d?.message) ? d.message.join(", ") : d?.message ?? "Coba lagi");
        return;
      }
      toast.success("Penilaian disimpan", d?.rataRata != null && !d?.pesanRevisi ? `Nilai akhir ${d.rataRata}` : "");
      onSaved({ skor: d.skor, rataRata: d.rataRata, pesanRevisi: d.pesanRevisi, revisiSelesai: d.revisiSelesai });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-[28px] bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Penilaian UKK</h3>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{nama}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]"><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-5 pb-3">
          {ASPEK_NILAI.map((a, i) => (
            <div key={a.key} className="flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2.5 dark:bg-slate-800">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFE9FD] text-[11px] font-extrabold text-[#3E03B3]">{i + 1}</span>
              <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100">{a.label}</p>
              <input type="number" inputMode="decimal" min={0} max={100} value={skor[a.key]}
                onChange={(e) => setSkor((p) => ({ ...p, [a.key]: e.target.value }))} placeholder="0-100"
                className="w-20 shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-slate-800 outline-none focus:border-[#8F6DD3] dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          ))}

          <div className="flex items-center justify-between rounded-2xl bg-[#EFE9FD] px-4 py-3">
            <div>
              <p className="text-[11px] font-bold text-[#3E03B3]">Jumlah</p>
              <p className="text-lg font-extrabold text-[#3E03B3]">{jumlah}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-[#3E03B3]">Rata-rata (nilai siswa)</p>
              <p className="text-lg font-extrabold text-[#3E03B3]">{rata === null ? "—" : rata}</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Revisi (opsional)</label>
            <textarea value={revisi} onChange={(e) => setRevisi(e.target.value)} rows={3} placeholder="Tulis catatan revisi untuk siswa"
              className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white" />
            {menunggu && <p className="mt-1 text-[11px] font-semibold text-[#E8562B]">Nilai belum terlihat oleh siswa sampai siswa menyelesaikan revisi.</p>}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 px-5 pb-5 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Batal</button>
          <button type="button" disabled={saving} onClick={simpan}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3E03B3] py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {saving && <Loader2 size={14} className="animate-spin" />} Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
