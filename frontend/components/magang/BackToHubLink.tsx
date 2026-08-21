import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToHubLink({ href }: { href: string }) {
  return (
    <Link href={href} className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#0082FB] dark:text-slate-500 dark:hover:text-blue-400">
      <ArrowLeft size={13} /> Kembali ke Rekap &amp; Laporan
    </Link>
  );
}
