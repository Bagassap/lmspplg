"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";

export type HeaderStat = { icon: React.ComponentType<{ size?: number; className?: string }>; label: string };

function Banner({ title, eyebrow, className = "" }: { title: string; eyebrow: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${className}`}
      style={{ background: "#0082FB" }}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 right-32 h-36 w-36 rounded-full bg-white/8" />
      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
          <Users size={22} className="text-white sm:hidden" />
          <Users size={26} className="hidden text-white sm:block" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{eyebrow}</span>
          <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">{title}</h1>
        </div>
      </div>
    </div>
  );
}

export function DataSiswaHeader({ title, eyebrow = "Data Siswa" }: { title: string; eyebrow?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isGuru = pathname?.startsWith("/guru/") ?? false;

  if (!isGuru) return <Banner title={title} eyebrow={eyebrow} />;

  return (
    <>
      <Banner title={title} eyebrow={eyebrow} className="hidden lg:block" />
      <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#0082FB" }}>
        <div className="relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/guru/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">{title}</h1>
        </div>
        <div className="h-7 rounded-t-[28px] bg-surface dark:bg-[#1C2B33]" />
      </div>
    </>
  );
}
