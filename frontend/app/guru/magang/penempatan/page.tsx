"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ChevronLeft } from "lucide-react";
import { PenempatanTable } from "@/components/magang/PenempatanTable";
import type { PenempatanMagang } from "@/components/magang/types";
import { AppEmpty } from "@/components/app/AppUI";
import { useIsAppMode } from "@/lib/pwaInstall";

export default function GuruMagangPenempatanPage() {
  const router = useRouter();
  const appMode = useIsAppMode();
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

      {appMode ? (
        <div className="mb-5 lg:hidden">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">PKL</p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Siswa Bimbingan PKL</h1>
        </div>
      ) : (
      <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
        <div className="relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/guru/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Siswa Bimbingan PKL</h1>
        </div>
        <div className="h-7 rounded-t-[28px] bg-surface dark:bg-[#0F172A]" />
      </div>
      )}

      <div className="mt-0 lg:mt-5">
        {!loading && list.length === 0 && appMode ? (
          <div className="lg:hidden"><AppEmpty icon={Briefcase} title="Belum ada siswa bimbingan PKL" desc="Admin akan menetapkan Anda sebagai pembimbing saat menempatkan siswa ke tempat magang." /></div>
        ) : !loading && list.length === 0 ? (
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
