import { isAppModeNow } from "./pwaInstall";

export function temaGelapTersimpan(): boolean {
  try {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  } catch {
    return false;
  }
}

export function terapkanTema(): boolean {
  const dark = isAppModeNow() || temaGelapTersimpan();
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}
