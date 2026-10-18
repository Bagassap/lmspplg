"use client";

import { useEffect } from "react";

/**
 * Hanya mendaftarkan service worker (untuk PWA, offline, dan push).
 * Layar "Pasang aplikasi" TIDAK ditampilkan di sini: ia hanya muncul sekali
 * setelah login, sebelum layar Selamat Datang (lihat LoginForm), bukan di
 * setiap muat ulang halaman.
 */
export function PwaInstall() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
  }, []);
  return null;
}
