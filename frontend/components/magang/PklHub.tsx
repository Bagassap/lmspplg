"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Building2, ChevronDown, ChevronLeft, ClipboardCheck, ClipboardList, Loader2, Lock, LogIn, LogOut, MoreVertical } from "lucide-react";
import { icon3dStyle, type Tone3D } from "@/components/shared/Icon3D";
import { RiwayatAbsenPkl } from "./RiwayatAbsenPkl";
import { LaporDiriSiswaList } from "./LaporDiriSiswaList";

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
  const [pklAktif, setPklAktif] = useState(false);
  const [absensiBuka, setAbsensiBuka] = useState(true);

  useEffect(() => {
    if (role !== "siswa") return;
    let batal = false;
    fetch("/api/magang/penempatan/saya", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!batal) setPklAktif(Array.isArray(d) && d.some((p: { status: string }) => p.status === "AKTIF")); })
      .catch(() => {});
    return () => { batal = true; };
  }, [role]);

  const AbsensiSiswa = HALAMAN.siswa.find((h) => h.key === "absensi")!.Comp;

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
    <div className="space-y-5 lg:hidden">
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-slate-900 dark:text-white">Menu PKL</h2>
        <ul className="space-y-4">
          {subs.map((s, i) => {
            const dropdown = role === "siswa" && s.key === "absensi";
            return (
              <motion.li key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                <button type="button" onClick={() => (dropdown ? setAbsensiBuka((v) => !v) : setBuka(s))} aria-expanded={dropdown ? absensiBuka : undefined}
                  className="flex w-full items-center gap-4 text-left active:opacity-70">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(s.tone)}>
                    <s.icon size={26} color="#fff" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-900 dark:text-white">{s.label}</span>
                  {dropdown
                    ? <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${absensiBuka ? "rotate-180" : ""}`} />
                    : <MoreVertical size={18} className="shrink-0 text-slate-400" />}
                </button>
                <AnimatePresence initial={false}>
                  {dropdown && absensiBuka && (
                    <motion.div key="isi" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="mt-3 space-y-5 rounded-3xl bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:bg-slate-800">
                        {pklAktif ? (
                          <>
                            <div className="pkl-inline"><AbsensiSiswa /></div>
                            <RiwayatAbsenPkl />
                          </>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              {([["Absen Datang", LogIn], ["Absen Pulang", LogOut]] as const).map(([label, Ikon]) => (
                                <button key={label} type="button" disabled
                                  className="flex flex-col items-center gap-2 rounded-2xl bg-slate-100 px-3 py-4 text-slate-400 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-500">
                                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-800">
                                    <Ikon size={20} />
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-white dark:bg-slate-600">
                                      <Lock size={10} />
                                    </span>
                                  </span>
                                  <span className="text-xs font-bold">{label}</span>
                                </button>
                              ))}
                            </div>
                            <p className="flex items-start gap-2 rounded-2xl bg-[#F1EDFA] px-3 py-2.5 text-xs font-semibold text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]">
                              <Lock size={13} className="mt-0.5 shrink-0" /> Absen terbuka setelah pendaftaran dan penempatan PKL diverifikasi admin
                            </p>
                            <RiwayatAbsenPkl />
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {role === "siswa" && pklAktif && <LaporDiriSiswaList />}

      <AnimatePresence>
        {buka && (
          <div key={buka.key} className="fixed inset-0 z-[70] flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBuka(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="pkl-embed relative z-10 flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)] dark:bg-[#0F172A]">
              <div className="flex shrink-0 justify-center bg-[#3E03B3] pt-2">
                <span className="h-1.5 w-10 rounded-full bg-white/40" />
              </div>
              <div className="flex shrink-0 items-center gap-3 bg-[#3E03B3] px-4 pb-3 pt-2">
                <button type="button" onClick={() => setBuka(null)} aria-label="Tutup"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white active:bg-white/25">
                  <ChevronLeft size={18} />
                </button>
                <h2 className="min-w-0 flex-1 truncate text-base font-bold text-white">{buka.label}</h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-10">
                <buka.Comp />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
