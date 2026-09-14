"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ChevronLeft } from "lucide-react";
import { PenempatanTable } from "@/components/magang/PenempatanTable";
import type { PenempatanMagang } from "@/components/magang/types";

export default function GuruMagangPenempatanPage() {
  const router = useRouter();
  const [list, setList] = useState<PenempatanMagang[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/magang/penempatan/bimbingan", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="lg:p-1">
      <div className="relative hidden overflow-hidden rounded-2xl p-6 lg:block" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <Briefcase size={22} className="text-white sm:hidden" />
            <Briefcase size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">PKL</span>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Siswa Bimbingan PKL</h1>
          </div>
        </div>
      </div>

      <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#0082FB" }}>
        <div className="relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/guru/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Siswa Bimbingan PKL</h1>
        </div>
        <div className="h-7 rounded-t-[28px] bg-surface dark:bg-[#1C2B33]" />
      </div>

      <div className="mt-0 lg:mt-5">
        {!loading && list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <Briefcase size={24} className="text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Belum ada siswa bimbingan PKL</p>
            <p className="max-w-sm text-xs text-slate-400">Admin akan menetapkan Anda sebagai pembimbing saat menempatkan siswa ke tempat magang.</p>
          </div>
        ) : (
          <PenempatanTable loading={loading} list={list} canManage={false} mobileNative />
        )}
      </div>
    </div>
  );
}
