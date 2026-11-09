import { Download } from "lucide-react";

export function UnduhSemuaTask({ className = "" }: { className?: string }) {
  return (
    <a
      href="/api/ujian-ukk/submisi/unduh-semua"
      download
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#EFE9FD] px-3 py-2 text-xs font-bold text-[#3E03B3] ${className}`}
    >
      <Download size={13} /> <span>Unduh Semua Task</span>
    </a>
  );
}
