// Shared color palette & helpers for jadwal-kelas tables (admin + siswa)
// Import from both pages so colours are guaranteed identical.

import {
  Globe, Database, Calculator, Languages, Lightbulb, Code2,
  Palette, Network, Smartphone, GitBranch, BookHeart, BookText,
  BookOpen,
} from "lucide-react";

// ─── Accent palette — 12 diverse colours, not just blue/purple ────────────────
// Each entry: strip = left bar & icon glyph source, light = badge bg (light mode),
// icon = icon circle bg (light mode), text = badge fg (light mode)
export const ACCENTS = [
  { strip: "#977DFF", light: "#F0EDFF", icon: "#E8E2FF", text: "#5B3FBD" },  // purple
  { strip: "#FF3644", light: "#FFECEE", icon: "#FFE0E2", text: "#CC1A26" },  // red
  { strip: "#0033FF", light: "#EBF0FF", icon: "#DCE8FF", text: "#002BD4" },  // blue
  { strip: "#FFC25B", light: "#FFF5DC", icon: "#FFEEBF", text: "#8C6500" },  // amber
  { strip: "#10B981", light: "#ECFDF5", icon: "#D1FAE5", text: "#065F46" },  // green
  { strip: "#FF7867", light: "#FFF0EE", icon: "#FFE5E1", text: "#CC4000" },  // coral/orange
  { strip: "#14B8A6", light: "#F0FDFA", icon: "#CCFBF1", text: "#0F766E" },  // teal
  { strip: "#8B5CF6", light: "#F5F0FF", icon: "#EDE8FF", text: "#6D28D9" },  // violet
  { strip: "#F59E0B", light: "#FFFBEB", icon: "#FEF3C7", text: "#92400E" },  // yellow
  { strip: "#EC4899", light: "#FDF2F8", icon: "#FCE7F3", text: "#9D174D" },  // pink
  { strip: "#6366F1", light: "#EDEFFF", icon: "#E0E7FF", text: "#4338CA" },  // indigo
  { strip: "#059669", light: "#ECFDF5", icon: "#A7F3D0", text: "#064E3B" },  // emerald
] as const;

export type Accent = typeof ACCENTS[number];

/** Deterministic accent from subject name — hash-based, consistent across renders */
export function accentFor(name: string): Accent {
  let h = 0;
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) & 0x7fffffff);
  return ACCENTS[h % ACCENTS.length];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SubjectIcon({ name, ...props }: { name: string; size?: number; style?: any; className?: string }) {
  const n = name.toLowerCase();
  const Icon =
    n.includes("web") || n.includes("html") || n.includes("javascript") ? Globe
    : n.includes("basis data") || n.includes("database") || n.includes("sql") ? Database
    : n.includes("matemat") ? Calculator
    : n.includes("inggris") || n.includes("english") ? Languages
    : n.includes("indonesia") ? BookText
    : n.includes("pkk") || n.includes("kewirausahaan") || n.includes("kreatif") ? Lightbulb
    : n.includes("pemrograman") || n.includes("coding") || n.includes("algoritma") ? Code2
    : n.includes("desain") || n.includes("grafis") ? Palette
    : n.includes("jaringan") || n.includes("network") ? Network
    : n.includes("mobile") || n.includes("android") ? Smartphone
    : n.includes("git") || n.includes("struktur data") ? GitBranch
    : n.includes("agama") || n.includes("quran") ? BookHeart
    : BookOpen;
  return <Icon {...props} />;
}

export function getInitials(nama: string) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
