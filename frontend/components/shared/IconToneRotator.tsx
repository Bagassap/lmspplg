"use client";

import { useEffect } from "react";
import { TONE_3D, TONE_ORDER, icon3dStyle } from "@/components/shared/Icon3D";

const PURPLE = "rgb(62, 3, 179)";

/** Kotak ikon: persegi kecil bermotif ungu polos yang membungkus satu ikon svg. */
function isPurpleIconBox(el: HTMLElement | null): el is HTMLElement {
  if (!el || el.dataset.tone === "1") return false;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (w < 26 || w > 72 || Math.abs(w - h) > 2) return false;
  if (!el.querySelector(":scope > svg")) return false;
  if (el.closest("[data-no-tone], nav, table, form")) return false;
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "A" || tag === "SVG") return false;
  const cs = getComputedStyle(el);
  return cs.backgroundColor === PURPLE || (cs.backgroundImage !== "none" && cs.backgroundImage.includes(PURPLE));
}

function sig(el: HTMLElement): string {
  return `${el.tagName}|${el.className}`;
}

/**
 * Kartu yang sejajar (grid/daftar) dengan kotak ikon ungu polos diberi warna ikon
 * bergantian: biru, hijau, ungu, oranye (palet 4 ikon), supaya tidak monoton ungu.
 * Kotak ikon tunggal (tidak punya saudara sejenis) tetap ungu.
 */
function rotate(root: ParentNode) {
  const seen = new Set<HTMLElement>();
  root.querySelectorAll("svg").forEach((svg) => {
    const box = svg.parentElement;
    if (!isPurpleIconBox(box)) return;
    let card: HTMLElement | null = box.parentElement;
    for (let depth = 0; card && depth < 6; depth++, card = card.parentElement) {
      const parent: HTMLElement | null = card.parentElement;
      if (!parent) break;
      const siblings = Array.from(parent.children) as HTMLElement[];
      if (siblings.length < 2) continue;
      const boxes = siblings.map((s) => {
        for (const sv of Array.from(s.querySelectorAll("svg"))) {
          const b = sv.parentElement;
          if (b && sig(b) === sig(box) && (b.dataset.tone === "1" || isPurpleIconBox(b))) return b;
        }
        return null;
      });
      const found = boxes.filter((b): b is HTMLElement => !!b);
      if (found.length < 2) continue;
      boxes.forEach((b, i) => {
        if (!b || seen.has(b)) return;
        seen.add(b);
        const order = boxes.slice(0, i).filter(Boolean).length;
        const tone = TONE_ORDER[order % TONE_ORDER.length];
        const st = icon3dStyle(tone);
        b.dataset.tone = "1";
        b.style.background = String(st.background ?? `linear-gradient(135deg, ${TONE_3D[tone][0]}, ${TONE_3D[tone][1]})`);
        if (st.boxShadow) b.style.boxShadow = String(st.boxShadow);
        b.style.color = "#fff";
      });
      return;
    }
  });
}

export function IconToneRotator() {
  useEffect(() => {
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => rotate(document));
    };
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
