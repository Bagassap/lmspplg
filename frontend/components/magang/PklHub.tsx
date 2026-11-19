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

const KARTU = [
  "linear-gradient(150deg, #3E03B3 0%, #5B16D9 100%)",
  "linear-gradient(150deg, #5B16D9 0%, #8B5CF6 100%)",
  "linear-gradient(150deg, #2D0281 0%, #3E03B3 100%)",
  "linear-gradient(150deg, #7C3AED 0%, #A78BFA 100%)",
];

function Cincin({ persen }: { persen: number }) {
  const r = 22;
  const k = 2 * Math.PI * r;
  const isi = Math.max(0, Math.min(100, persen));
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0 -rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#F1EDFA" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="#3E03B3" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={k} strokeDashoffset={k - (k * isi) / 100} />
    </svg>
  );
}

function useRingkasan(role: Role) {
  const [r, setR] = useState<{ label: string; nilai: string; persen: number } | null>(null);
  useEffect(() => {
    let batal = false;
    const ambil = async () => {
      try {
        if (role === "siswa") {
          const [d, p] = await Promise.all([
            fetch("/api/magang/pendaftaran/saya", { cache: "no-store" }).then((x) => (x.ok ? x.json() : null)),
            fetch("/api/magang/penempatan/saya", { cache: "no-store" }).then((x) => (x.ok ? x.json() : [])),
          ]);
          const list: { status: string }[] = Array.isArray(p) ? p : [];
          let tahap = 0;
          if (d?.pendaftaran) tahap = 1;
          if (d?.pendaftaran?.status === "DITERIMA") tahap = 2;
          if (list.some((x) => x.status === "MENUNGGU" || x.status === "AKTIF")) tahap = 3;
          if (list.some((x) => x.status === "AKTIF" || x.status === "SELESAI")) tahap = 4;
          if (!batal) setR({ label: "Tahapan PKL", nilai: `${tahap} / 4 tahap`, persen: (tahap / 4) * 100 });
        } else {
          const url = role === "guru" ? "/api/magang/penempatan/bimbingan" : "/api/magang/penempatan";
          const data = await fetch(url, { cache: "no-store" }).then((x) => (x.ok ? x.json() : []));
          const list: { status: string }[] = Array.isArray(data) ? data : [];
          const aktif = list.filter((x) => x.status === "AKTIF").length;
          if (!batal) setR({
            label: role === "guru" ? "Siswa bimbingan aktif" : "Penempatan aktif",
            nilai: `${aktif} / ${list.length} siswa`,
            persen: list.length ? (aktif / list.length) * 100 : 0,
          });
        }
      } catch {
        if (!batal) setR({ label: "Ringkasan PKL", nilai: "-", persen: 0 });
      }
    };
    ambil();
    return () => { batal = true; };
  }, [role]);
  return r;
}

export function PklHub({ role }: { role: Role }) {
  const router = useRouter();
  const subs: Sub[] = useMemo(() => HALAMAN[role].map((s) => ({ ...s, href: `/${role}/magang/${s.key}` })), [role]);
  const [buka, setBuka] = useState<Sub | null>(null);
  const ringkasan = useRingkasan(role);

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
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {subs.map((s, i) => (
          <motion.button key={s.key} type="button" onClick={() => setBuka(s)}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex h-40 w-36 shrink-0 snap-start flex-col overflow-hidden rounded-3xl p-4 text-left text-white"
            style={{ background: KARTU[i % KARTU.length] }}>
            <span className="relative z-10 text-sm font-extrabold leading-tight">{s.label}</span>
            <s.icon size={78} strokeWidth={1.5} className="absolute -bottom-3 -right-3 text-white/25" />
            <span className="relative z-10 mt-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <s.icon size={18} />
            </span>
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:bg-slate-800">
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold text-slate-900 dark:text-white">{ringkasan?.nilai ?? "…"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{ringkasan?.label ?? "Memuat"}</p>
        </div>
        <Cincin persen={ringkasan?.persen ?? 0} />
      </div>

      <section>
        <h2 className="mb-2 text-base font-extrabold text-slate-900 dark:text-white">Menu PKL</h2>
        <ul className="space-y-1">
          {subs.map((s) => (
            <li key={s.key}>
              <button type="button" onClick={() => setBuka(s)} className="flex w-full items-center gap-3 rounded-2xl py-2 text-left active:opacity-70">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(s.tone)}>
                  <s.icon size={20} color="#fff" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">{s.label}</span>
                <ChevronRight size={18} className="shrink-0 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      </section>

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
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-10">
              <buka.Comp />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
