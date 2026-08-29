"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, FileText } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Semua halaman PDF ditumpuk vertikal dalam satu <Document> dan dibiarkan
// mengalir dengan scroll halaman biasa — bukan lagi 1 halaman per tampilan
// dengan tombol panah kiri/kanan. Halaman mana yang sedang terlihat tetap
// dilacak (lewat IntersectionObserver, bukan klik) supaya pemanggil bisa
// menampilkan indikator "Halaman n/N" yang ikut ter-update saat di-scroll.
export function MateriPdfContinuous({
  blobUrl, onError, onPageChange,
}: {
  blobUrl: string;
  onError: () => void;
  onPageChange?: (current: number, total: number) => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(640);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const currentPageRef = useRef(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setPageWidth(Math.floor(e.contentRect.width) - 32));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // "Halaman aktif" = halaman yang sedang melintasi garis tengah viewport —
  // rootMargin menyempitkan area deteksi jadi pita tipis di tengah layar,
  // supaya hanya ~1 halaman yang terdeteksi aktif pada satu waktu.
  useEffect(() => {
    if (numPages === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        const pageNum = Number((top.target as HTMLElement).dataset.pageNumber);
        if (pageNum && pageNum !== currentPageRef.current) {
          currentPageRef.current = pageNum;
          onPageChange?.(pageNum, numPages);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, onPageChange]);

  return (
    <div ref={containerRef} className="mx-auto flex max-w-4xl flex-col items-center gap-10 py-6">
      <Document file={blobUrl}
        onLoadSuccess={({ numPages: n }) => { setNumPages(n); currentPageRef.current = 1; onPageChange?.(1, n); }}
        onLoadError={onError}
        loading={<div className="flex items-center justify-center gap-3 py-20"><Loader2 size={28} className="animate-spin text-blue-500" /></div>}>
        {Array.from({ length: numPages }, (_, i) => (
          // Tiap halaman jadi blok tersendiri (label + jarak besar antar
          // halaman) supaya jelas terpisah, bukan menyambung tanpa jeda.
          <div key={i} data-page-number={i + 1}
            ref={(el) => { if (el) pageRefs.current.set(i + 1, el); else pageRefs.current.delete(i + 1); }}
            className="flex w-full flex-col items-center gap-3">
            {/* Pembatas antar-halaman: garis tipis + label mengambang di
                tengah, bukan kotak solid — lebih elegan, kesannya seperti
                pemisah bagian dokumen, bukan sekadar penanda teknis. */}
            <div className="flex w-full max-w-xs items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                <FileText size={11} className="text-[#0033FF]" />
                Halaman {i + 1}
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
            <Page pageNumber={i + 1} width={pageWidth > 0 ? pageWidth : 640}
              renderAnnotationLayer={false} renderTextLayer={false}
              loading={<div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-blue-500" /></div>}
              className="overflow-hidden rounded-xl shadow-2xl shadow-slate-900/10 ring-1 ring-black/5" />
          </div>
        ))}
      </Document>
    </div>
  );
}
