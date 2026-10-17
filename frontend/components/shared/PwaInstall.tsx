"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "lms_pwa_install_dismissed";
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
 * Mendaftarkan service worker dan menampilkan ajakan "Pasang aplikasi".
 * - Android/Chrome/Edge: tombol memicu dialog install bawaan browser.
 * - iPhone/iPad (Safari): iOS tidak punya dialog install, jadi ditampilkan
 *   petunjuk Share -> Add to Home Screen.
 * Tidak tampil kalau sudah berjalan sebagai aplikasi terpasang.
 */
export function PwaInstall() {
  const standalone = useSyncExternalStore(
    noopSubscribe,
    isStandalone,
    () => true,
  );
  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== "undefined" &&
        localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

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

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (standalone || dismissed) return null;
  if (!installEvent && !ios) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:p-0">
      <div className="relative rounded-2xl border border-black/10 bg-white p-4 shadow-xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-full p-1.5 text-black/40 hover:bg-black/5"
        >
          <X size={16} />
        </button>
        <p className="pr-6 text-sm font-semibold text-black">
          Pasang LMS PPLG di HP Anda
        </p>
        {installEvent ? (
          <>
            <p className="mt-1 text-xs text-black/60">
              Buka lebih cepat dari layar utama, seperti aplikasi biasa.
            </p>
            <button
              type="button"
              onClick={install}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Download size={16} />
              Pasang aplikasi
            </button>
          </>
        ) : (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-black/60">
            Ketuk <Share size={14} className="inline text-brand" /> Bagikan di
            Safari, lalu pilih <b>Tambahkan ke Layar Utama</b>.
          </p>
        )}
      </div>
    </div>
  );
}
