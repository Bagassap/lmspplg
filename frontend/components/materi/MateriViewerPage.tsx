"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, AlertCircle, Loader2, Download, FileText } from "lucide-react";
import type { MateriItem } from "./MateriFormModal";

// react-pdf touches browser-only Canvas APIs (DOMMatrix) at module-eval time,
// yang crash saat SSR — muat khusus client, sama seperti MateriPdfViewerModal.
const MateriPdfContinuous = dynamic(
  () => import("./MateriPdfContinuous").then((m) => m.MateriPdfContinuous),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center gap-3 py-20">
      <Loader2 size={28} className="animate-spin text-blue-500" />
    </div>
  ) },
);

function isPdf(fileUrl: string | null, fileName: string | null) {
  return (fileName ?? fileUrl ?? "").toLowerCase().endsWith(".pdf");
}

// Halaman penuh (bukan modal) untuk melihat satu Materi — dulu modal dengan
// navigasi "Halaman n/N" bertombol panah, sekarang halaman biasa dan semua
// halaman PDF-nya ditumpuk vertikal, tinggal di-scroll (lihat
// MateriPdfContinuous).
export function MateriViewerPage({ materiId, backHref }: { materiId: string; backHref: string }) {
  const router = useRouter();
  const [materi, setMateri] = useState<MateriItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Diberikan ke MateriPdfContinuous supaya indikator "Halaman n/N" di bawah
  // ikut ter-update saat di-scroll, tanpa tombol geser — lihat komponen itu
  // untuk cara pelacakannya (IntersectionObserver).
  const handlePageChange = useCallback((current: number, total: number) => {
    setCurrentPage(current);
    setTotalPages(total);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/materi/${materiId}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (!cancelled) setMateri(d); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [materiId]);

  const fileUrl = materi?.fileUrl ?? null;
  const proxyUrl = fileUrl ? `/api${fileUrl}` : null;
  const pdf = fileUrl ? isPdf(fileUrl, materi?.fileName ?? null) : false;

  // File materi diambil lewat proxy Next.js (bukan langsung ke backend)
  // supaya cookie sesi ikut terkirim, lalu dikonversi jadi blob URL sebelum
  // diserahkan ke <Document>.
  useEffect(() => {
    setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setPdfError(false);
    if (!proxyUrl || !pdf) return;
    let cancelled = false;
    let createdUrl: string | null = null;
    fetch(proxyUrl, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { if (cancelled) return; createdUrl = URL.createObjectURL(blob); setBlobUrl(createdUrl); })
      .catch(() => { if (!cancelled) setPdfError(true); });
    return () => { cancelled = true; if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, [proxyUrl, pdf]);

  // fixed inset-0 z-[9999] menutupi seluruh viewport (termasuk Sidebar/Topbar
  // dari DashboardShell yang tetap ter-mount di baliknya, sama seperti pola
  // yang dipakai halaman Kerjakan Tugas) — supaya "Lihat Materi" jadi
  // pengalaman full-screen tanpa chrome dashboard, bukan sekadar halaman
  // biasa di dalam <main> yang dibatasi sidebar+max-width.
  const TopBar = materi ? (
    <div className="relative flex shrink-0 items-center gap-3 overflow-hidden px-4 py-3 sm:px-6 sm:py-4" style={{ background: "#0082FB" }}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
      <button onClick={() => router.push(backHref)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25">
        <ArrowLeft size={17} />
      </button>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <BookOpen size={18} className="text-white" />
      </div>
      <div className="relative min-w-0 flex-1">
        <h2 className="truncate text-base font-extrabold text-white">{materi.judul}</h2>
        <p className="text-xs text-white/70">{materi.mapel}</p>
      </div>
      {fileUrl && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
          className="relative flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/25 sm:px-4">
          <Download size={14} /> <span className="hidden sm:inline">Unduh</span>
        </a>
      )}
    </div>
  ) : (
    <div className="relative flex shrink-0 items-center gap-3 overflow-hidden px-4 py-3 sm:px-6 sm:py-4" style={{ background: "#0082FB" }}>
      <button onClick={() => router.push(backHref)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25">
        <ArrowLeft size={17} />
      </button>
      <h2 className="text-base font-extrabold text-white">Materi</h2>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-[#F1F5F8] dark:bg-slate-900">
        {TopBar}
        <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-400">Memuat…</div>
      </div>
    );
  }

  if (notFound || !materi) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-[#F1F5F8] dark:bg-slate-900">
        {TopBar}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-400">Materi tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#F1F5F8] dark:bg-slate-900">
      {TopBar}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!fileUrl ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 p-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800">
              <AlertCircle size={28} className="text-[#C3F84A]" />
            </div>
            <p className="font-bold text-gray-700 dark:text-slate-200">Materi ini belum punya file</p>
          </div>
        ) : !pdf ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 p-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
              <FileText size={28} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-gray-700 dark:text-slate-200">{materi.fileName ?? "File modul"}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">File ini bukan PDF, jadi tidak bisa ditampilkan di sini</p>
            </div>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md" style={{ background: "#0082FB" }}>
              <Download size={14} /> Unduh File
            </a>
          </div>
        ) : pdfError ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 p-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800">
              <AlertCircle size={28} className="text-[#C3F84A]" />
            </div>
            <div>
              <p className="font-bold text-gray-700 dark:text-slate-200">PDF tidak dapat dimuat</p>
              <p className="mt-1 text-sm text-gray-500">Gunakan tombol Unduh untuk mengakses file</p>
            </div>
          </div>
        ) : !blobUrl ? (
          <div className="flex min-h-full items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-slate-400">Memuat PDF…</span>
          </div>
        ) : (
          <div className="px-4">
            <MateriPdfContinuous blobUrl={blobUrl} onError={() => setPdfError(true)} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      {pdf && !pdfError && blobUrl && totalPages > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[10000] flex justify-center">
          <span className="pointer-events-auto rounded-full bg-slate-900/85 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm dark:bg-slate-700/90">
            Halaman {currentPage} / {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
