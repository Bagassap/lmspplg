"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, Search, Send } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { MateriListPage } from "./MateriListPage";
import { TugasFormModal } from "@/components/tugas/TugasFormModal";
import { TugasListCard } from "@/components/tugas/TugasListCard";
import { SubmisiTugasModal } from "@/components/tugas/SubmisiTugasModal";
import { RevisiFormModal } from "@/components/tugas/RevisiFormModal";
import type { TugasItem, TugasSubmisiItem } from "@/components/tugas/types";
import { AppTabs } from "@/components/app/AppUI";
import { useIsAppMode } from "@/lib/pwaInstall";

type MateriRef = { id: string };
type Category = "materi" | "tugas";

export function MateriTugasGuruPage() {
  const toast = useToast();
  const router = useRouter();
  const appMode = useIsAppMode();
  const searchParams = useSearchParams();
  const [materiList, setMateriList] = useState<MateriRef[]>([]);
  const [tugasList, setTugasList] = useState<TugasItem[]>([]);
  const [submisiList, setSubmisiList] = useState<TugasSubmisiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>(() => (searchParams.get("tab") === "tugas" ? "tugas" : "materi"));
  const [searchMateri, setSearchMateri] = useState("");
  const [searchTugas, setSearchTugas] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [mapelOptions, setMapelOptions] = useState<string[]>([]);
  const [mapelLoaded, setMapelLoaded] = useState(false);

  const [tugasFormOpen, setTugasFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TugasItem | null>(null);
  const [submisiModalTugas, setSubmisiModalTugas] = useState<TugasItem | null>(null);
  const [revisiTarget, setRevisiTarget] = useState<TugasSubmisiItem | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t, s] = await Promise.all([
        fetch("/api/materi").then((r) => r.json()),
        fetch("/api/tugas").then((r) => r.json()),
        fetch("/api/tugas/submisi").then((r) => r.json()),
      ]);
      setMateriList(Array.isArray(m) ? m : []);
      setTugasList(Array.isArray(t) ? t : []);
      setSubmisiList(Array.isArray(s) ? s : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (category === "tugas") loadAll(); }, [category]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setCurrentUserId(d?.id ?? "");
      setCurrentUserRole(d?.role ?? "");
    }).catch(() => {});
    fetch("/api/mapel/saya").then((r) => r.json()).then((d) => {
      setMapelOptions(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setMapelLoaded(true));
  }, []);

  const canCreate = mapelLoaded && mapelOptions.length > 0;

  async function deleteTugas(id: string) {
    if (!await toast.confirm("Hapus tugas ini?", "Semua submisi siswa untuk tugas ini juga akan terhapus.")) return;
    const res = await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Tugas dihapus", ""); loadAll(); }
    else toast.error("Gagal menghapus tugas");
  }

  async function updateStatus(id: string, status: "DITERIMA" | "REVISI", pesanRevisi?: string) {
    const res = await fetch(`/api/tugas/submisi/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(pesanRevisi ? { pesanRevisi } : {}) }),
    });
    if (res.ok) {
      toast.success(status === "DITERIMA" ? "Tugas diterima!" : "Revisi dikirim ke siswa", "");
      loadAll();
    } else {
      toast.error("Gagal memperbarui status");
    }
  }

  async function kirimRevisi(id: string, pesan: string) {
    await updateStatus(id, "REVISI", pesan);
    setRevisiTarget(null);
  }

  async function simpanNilai(submisiId: string, nilai: number) {
    const res = await fetch(`/api/tugas/submisi/${submisiId}/nilai`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nilai }),
    });
    if (res.ok) {
      toast.success("Nilai disimpan!", `Nilai ${nilai} tersimpan, tugas otomatis ditandai selesai.`);
      loadAll();
    } else {
      toast.error("Gagal menyimpan nilai");
    }
  }

  const perluReview = submisiList.filter((s) => s.status === "TERKIRIM").length;

  return (
    <div className="space-y-6">
      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.25),0_2px_4px_rgba(62,3,179,0.35)] sm:h-14 sm:w-14"
            style={{ background: "linear-gradient(145deg, #00AAFA 0%, #3E03B3 55%, #2D0281 100%)" }}>
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
                className="relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-left text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "#3E03B3",
                  boxShadow: category === "materi" ? "0 8px 24px rgba(62,3,179,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                  outline: category === "materi" ? "2px solid #3E03B3" : "none",
                  outlineOffset: "3px",
                }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                  <BookOpen size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-xl font-black leading-tight">Materi</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">{materiList.length} materi tersedia</p>
                </div>
              </button>

              <button type="button" onClick={() => setCategory("tugas")}
                className="relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "#A1F919", color: "#000000",
                  boxShadow: category === "tugas" ? "0 8px 24px rgba(161,249,25,0.35)" : "0 8px 24px rgba(0,0,0,0.15)",
                  outline: category === "tugas" ? "2px solid #A1F919" : "none",
                  outlineOffset: "3px",
                }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#000000]/10" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-[#000000]/15">
                  <Send size={16} />
                </div>
                <div className="relative min-w-0">
                  <p className="truncate text-xl font-black leading-tight">Tugas</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[#000000]/75">
                    {tugasList.length} tugas · {perluReview > 0 ? `${perluReview} perlu review` : "semua direview"}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {appMode ? (
            <div className="space-y-5 lg:hidden">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Belajar &amp; Praktik</p>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Materi &amp; Tugas</h1>
              </div>
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={category === "materi" ? searchMateri : searchTugas}
                  onChange={(e) => (category === "materi" ? setSearchMateri(e.target.value) : setSearchTugas(e.target.value))}
                  placeholder={category === "materi" ? "Cari materi..." : "Cari tugas..."}
                  className="w-full rounded-full bg-slate-100 py-3.5 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#3E03B3]/30 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <AppTabs
                tabs={[["materi", "Materi"], ["tugas", perluReview > 0 ? `Tugas (${perluReview})` : "Tugas"]] as const}
                value={category} onChange={setCategory} layoutId="app-materi-guru-tab" />
            </div>
          ) : (
          <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
            <div className="relative flex items-center px-4 pb-3 pt-4">
              <button type="button" onClick={() => router.push("/guru/dashboard")}
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

              <div className="isolate flex gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/60">
                <button type="button" onClick={() => setCategory("materi")}
                  className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors"
                  style={{ color: category === "materi" ? "#fff" : "#94a3b8" }}>
                  {category === "materi" && (
                    <motion.span layoutId="materiTugasGuruTabPill" className="absolute inset-0 rounded-xl"
                      style={{ background: "#3E03B3" }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5"><BookOpen size={15} /> Materi</span>
                </button>
                <button type="button" onClick={() => setCategory("tugas")}
                  className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors"
                  style={{ color: category === "tugas" ? "#000000" : "#94a3b8" }}>
                  {category === "tugas" && (
                    <motion.span layoutId="materiTugasGuruTabPill" className="absolute inset-0 rounded-xl"
                      style={{ background: "#A1F919" }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5"><Send size={15} /> Tugas</span>
                  {perluReview > 0 && (
                    <span className="absolute -right-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#A1F919] px-1 text-[9px] font-bold text-black">
                      {perluReview}
                    </span>
                  )}
                </button>
              </div>
            </div>
            </div>
          </div>
          )}
        </div>

        {category === "materi" ? (
          <MateriListPage
            embedded
            mobileNative
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            mapelOptions={mapelOptions}
            canCreate={canCreate}
            search={searchMateri}
            onSearchChange={setSearchMateri}
          />
        ) : (
          <TugasListCard
            tugasList={tugasList}
            submisiList={submisiList}
            loading={loading}
            mobileNative
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            canCreate={canCreate}
            onAddTugas={() => { setEditTarget(null); setTugasFormOpen(true); }}
            onEditTugas={(t) => { setEditTarget(t); setTugasFormOpen(true); }}
            onDeleteTugas={deleteTugas}
            onLihatSubmisi={(t) => setSubmisiModalTugas(t)}
            search={searchTugas}
            onSearchChange={setSearchTugas}
          />
        )}
      </div>

      <SubmisiTugasModal
        tugas={submisiModalTugas}
        submisi={submisiList}
        onClose={() => setSubmisiModalTugas(null)}
        onTerima={(id) => updateStatus(id, "DITERIMA")}
        onRevisi={(s) => setRevisiTarget(s)}
        onSimpanNilai={simpanNilai}
      />

      <RevisiFormModal target={revisiTarget} onClose={() => setRevisiTarget(null)} onSend={kirimRevisi} />

      <TugasFormModal
        open={tugasFormOpen}
        tugas={editTarget}
        mapelOptions={mapelOptions}
        onClose={() => { setTugasFormOpen(false); setEditTarget(null); }}
        onSaved={() => loadAll()}
      />
    </div>
  );
}
