"use client";

import { useSyncExternalStore } from "react";

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Event install bisa muncul kapan saja setelah halaman dimuat (mis. saat user
// masih mengetik di halaman login), jadi ditangkap di level modul dan disimpan
// di sini supaya layar pasang di alur login pun bisa memakainya.
let installEvent: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvent = e as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

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

/** true bila aplikasi bisa dipasang sekarang (belum terpasang & didukung). */
export function useCanInstall() {
  const standalone = useSyncExternalStore(noopSubscribe, isStandalone, () => true);
  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false);
  const event = useSyncExternalStore(subscribe, () => installEvent, () => null);
  return !standalone && (!!event || ios);
}

/** true bila ada dialog install bawaan browser (Android/Chrome/Edge). */
export function useHasNativePrompt() {
  return !!useSyncExternalStore(subscribe, () => installEvent, () => null);
}

/** Tampilkan dialog install bawaan browser. false kalau tidak tersedia (iOS). */
export async function promptInstall() {
  if (!installEvent) return false;
  const ev = installEvent;
  await ev.prompt();
  await ev.userChoice;
  installEvent = null;
  emit();
  return true;
}

// Penanda bahwa layar pasang baru saja ditampilkan di alur login, supaya tidak
// muncul dobel di dashboard tepat setelahnya.
const HANDLED_KEY = "lms_install_handled_at";
const HANDLED_WINDOW_MS = 60_000;

export function markInstallHandled() {
  try {
    sessionStorage.setItem(HANDLED_KEY, String(Date.now()));
  } catch {}
}

export function wasInstallJustHandled() {
  try {
    const at = Number(sessionStorage.getItem(HANDLED_KEY));
    return !!at && Date.now() - at < HANDLED_WINDOW_MS;
  } catch {
    return false;
  }
}
