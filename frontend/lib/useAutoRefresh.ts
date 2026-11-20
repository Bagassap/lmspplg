"use client";

import { useEffect, useRef } from "react";

export function useAutoRefresh(muat: () => unknown, intervalMs = 3_000, aktif = true) {
  const ref = useRef(muat);
  useEffect(() => { ref.current = muat; }, [muat]);

  useEffect(() => {
    if (!aktif) return;
    const jalan = () => { if (document.visibilityState === "visible") ref.current(); };
    const id = window.setInterval(jalan, intervalMs);
    document.addEventListener("visibilitychange", jalan);
    window.addEventListener("focus", jalan);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", jalan);
      window.removeEventListener("focus", jalan);
    };
  }, [intervalMs, aktif]);
}
