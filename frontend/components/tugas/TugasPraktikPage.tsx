"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, Loader2, CalendarClock, Download } from "lucide-react";
import { CodePracticeCanvas } from "@/components/materi/CodePracticeCanvas";
import { useToast } from "@/components/shared/ToastSystem";
import type { TugasItem } from "./types";
import { formatTgl } from "./types";

export function TugasPraktikPage({ tugasId }: { tugasId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [tugas, setTugas] = useState<TugasItem | null>(null);
  const [galat, setGalat] = useState("");
  const [code, setCode] = useState({ html: "", css: "", js: "" });
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch(`/api/tugas/${tugasId}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(typeof d?.message === "string" ? d.message : "Tugas tidak ditemukan");
        return d as TugasItem;
      })
      .then((d) => {
        if (batal) return;
        const s = d.submisi?.[0];
        setCode({
          html: s?.submittedHtml ?? d.starterHtml ?? "",
          css: s?.submittedCss ?? d.starterCss ?? "",
          js: s?.submittedJs ?? d.starterJs ?? "",
        });
        setTugas(d);
      })
      .catch((e) => { if (!batal) setGalat(e.message); });
    return () => { batal = true; };
  }, [tugasId]);

  async function kirim() {
    if (!tugas) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("tugasId", tugas.id);
      fd.append("submittedHtml", code.html);
      fd.append("submittedCss", code.css);
      fd.append("submittedJs", code.js);
      if (catatan.trim()) fd.append("catatan", catatan.trim());
      const res = await fetch("/api/tugas/submisi", { method: "POST", body: fd });
      if (res.ok) {
        toast.success("Tugas berhasil dikumpulkan!", "Guru/Admin akan mereview tugasmu.");
        router.replace("/siswa/materi");
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error("Gagal mengumpulkan", d.message ?? "Coba lagi");
      }
    } catch {
      toast.error("Server tidak dapat dijangkau", "Periksa koneksi internet dan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Kembali"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Praktik</p>
          <h1 className="truncate text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">{tugas?.judul ?? "Memuat…"}</h1>
          {tugas && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <CalendarClock size={11} /> Deadline {formatTgl(tugas.deadline)}
            </p>
          )}
        </div>
      </div>

      {galat ? (
        <p className="rounded-2xl bg-[#FFE9E2] px-4 py-3 text-sm font-semibold text-[#E8562B]">{galat}</p>
      ) : !tugas ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500"><Loader2 size={20} className="animate-spin text-primary" /> Memuat tugas…</div>
      ) : (
        <>
          {tugas.fileUrl && (
            <a href={tugas.fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <Download size={14} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{tugas.fileName ?? "Lampiran dari guru"}</span>
            </a>
          )}
          {tugas.deskripsi && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-300">{tugas.deskripsi}</p>
          )}
          <div className="flex min-h-0 flex-1 flex-col">
            <CodePracticeCanvas key={tugas.id} initialHtml={code.html} initialCss={code.css} initialJs={code.js} onChange={setCode} minHeight={560} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Catatan (opsional)</label>
              <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tambahkan keterangan jika diperlukan..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
            </div>
            <button type="button" onClick={kirim} disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Mengirim...</> : <><Send size={14} /> Kirim Tugas</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
