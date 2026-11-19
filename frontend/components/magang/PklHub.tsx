"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Building2, ChevronLeft, ChevronRight, ClipboardCheck, ClipboardList, Loader2 } from "lucide-react";
import { icon3dStyle, type Tone3D } from "@/components/shared/Icon3D";

type Role = "admin" | "guru" | "siswa";

type Sub = { key: string; label: string; href: string; icon: typeof Building2; tone: Tone3D; Comp: ComponentType };

const memuat = () => (
  <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-[#3E03B3]" /></div>
);

const HALAMAN: Record<Role, Omit<Sub, "href">[]> = {
  admin: [
    { key: "pendaftaran", label: "Pendaftaran", icon: ClipboardList, tone: "violet", Comp: dynamic(() => import("@/app/admin/magang/pendaftaran/page"), { ssr: false, loading: memuat }) },
    { key: "penempatan", label: "Penempatan", icon: Building2, tone: "amber", Comp: dynamic(() => import("@/app/admin/magang/penempatan/page"), { ssr: false, loading: memuat }) },
    { key: "absensi", label: "Absensi", icon: ClipboardCheck, tone: "emerald", Comp: dynamic(() => import("@/app/admin/magang/absensi/page"), { ssr: false, loading: memuat }) },
    { key: "rekap", label: "Rekap & Laporan", icon: BarChart3, tone: "sky", Comp: dynamic(() => import("@/app/admin/magang/rekap/page"), { ssr: false, loading: memuat }) },
  ],
  guru: [
    { key: "penempatan", label: "Penempatan", icon: Building2, tone: "amber", Comp: dynamic(() => import("@/app/guru/magang/penempatan/page"), { ssr: false, loading: memuat }) },
    { key: "absensi", label: "Absensi", icon: ClipboardCheck, tone: "emerald", Comp: dynamic(() => import("@/app/guru/magang/absensi/page"), { ssr: false, loading: memuat }) },
    { key: "rekap", label: "Rekap & Laporan", icon: BarChart3, tone: "sky", Comp: dynamic(() => import("@/app/guru/magang/rekap/page"), { ssr: false, loading: memuat }) },
  ],
  siswa: [
    { key: "penempatan", label: "Pendaftaran & Penempatan", icon: Building2, tone: "amber", Comp: dynamic(() => import("@/app/siswa/magang/penempatan/page"), { ssr: false, loading: memuat }) },
    { key: "absensi", label: "Absensi", icon: ClipboardCheck, tone: "emerald", Comp: dynamic(() => import("@/app/siswa/magang/absensi/page"), { ssr: false, loading: memuat }) },
    { key: "rekap", label: "Rekap", icon: BarChart3, tone: "sky", Comp: dynamic(() => import("@/app/siswa/magang/rekap/page"), { ssr: false, loading: memuat }) },
  ],
};

export function PklHub({ role }: { role: Role }) {
  const router = useRouter();
  const subs: Sub[] = useMemo(() => HALAMAN[role].map((s) => ({ ...s, href: `/${role}/magang/${s.key}` })), [role]);
  const [buka, setBuka] = useState<Sub | null>(null);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) router.replace(subs[0].href);
  }, [router, subs]);

  useEffect(() => {
    if (!buka) return;
    const lama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = lama; };
  }, [buka]);

  return (
    <div className="lg:hidden">
      <ul className="space-y-3">
        {subs.map((s, i) => (
          <motion.li key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
            <button type="button" onClick={() => setBuka(s)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_2px_10px_rgba(15,23,42,0.06)] active:opacity-80 dark:bg-slate-800">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(s.tone)}>
                <s.icon size={20} color="#fff" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-900 dark:text-white">{s.label}</span>
              <ChevronRight size={18} className="shrink-0 text-slate-400" />
            </button>
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {buka && (
          <motion.div key={buka.key} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="pkl-embed fixed inset-0 z-[70] flex flex-col bg-surface dark:bg-[#0F172A]">
            <div className="flex shrink-0 items-center gap-3 bg-[#3E03B3] px-4 pb-3 pt-4">
              <button type="button" onClick={() => setBuka(null)} aria-label="Tutup"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white active:bg-white/25">
                <ChevronLeft size={18} />
              </button>
              <h2 className="min-w-0 flex-1 truncate text-base font-bold text-white">{buka.label}</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-10">
              <buka.Comp />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
