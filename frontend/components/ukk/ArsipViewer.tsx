"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, FileText, Loader2, X } from "lucide-react";

type Entri = { path: string; size: number };

const TEKS = /\.(txt|md|json|js|jsx|ts|tsx|css|scss|html?|php|sql|xml|env|py|java|c|cpp|cs|ya?ml|ini|log|csv|vue|blade|sh|svg)$/i;
const GAMBAR = /\.(png|jpe?g|gif|webp)$/i;
const BISA_DILIHAT = /\.(pdf)$/i;

const bisaDilihat = (p: string) => TEKS.test(p) || GAMBAR.test(p) || BISA_DILIHAT.test(p) || !/\.[^/]+$/.test(p);
const ukuran = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`);

/**
 * Melihat isi arsip ZIP/RAR pengumpulan UKK langsung di aplikasi (tanpa mengunduh arsipnya).
 * Daftar berkas + pratinjau teks/kode, gambar, dan PDF. Di HP daftar dan pratinjau bergantian layar.
 */
export function ArsipViewer({ submisiId, nama, siswa, onClose }: { submisiId: string; nama: string; siswa: string; onClose: () => void }) {
  const [entri, setEntri] = useState<Entri[] | null>(null);
  const [galat, setGalat] = useState("");
  const [pilih, setPilih] = useState<string | null>(null);
  const [teks, setTeks] = useState<string | null>(null);
  const [muat, setMuat] = useState(false);
  const [cari, setCari] = useState("");

  useEffect(() => {
    let batal = false;
    fetch(`/api/ujian-ukk/submisi/${submisiId}/isi`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(typeof d?.message === "string" ? d.message : "Gagal membuka arsip");
        return d;
      })
      .then((d) => { if (!batal) setEntri(d.entri ?? []); })
      .catch((e) => { if (!batal) setGalat(e.message || "Gagal membuka arsip"); });
    return () => { batal = true; };
  }, [submisiId]);

  const urlBerkas = (p: string) => `/api/ujian-ukk/submisi/${submisiId}/isi/berkas?path=${encodeURIComponent(p)}`;

  useEffect(() => {
    setTeks(null);
    if (!pilih || !TEKS.test(pilih) && /\.[^/]+$/.test(pilih)) return;
    let batal = false;
    setMuat(true);
    fetch(urlBerkas(pilih), { cache: "no-store" })
      .then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => null))?.message || "Gagal membuka berkas"); return r.text(); })
      .then((t) => { if (!batal) setTeks(t); })
      .catch((e) => { if (!batal) setTeks(`⚠ ${e.message}`); })
      .finally(() => { if (!batal) setMuat(false); });
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pilih]);

  const tampil = useMemo(() => (entri ?? []).filter((e) => e.path.toLowerCase().includes(cari.trim().toLowerCase())), [entri, cari]);

  const pratinjau = () => {
    if (!pilih) return <p className="p-10 text-center text-sm font-semibold text-slate-500">Pilih berkas di daftar untuk melihat isinya</p>;
    if (GAMBAR.test(pilih)) {
      // eslint-disable-next-line @next/next/no-img-element
      return <div className="flex min-h-full items-center justify-center p-3"><img src={urlBerkas(pilih)} alt={pilih} className="max-h-full max-w-full object-contain" onContextMenu={(e) => e.preventDefault()} /></div>;
    }
    if (BISA_DILIHAT.test(pilih)) return <iframe src={urlBerkas(pilih)} title={pilih} className="h-full min-h-[60vh] w-full border-0" />;
    if (muat) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 size={20} className="animate-spin text-[#3E03B3]" /> Memuat…</div>;
    return <pre className="whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-100 sm:p-4 sm:text-xs">{teks}</pre>;
  };

  const isi = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-slate-900 sm:h-[85vh] sm:rounded-3xl">
        <div className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          {pilih && (
            <button type="button" onClick={() => setPilih(null)} aria-label="Kembali ke daftar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] sm:hidden"><ArrowLeft size={16} /></button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">{siswa}</h2>
            <p className="truncate text-xs text-slate-500">{pilih ?? nama}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]"><X size={16} /></button>
        </div>

        {galat ? (
          <p className="px-6 py-16 text-center text-sm font-semibold text-slate-600">{galat}</p>
        ) : !entri ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500"><Loader2 size={20} className="animate-spin text-[#3E03B3]" /> Membaca arsip…</div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <div className={`${pilih ? "hidden sm:flex" : "flex"} min-h-0 flex-1 flex-col border-slate-100 sm:w-80 sm:flex-none sm:border-r dark:border-slate-700`}>
              <div className="shrink-0 px-4 pb-2 sm:px-4">
                <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder={`Cari di ${entri.length} berkas…`}
                  className="w-full rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 outline-none dark:bg-slate-700 dark:text-white" />
              </div>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                {tampil.length === 0 && <p className="py-10 text-center text-xs font-semibold text-slate-500">Tidak ada berkas</p>}
                {tampil.map((e) => {
                  const on = pilih === e.path;
                  const ok = bisaDilihat(e.path);
                  return (
                    <button key={e.path} type="button" disabled={!ok} onClick={() => setPilih(e.path)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left disabled:opacity-50 ${on ? "bg-[#3E03B3] text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-700/60 dark:text-slate-100"}`}>
                      <FileText size={14} className="shrink-0" />
                      <span className="min-w-0 flex-1 break-all text-[11px] font-semibold leading-snug">{e.path}</span>
                      <span className={`shrink-0 text-[10px] ${on ? "text-white/80" : "text-slate-500"}`}>{ok ? ukuran(e.size) : "tidak bisa dilihat"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`${pilih ? "block" : "hidden sm:block"} min-h-0 flex-1 overflow-auto bg-slate-50 dark:bg-slate-800`}>{pratinjau()}</div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(isi, document.body);
}
