"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useIsAppMode } from "@/lib/pwaInstall";

export type HeaderStat = { icon: React.ComponentType<{ size?: number; className?: string }>; label: string };

export function DataSiswaHeader({ title }: { title: string; eyebrow?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const app = useIsAppMode();
  const isGuru = pathname?.startsWith("/guru/") ?? false;
  const isAdmin = pathname?.startsWith("/admin/") ?? false;

  if (!isGuru && !isAdmin) return null;

  const dashboardHref = isGuru ? "/guru/dashboard" : "/admin/dashboard";

  return (
    <>
      {app ? null : (
      <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
        <div className="relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push(dashboardHref)}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">{title}</h1>
        </div>
        <div className="h-7 rounded-t-[28px] bg-surface dark:bg-[#0F172A]" />
      </div>
      )}
    </>
  );
}
