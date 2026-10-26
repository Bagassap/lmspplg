"use client";

import { useEffect } from "react";
import { useIsAppMode } from "@/lib/pwaInstall";

/** Memberi data-label pada sel tabel dari teks kepala kolom, agar CSS mode aplikasi bisa menampilkan tabel sebagai kartu. */
function labelTables(root: ParentNode) {
  root.querySelectorAll("table").forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent ?? "").trim());
    if (!heads.length) return;
    table.querySelectorAll("tbody tr").forEach((tr) => {
      let i = 0;
      let titled = false;
      let pairs = 0;
      Array.from(tr.children).forEach((cell) => {
        if (cell.tagName !== "TD") return;
        const label = heads[i] ?? "";
        if (!cell.hasAttribute("data-label")) cell.setAttribute("data-label", label);
        const text = (cell.textContent ?? "").trim();
        // kolom nomor urut (kepala kosong, isi angka) disembunyikan; kolom pertama berlabel jadi judul kartu
        if (!label && /^\d*$/.test(text) && !cell.querySelector("button,a,input")) cell.setAttribute("data-skip", "1");
        else if (!titled && label) { cell.setAttribute("data-title", "1"); titled = true; }
        if (/^(aksi|file|detail|rincian)$/i.test(label)) cell.setAttribute("data-aksi", "1");
        else if (!cell.hasAttribute("data-skip") && !cell.hasAttribute("data-title")) {
          pairs += 1;
          // maksimal 3 pasangan label:nilai per kartu agar tidak lebih dari 2 baris
          if (pairs > 3) cell.setAttribute("data-extra", "1");
        }
        i += Number((cell as HTMLTableCellElement).colSpan) || 1;
      });
    });
  });
}

/** Header modal berlatar warna (gradien/ungu/lime) diberi class app-sheet-header agar tampil seperti sheet aplikasi. */
function tagSheetHeaders(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".fixed.inset-0:not([data-plain])").forEach((modal) => {
    Array.from(modal.children).forEach((panel) => {
      if (panel.classList.contains("absolute") || panel.classList.contains("pointer-events-none")) return;
      const head = panel.firstElementChild as HTMLElement | null;
      if (!head || head.classList.contains("app-sheet-header")) return;
      const style = head.getAttribute("style") ?? "";
      const cls = head.className && typeof head.className === "string" ? head.className : "";
      if (/background/.test(style) || /bg-\[#(3E03B3|A1F919|00AAFA)\]|bg-linear|bg-gradient/.test(cls)) head.classList.add("app-sheet-header");
      else if (head.querySelector("h1,h2,h3") && head.querySelector("button")) head.classList.add("app-plain-header");
    });
  });
}

/** Tombol aksi di baris tabel (table maupun grid-baris) ditandai data-row-act agar seragam: ungu, ikon/teks putih. */
const ACT_SKIP = '[role="switch"],[role="checkbox"],[role="tab"],[aria-pressed],[data-keep-style]';
function tagRowActions(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('tbody tr button, [style*="grid-template-columns"] button, tbody tr a[download], tbody tr a:has(> svg:only-child), [style*="grid-template-columns"] a:has(> svg:only-child)').forEach((b) => {
    if (b.hasAttribute("data-row-act")) return;
    if (b.matches(ACT_SKIP) || b.closest("thead, .fixed.inset-0, [role=tablist]")) return;
    if (b.querySelector("img") || b.querySelector(".rounded-xl.overflow-hidden") || b.className.toString().includes("w-full")) return;
    if (b.offsetWidth > 220 || b.offsetHeight > 48) return;
    b.setAttribute("data-row-act", "1");
  });
}

/** Menandai <html data-app-mode> saat dibuka sebagai aplikasi terpasang, agar CSS mode aplikasi aktif. */
export function AppModeFlag() {
  const app = useIsAppMode();
  useEffect(() => {
    const root = document.documentElement;
    if (app) root.setAttribute("data-app-mode", "1");
    else root.removeAttribute("data-app-mode");
    if (!app) return;
    let raf = 0;
    const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { labelTables(document); tagSheetHeaders(document); }); };
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); };
  }, [app]);
  useEffect(() => {
    // hidrasi selesai: tampilkan halaman (lihat aturan data-boot-mobile di globals.css)
    const t = window.setTimeout(() => document.documentElement.setAttribute("data-hydrated", "1"), 60);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    let raf = 0;
    const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => tagRowActions(document)); };
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
