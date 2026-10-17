"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Share } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const noopSubscribe = () => () => {};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Mendaftarkan service worker dan menampilkan layar "Pasang aplikasi"
 * (latar penuh + kartu di tengah, gaya sama dengan layar Selamat Datang).
 * - Android/Chrome/Edge: tombol Pasang memicu dialog install bawaan browser.
 * - iPhone/iPad (Safari): iOS tidak punya dialog install, jadi tombol Pasang
 *   menampilkan petunjuk Bagikan -> Tambahkan ke Layar Utama.
 * Tidak tampil kalau sudah berjalan sebagai aplikasi terpasang. Lewati berarti
 * lanjut memakai browser; pilihan itu tidak disimpan, jadi layar ini muncul
 * lagi di setiap muat ulang halaman sampai aplikasi dipasang.
 */
export function PwaInstall() {
  const standalone = useSyncExternalStore(
    noopSubscribe,
    isStandalone,
    () => true,
  );
  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function skip() {
    setSkipped(true);
  }

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } else {
      setShowIosGuide(true);
    }
  }

  if (standalone || skipped) return null;
  if (!installEvent && !ios) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-999 flex flex-col items-center justify-center overflow-hidden px-6"
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
        style={{ background: "rgba(0,170,250,0.28)" }}
        animate={{ x: [0, -24, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center"
      >
        <Image
          src="/PPLG.png"
          alt="Logo PPLG"
          width={676}
          height={904}
          priority
          className="mb-6 h-20 w-auto"
          style={{
            filter:
              "drop-shadow(0 0 32px rgba(62,3,179,0.75)) drop-shadow(0 8px 24px rgba(0,0,0,0.55))",
          }}
        />

        <div className="w-full rounded-3xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-lg font-bold text-black">
            Pasang LMS PPLG di HP Anda
          </h2>
          <p className="mt-1.5 text-sm text-black/60">
            Buka lebih cepat dari layar utama, seperti aplikasi biasa.
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Download size={16} />
                Pasang
              </button>
            )}
            <button
              type="button"
              onClick={skip}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-black/60 transition hover:bg-black/5"
            >
              {showIosGuide ? "Mengerti" : "Lewati"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
