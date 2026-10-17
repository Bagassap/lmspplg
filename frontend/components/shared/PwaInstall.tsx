"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PwaInstallScreen } from "./PwaInstallScreen";
import { useCanInstall, wasInstallJustHandled } from "@/lib/pwaInstall";

// Halaman yang hanya bisa dibuka setelah login (dijaga middleware).
const LOGGED_IN_PREFIXES = ["/admin", "/guru", "/siswa"];

/**
 * Mendaftarkan service worker dan menampilkan layar "Pasang aplikasi" untuk
 * user yang SUDAH login tapi membuka situs langsung ke dashboard (sesi login
 * masih aktif). Untuk login baru, layar yang sama ditampilkan oleh LoginForm
 * sebelum layar Selamat Datang, jadi di sini dilewati agar tidak dobel.
 * Lewati tidak disimpan: layar muncul lagi di muat ulang berikutnya sampai
 * aplikasi dipasang.
 */
export function PwaInstall() {
  const pathname = usePathname();
  const canInstall = useCanInstall();
  const [skipped, setSkipped] = useState(false);
  // Dihitung sekali saat mount (bukan tiap render) supaya stabil.
  const [alreadyHandled] = useState(() => wasInstallJustHandled());

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
  }, []);

  const loggedInArea = LOGGED_IN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!loggedInArea || !canInstall || skipped || alreadyHandled) return null;

  return <PwaInstallScreen onDone={() => setSkipped(true)} />;
}
