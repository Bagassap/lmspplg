"use client";

import { useSyncExternalStore } from "react";

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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

export function isAppModeNow() { return isAppMode(); }

const MOBILE_QUERY = "(max-width: 1023px)";

function subscribeViewport(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function isAppMode() {
  if (isStandalone()) return true;
  if (window.matchMedia(MOBILE_QUERY).matches) return true;
  try {
    if (new URLSearchParams(window.location.search).get("app") === "1") {
      sessionStorage.setItem("lms_force_app", "1");
    }
    return sessionStorage.getItem("lms_force_app") === "1";
  } catch {
    return false;
  }
}

export function useIsAppMode() {
  return useSyncExternalStore(subscribeViewport, isAppMode, () => false);
}

export function useCanInstall() {
  const standalone = useSyncExternalStore(noopSubscribe, isStandalone, () => true);
  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false);
  const event = useSyncExternalStore(subscribe, () => installEvent, () => null);
  return !standalone && (!!event || ios);
}

export function useHasNativePrompt() {
  return !!useSyncExternalStore(subscribe, () => installEvent, () => null);
}

export async function promptInstall() {
  if (!installEvent) return false;
  const ev = installEvent;
  await ev.prompt();
  await ev.userChoice;
  installEvent = null;
  emit();
  return true;
}

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
