"use client";

import { HardDrive } from "lucide-react";

export function DriveButton({ href, compact, className = "" }: { href?: string | null; compact?: boolean; className?: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FFE9E2] font-bold text-[#E8562B] transition-all hover:brightness-95 active:scale-95 ${compact ? "px-2.5 py-1.5 text-[10.5px]" : "px-3 py-1.5 text-xs"} ${className}`}>
      <HardDrive size={compact ? 12 : 13} /> Drive
    </a>
  );
}
