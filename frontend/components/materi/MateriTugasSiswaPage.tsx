"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, Search, Send } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { MateriSiswaPage } from "./MateriSiswaPage";
import { TugasListCardSiswa } from "@/components/tugas/TugasListCardSiswa";
import { SubmitTugasModal } from "@/components/tugas/SubmitTugasModal";
import { SubmisiSayaModal } from "@/components/tugas/SubmisiSayaModal";
import { isTugasActive } from "@/components/tugas/types";
import type { TugasItem, TugasSubmisiItem } from "@/components/tugas/types";
import type { MateriItem } from "./MateriFormModal";
import { SiswaAppMateriTugas } from "./SiswaAppMateriTugas";
import { useIsAppMode } from "@/lib/pwaInstall";

type Category = "materi" | "tugas";

export function MateriTugasSiswaPage() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const appMode = useIsAppMode();
  const [materiList, setMateriList] = useState<MateriItem[]>([]);
  const materiCount = materiList.length;
  const [tugasList, setTugasList] = useState<TugasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>(() => (searchParams.get("tab") === "tugas" ? "tugas" : "materi"));
  const [searchMateri, setSearchMateri] = useState("");
  const [searchTugas, setSearchTugas] = useState("");

  const [submitTarget, setSubmitTarget] = useState<TugasItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ s: TugasSubmisiItem; t: TugasItem } | null>(null);
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([
        fetch("/api/materi").then((r) => r.json()),
        fetch("/api/tugas").then((r) => r.json()),
      ]);
      setMateriList(Array.isArray(m) ? m : []);
      setTugasList(Array.isArray(t) ? t : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function handleKumpulkan(t: TugasItem) {
    setSubmitTarget(t);
  }

  async function doSubmit(fd: FormData) {
    try {
      const res = await fetch("/api/tugas/submisi", { method: "POST", body: fd });
      if (res.ok) {
        const submisi: TugasSubmisiItem = await res.json();
        const tugas = submitTarget;
        if (tugas?.tipe === "PILIHAN_GANDA" && typeof submisi.nilai === "number") {
          toast.success(`Nilai kamu: ${submisi.nilai}`, submisi.nilai === 100 ? "Semua jawaban benar!" : "Tugas berhasil dikumpulkan dan langsung dinilai.");
          setSubmitTarget(null);
          setDetailTarget({ s: submisi, t: tugas });
        } else {
          toast.success("Tugas berhasil dikumpulkan!", "Guru/Admin akan mereview tugasmu.");
          setSubmitTarget(null);
        }
        loadAll();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error("Gagal mengumpulkan", d.message ?? "Coba lagi");
      }
    } catch {
      toast.error("Server tidak dapat dijangkau", "Periksa koneksi internet dan coba lagi. Kalau file cukup besar, coba jaringan yang lebih stabil.");
    }
  }

  const active = tugasList.filter((t) => isTugasActive(t));
  const perluDikerjakan = active.filter((t) => !t.submisi || t.submisi.length === 0).length;

  const classic = (
    <div className="space-y-6">
      <div className="relative hidden overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
            style={{ background: "linear-gradient(145deg, #0EA5E9 0%, #3E03B3 55%, #2D0281 100%)" }}>
            <BookOpen size={22} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:hidden" />
            <BookOpen size={26} className="hidden text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] sm:block" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Belajar & Praktik</span>
            <h1 className="text-xl font-extrabold leading-tight text-slate-800 dark:text-white sm:text-2xl">Materi & Tugas</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800 lg:block">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kategori</p>
            <div className="flex flex-col gap-4">
              <button type="button" onClick={() => setCategory("materi")}
                className="relative flex h-24 items-center gap-4 overflow-hidden rounded-2xl px-5 py-5 text-left text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "#3E03B3",
                  boxShadow: category === "materi" ? "0 8px 24px rgba(62,3,179,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                  outline: category === "materi" ? "2px solid #3E03B3" : "none",
                  outlineOffset: "3px",
                }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <BookOpen size={16} />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="truncate text-xl font-black leading-tight">Materi</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">{materiCount} materi tersedia</p>
                </div>
              </button>

              <button type="button" onClick={() => setCategory("tugas")}
                className="relative flex h-24 items-center gap-4 overflow-hidden rounded-2xl px-5 py-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "#F26A3D", color: "#FFFFFF",
                  boxShadow: category === "tugas" ? "0 8px 24px rgba(242,106,61,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                  outline: category === "tugas" ? "2px solid #F26A3D" : "none",
                  outlineOffset: "3px",
                }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <Send size={16} />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="truncate text-xl font-black leading-tight">Tugas</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">
                    {tugasList.length} tugas · {perluDikerjakan > 0 ? `${perluDikerjakan} belum dikerjakan` : "semua sudah dikumpulkan"}
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
            <div className="relative flex items-center px-4 pb-3 pt-4">
              <button type="button" onClick={() => router.push("/siswa/dashboard")}
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25">
                <ChevronLeft size={18} />
              </button>
              <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Materi & Tugas</h1>
            </div>
            <div className="rounded-t-[28px] bg-[#FFFFFF] px-4 py-3 dark:bg-[#1E293B]">
            <div className="space-y-3 rounded-3xl bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1E293B]">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
                {category === "materi" ? (
                  <input value={searchMateri} onChange={(e) => setSearchMateri(e.target.value)}
                    placeholder="Cari judul materi, mapel..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-[#3E03B3] focus:ring-2 focus:ring-[#3E03B3]/15 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200" />
                ) : (
                  <input value={searchTugas} onChange={(e) => setSearchTugas(e.target.value)}
                    placeholder="Cari nama tugas atau mapel..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-[#3E03B3] focus:ring-2 focus:ring-[#3E03B3]/15 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200" />
                )}
              </div>

              <div className="isolate flex gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-700">
                <button type="button" onClick={() => setCategory("materi")}
                  className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors"
                  style={{ color: category === "materi" ? "#fff" : "#94a3b8" }}>
                  {category === "materi" && (
                    <motion.span layoutId="materiTugasTabPill" className="absolute inset-0 rounded-xl"
                      style={{ background: "#3E03B3" }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5"><BookOpen size={15} /> Materi</span>
                </button>
                <button type="button" onClick={() => setCategory("tugas")}
                  className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors"
                  style={{ color: category === "tugas" ? "#0F172A" : "#94a3b8" }}>
                  {category === "tugas" && (
                    <motion.span layoutId="materiTugasTabPill" className="absolute inset-0 rounded-xl"
                      style={{ background: "#F26A3D" }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5"><Send size={15} /> Tugas</span>
                  {perluDikerjakan > 0 && (
                    <span className="absolute -right-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3E03B3] px-1 text-[9px] font-bold text-white">
                      {perluDikerjakan}
                    </span>
                  )}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>

        {category === "materi" ? (
          <MateriSiswaPage embedded search={searchMateri} onSearchChange={setSearchMateri} />
        ) : (
          <TugasListCardSiswa
            tugasList={tugasList}
            loading={loading}
            onKumpulkan={handleKumpulkan}
            onLihatDetail={(s, t) => setDetailTarget({ s, t })}
            search={searchTugas}
            onSearchChange={setSearchTugas}
          />
        )}
      </div>

    </div>
  );

  const modals = (
    <>
      <SubmitTugasModal tugas={submitTarget} onClose={() => setSubmitTarget(null)} onSubmit={doSubmit} />

      <SubmisiSayaModal
        target={detailTarget?.s ?? null}
        judul={detailTarget?.t.judul}
        tipe={detailTarget?.t.tipe}
        onClose={() => setDetailTarget(null)}
        onKirimUlang={() => {
          const t = detailTarget?.t;
          setDetailTarget(null);
          if (t) handleKumpulkan(t);
        }}
      />
    </>
  );

  if (!appMode) return <>{classic}{modals}</>;

  return (
    <>
      <div className="lg:hidden">
        <SiswaAppMateriTugas
          materi={materiList}
          tugas={tugasList}
          loading={loading}
          initialTab={category}
          onKumpulkan={handleKumpulkan}
          onLihatSubmisi={(s, t) => setDetailTarget({ s, t })}
        />
      </div>
      <div className="hidden lg:block">{classic}</div>
      {modals}
    </>
  );
}
