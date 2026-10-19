"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Share } from "lucide-react";
import { promptInstall } from "@/lib/pwaInstall";

/**
 * Layar penuh ajakan memasang aplikasi (gaya sama dengan layar Selamat Datang).
 * onDone dipanggil saat user selesai: memilih Pasang (Android: setelah dialog
 * install ditutup), Lewati, atau Mengerti (iOS, setelah membaca petunjuk).
 */
export function PwaInstallScreen({ onDone }: { onDone: () => void }) {
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function install() {
    const shown = await promptInstall();
    if (shown) onDone();
    else setShowIosGuide(true);
  }

  if (!mounted) return null;

  // Dirender lewat portal ke <body>: di dalam kartu login (yang punya transform/animasi)
  // elemen fixed bisa terpotong dan tidak bisa diketuk di iPhone.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      data-plain className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ backgroundColor: "#3E03B3" }}
    >
      <motion.div
        className="pointer-events-none absolute left-[8%] top-[10%] h-80 w-80 rounded-full blur-[100px]"
        style={{ background: "rgba(62,3,179,0.25)" }}
        animate={{ x: [0, 32, 0], y: [0, 18, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[8%] right-[8%] h-72 w-72 rounded-full blur-[100px]"
        style={{ background: "rgba(14,165,233,0.28)" }}
        animate={{ x: [0, -24, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 flex w-full max-w-xs flex-col items-center"
      >
        <div className="w-full rounded-3xl bg-white p-6 text-center shadow-2xl">
          <Image
            src="/PPLG.png"
            alt="Logo PPLG"
            width={676}
            height={904}
            priority
            className="mx-auto mb-4 h-24 w-auto sm:h-28"
            style={{ filter: "drop-shadow(0 6px 16px rgba(62,3,179,0.35))" }}
          />
          <h2 className="text-lg font-bold text-black">
            Pasang LMS PPLG di HP Anda
          </h2>
          <p className="mt-1.5 text-sm text-black/60">
            Buka lebih cepat dari layar utama,
            <br />
            seperti aplikasi biasa.
          </p>

          {showIosGuide && (
            <p className="mt-4 flex flex-wrap items-center justify-center gap-1 rounded-xl bg-lavender px-3 py-3 text-xs text-black/70">
              Ketuk <Share size={14} className="inline text-brand" /> Bagikan di
              Safari, lalu pilih <b>Tambahkan ke Layar Utama</b>.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            {!showIosGuide && (
              <button
                type="button"
                onClick={install}
                className="flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Download size={16} />
                Pasang
              </button>
            )}
            <button
              type="button"
              onClick={onDone}
              className="w-full touch-manipulation rounded-xl px-4 py-3 text-sm font-medium text-black/60 transition hover:bg-black/5"
            >
              {showIosGuide ? "Mengerti" : "Lewati"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
