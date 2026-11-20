"use client";

import { Loader2 } from "lucide-react";

export function LoadingState({ teks = "Loading...", className = "py-16" }: { teks?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <Loader2 size={30} className="animate-spin text-[#3E03B3] dark:text-[#C4B5FD]" />
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{teks}</p>
    </div>
  );
}
