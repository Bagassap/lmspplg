"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, ExternalLink, FileText, Loader2, Maximize2, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { Portal } from "@/components/shared/Portal";

const TOMBOL_LAYAR = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white disabled:opacity-40";
const TOMBOL_AKSI = "flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold";

function LayarPenuh({ url, nama, onClose }: { url: string; nama: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [putar, setPutar] = useState(0);
  const [asli, setAsli] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const tutup = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [onClose]);

  const miring = putar % 180 !== 0;
  const skala = asli
    ? Math.min((window.innerWidth - 16) / (miring ? asli.h : asli.w), (window.innerHeight - 76) / (miring ? asli.w : asli.h))
    : 1;
  const lebar = asli ? asli.w * skala * zoom : 0;
  const tinggi = asli ? asli.h * skala * zoom : 0;

  return (
    <Portal>
      <div data-plain role="dialog" aria-label="Foto surat" className="fixed inset-0 z-[110] flex flex-col" style={{ background: "rgba(0,0,0,0.94)" }}>
        <div className="flex h-[60px] shrink-0 items-center gap-1.5 px-2">
          <p className="min-w-0 flex-1 truncate px-1 text-xs font-semibold text-white">{nama}</p>
          <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} disabled={zoom <= 1} aria-label="Perkecil" className={TOMBOL_LAYAR}><ZoomOut size={15} /></button>
          <button type="button" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} disabled={zoom >= 4} aria-label="Perbesar" className={TOMBOL_LAYAR}><ZoomIn size={15} /></button>
          <button type="button" onClick={() => setPutar((p) => p + 90)} aria-label="Putar" className={TOMBOL_LAYAR}><RotateCw size={15} /></button>
          <button type="button" onClick={onClose} aria-label="Tutup" className={TOMBOL_LAYAR}><X size={16} /></button>
        </div>
        <div className="flex min-h-0 flex-1 overflow-auto p-2">
          <div className="relative m-auto shrink-0" style={{ width: miring ? tinggi : lebar, height: miring ? lebar : tinggi }}>
            <img src={url} alt="Foto surat instansi"
              onLoad={(e) => setAsli({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="absolute left-1/2 top-1/2"
              style={{ width: lebar || undefined, height: tinggi || undefined, maxWidth: "none", transform: `translate(-50%, -50%) rotate(${putar}deg)`, visibility: asli ? "visible" : "hidden" }} />
          </div>
        </div>
      </div>
    </Portal>
  );
}

export function BuktiSuratViewer({ path, nama }: { path: string; nama?: string | null }) {
  const url = `/api/uploads${path}`;
  const namaBerkas = nama || "Bukti surat instansi";
  const gambar = /\.(png|jpe?g|webp)$/i.test(path);
  const pdf = /\.pdf$/i.test(path);
  const [status, setStatus] = useState<"cek" | "ada" | "hilang" | "gagal">("cek");
  const [penuh, setPenuh] = useState(false);

  useEffect(() => {
    let aktif = true;
    fetch(url, { method: "HEAD", cache: "no-store" })
      .then((r) => { if (aktif) setStatus(r.ok ? "ada" : r.status === 404 ? "hilang" : "gagal"); })
      .catch(() => { if (aktif) setStatus("gagal"); });
    return () => { aktif = false; };
  }, [url]);

  if (status === "cek") {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (status !== "ada") {
    return (
      <div className="flex items-start gap-2 rounded-2xl bg-[#FEE2E2] p-3 text-xs font-bold text-[#DC2626]">
        <AlertTriangle size={14} className="mt-px shrink-0" />
        <span>{status === "hilang" ? "Berkas surat tidak ditemukan di server. Minta siswa mengirim ulang." : "Berkas surat gagal dimuat. Periksa koneksi lalu buka kembali."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {gambar && (
        <button type="button" onClick={() => setPenuh(true)} aria-label="Perbesar foto surat" className="block w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
          <img src={url} alt="Foto surat instansi" onError={() => setStatus("gagal")} className="max-h-[26rem] w-full object-contain" />
        </button>
      )}
      {pdf && <iframe src={url} title={namaBerkas} className="hidden h-[26rem] w-full rounded-2xl border-0 bg-slate-50 lg:block" />}
      <p className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <FileText size={13} className="shrink-0" /> <span className="min-w-0 flex-1 truncate">{namaBerkas}</span>
      </p>
      <div className="flex gap-2">
        {gambar && (
          <button type="button" onClick={() => setPenuh(true)} className={`${TOMBOL_AKSI} bg-[#3E03B3] text-white`}>
            <Maximize2 size={13} /> Perbesar
          </button>
        )}
        {pdf && (
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${TOMBOL_AKSI} bg-[#3E03B3] text-white`}>
            <ExternalLink size={13} /> Buka PDF
          </a>
        )}
        <a href={url} download={namaBerkas} className={`${TOMBOL_AKSI} bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]`}>
          <Download size={13} /> Unduh
        </a>
      </div>
      {penuh && <LayarPenuh url={url} nama={namaBerkas} onClose={() => setPenuh(false)} />}
    </div>
  );
}
