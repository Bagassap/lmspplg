"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Download, FileText, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { accentFor, SubjectIcon } from "@/lib/jadwalColors";

// Worker shipped with the app (public/pdf.worker.min.mjs) — no CDN dependency
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalMateriItem = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  fileUrl?: string | null;
  createdAt: string;
};

type Props = {
  materi: ModalMateriItem | null;
  mataPelajaran: string;
  backendUrl: string;
  onClose: () => void;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MateriPreviewModal({
  materi,
  mataPelajaran,
  backendUrl,
  onClose,
}: Props) {
  const accent    = accentFor(mataPelajaran);
  // Proxy URL — only used to fetch the binary here in React; NOT passed to pdf.js directly
  const proxyUrl  = materi?.fileUrl
    ? `/api/materi-kelas/${materi.id}/file?path=${encodeURIComponent(materi.fileUrl)}`
    : null;
  // Direct backend URL — used only for the explicit "Unduh PDF" download button
  const directUrl = materi?.fileUrl ? `${backendUrl}${materi.fileUrl}` : null;

  const [numPages,   setNumPages]   = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError,   setPdfError]   = useState(false);
  const [blobUrl,    setBlobUrl]    = useState<string | null>(null);
  const [pageWidth,  setPageWidth]  = useState(680);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch PDF binary with credentials in the main thread, convert to Blob URL.
  // Blob URLs: (1) never get transferred/detached unlike ArrayBuffer, (2) work
  // fine from pdf.js worker without any HTTP request or CORS preflight, and
  // (3) are just strings so react-pdf equality check never triggers spurious reloads.
  useEffect(() => {
    setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setPdfError(false);

    if (!proxyUrl) return;

    let createdUrl: string | null = null;
    let cancelled = false;

    fetch(proxyUrl, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch(() => {
        if (!cancelled) setPdfError(true);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [proxyUrl]);

  // Reset navigation state when a different materi is opened
  useEffect(() => {
    setPageNumber(1);
    setNumPages(0);
  }, [materi?.id]);

  // Measure container to make PDF fill available width responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setPageWidth(Math.floor(entry.contentRect.width) - 32);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keyboard: Escape closes, arrow keys navigate pages
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight") setPageNumber((p) => Math.min(numPages, p + 1));
      if (e.key === "ArrowLeft")  setPageNumber((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, numPages]);

  // Lock body scroll while open
  useEffect(() => {
    if (materi) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [!!materi]); // eslint-disable-line react-hooks/exhaustive-deps

  if (typeof document === "undefined") return null;

  return createPortal((
    <AnimatePresence>
      {materi && (
        <div className="fixed inset-0 z-999 flex items-end justify-center p-3 sm:items-center sm:p-4">

          {/* ── Backdrop ── */}
          <motion.div
            key="materi-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* ── Modal panel ── */}
          <motion.div
            key="materi-panel"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            style={{ maxHeight: "92vh" }}
          >

            {/* ── Colorful header ── */}
            <div
              className="relative flex shrink-0 items-start gap-4 overflow-hidden px-6 py-5"
              style={{ background: `linear-gradient(135deg, ${accent.strip}f0, ${accent.strip}a0)` }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-6 right-24 h-24 w-24 rounded-full bg-white/7" />

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-sm">
                <SubjectIcon name={mataPelajaran} size={22} className="text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white/22 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white/95">
                    Materi Pembelajaran
                  </span>
                  <span className="text-[10px] text-white/60">{formatDate(materi.createdAt)}</span>
                </div>
                <h2 className="mt-1.5 line-clamp-2 text-base font-extrabold leading-snug text-white sm:text-lg">
                  {materi.judul}
                </h2>
                <p className="mt-0.5 text-[11px] text-white/70">{mataPelajaran}</p>
              </div>

              <button
                onClick={onClose}
                aria-label="Tutup preview"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white/80 transition-colors hover:bg-white/30 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── PDF canvas area ── */}
            <div
              ref={containerRef}
              className="relative flex-1 overflow-y-auto bg-gray-100 dark:bg-slate-800"
              style={{ minHeight: 340 }}
            >
              {!materi.fileUrl ? (
                /* No file state */
                <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center" style={{ minHeight: 340 }}>
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm"
                    style={{ backgroundColor: accent.icon }}
                  >
                    <FileText size={30} style={{ color: accent.strip }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 dark:text-slate-200">Belum ada file materi</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Guru belum mengupload file untuk materi ini
                    </p>
                  </div>
                </div>
              ) : pdfError ? (
                /* Load error state */
                <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center" style={{ minHeight: 340 }}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 shadow-sm dark:bg-amber-900/20">
                    <AlertTriangle size={30} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 dark:text-slate-200">PDF tidak dapat dimuat</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Gunakan tombol Unduh di bawah untuk mengakses file
                    </p>
                  </div>
                </div>
              ) : !blobUrl ? (
                /* Fetching PDF — waiting for blob URL to be ready */
                <div className="flex items-center justify-center gap-3 py-20">
                  <Loader2 size={28} className="animate-spin" style={{ color: accent.strip }} />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Memuat PDF…</span>
                </div>
              ) : (
                /* PDF rendered via blob URL — pdf.js worker reads blob: directly,
                   no HTTP request, no CORS preflight, no cookie issue */
                <div className="flex flex-col items-center py-4">
                  <Document
                    file={blobUrl}
                    onLoadSuccess={({ numPages: n }) => {
                      setNumPages(n);
                      setPdfError(false);
                    }}
                    onLoadError={() => setPdfError(true)}
                    loading={
                      <div className="flex items-center justify-center gap-3 py-20">
                        <Loader2 size={28} className="animate-spin" style={{ color: accent.strip }} />
                        <span className="text-sm text-gray-500 dark:text-slate-400">Memuat PDF…</span>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={pageWidth > 0 ? pageWidth : 680}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      loading={
                        <div className="flex items-center justify-center py-12">
                          <Loader2 size={22} className="animate-spin" style={{ color: accent.strip }} />
                        </div>
                      }
                      className="shadow-xl"
                    />
                  </Document>
                </div>
              )}
            </div>

            {/* ── Page navigation (multi-page PDFs) ── */}
            {numPages > 1 && (
              <div className="flex shrink-0 items-center justify-center gap-3 border-t border-gray-100 bg-gray-50 py-2.5 dark:border-slate-700/60 dark:bg-slate-800/60">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold tabular-nums text-gray-600 dark:text-slate-300">
                  Halaman {pageNumber} / {numPages}
                </span>
                <button
                  onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                  disabled={pageNumber >= numPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-slate-700/60 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              {materi.deskripsi ? (
                <p className="line-clamp-2 max-w-md text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                  {materi.deskripsi}
                </p>
              ) : (
                <div />
              )}

              {/* Unduh PDF — direct http:// URL so download manager shows its dialog on explicit action */}
              {directUrl ? (
                <motion.a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${accent.strip}55` }}
                  whileTap={{ scale: 0.96 }}
                  className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${accent.strip}, ${accent.strip}cc)` }}
                >
                  <Download size={14} />
                  Unduh PDF
                </motion.a>
              ) : (
                <span className="text-xs text-gray-400 dark:text-slate-500">Tidak ada file</span>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  ), document.body);
}
