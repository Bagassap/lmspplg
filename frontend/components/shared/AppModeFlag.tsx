"use client";

import { useEffect } from "react";
import { useIsAppMode } from "@/lib/pwaInstall";

/** Menandai <html data-app-mode> saat dibuka sebagai aplikasi terpasang, agar CSS mode aplikasi aktif. */
export function AppModeFlag() {
  const app = useIsAppMode();
  useEffect(() => {
    const root = document.documentElement;
    if (app) root.setAttribute("data-app-mode", "1");
    else root.removeAttribute("data-app-mode");
  }, [app]);
  return null;
}
