"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pin, AlertCircle, Megaphone, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { PengumumanFormModal } from "./PengumumanFormModal";
import { KomentarSection } from "./KomentarSection";
import type { PengumumanItem } from "./PengumumanFormModal";
import type { KomentarItem } from "./KomentarSection";
import { Avatar } from "@/components/shared/Avatar";

type PengumumanDetail = PengumumanItem & { komentar: KomentarItem[] };

function formatDate(iso: string) {
  return `${new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  })} WIB`;
}

/** Halaman detail pengumuman (menu baru, bukan modal): isi singkat + diskusi bergaya chat. */
export function PengumumanDetailPage({
  slug, role, currentUserId,
}: {
  slug: string;
  role: "ADMIN" | "GURU" | "SISWA";
  currentUserId: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const canManage = role === "ADMIN";
  const back = `/${role.toLowerCase()}/pengumuman`;
  const [p, setP] = useState<PengumumanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/pengumuman/${slug}`);
      if (!res.ok) { setNotFound(true); return; }
      setP(await res.json());
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function hapus() {
    if (!p || !await toast.confirm("Hapus pengumuman?", `"${p.judul}" akan dihapus permanen.`)) return;
    setDeleting(true);
    await fetch(`/api/pengumuman/${p.id}`, { method: "DELETE" });
    router.replace(back);
  }

  async function sematkan() {
    if (!p) return;
    setPinning(true);
    const res = await fetch(`/api/pengumuman/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !p.isPinned }),
    });
    if (res.ok) {
      const u = await res.json();
      setP((x) => (x ? { ...x, isPinned: u.isPinned } : x));
    }
    setPinning(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => router.push(back)} aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3]">
          <ArrowLeft size={18} />
        </button>
        <p className="flex-1 text-sm font-bold text-slate-900 dark:text-white">Pengumuman</p>
        {canManage && p && (
          <>
            <button onClick={() => setEditOpen(true)} aria-label="Edit" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3]"><Pencil size={16} /></button>
            <button onClick={sematkan} disabled={pinning} aria-label="Sematkan"
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EDFA] ${p.isPinned ? "text-[#F26A3D]" : "text-[#3E03B3]"}`}>
              {pinning ? <Loader2 size={16} className="animate-spin" /> : <Pin size={16} />}
            </button>
            <button onClick={hapus} disabled={deleting} aria-label="Hapus" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE9E2] text-[#F26A3D]">
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-7 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      )}

      {!loading && notFound && (
        <div className="flex flex-col items-center py-16 text-center">
          <Megaphone size={36} className="mb-3 text-slate-300" />
          <p className="font-bold text-slate-600 dark:text-slate-400">Pengumuman tidak ditemukan</p>
        </div>
      )}

      {!loading && p && (
        <>
          <article className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {p.isPinned && <span className="flex items-center gap-1 rounded-full bg-[#FFE9E2] px-2.5 py-0.5 text-[10px] font-bold text-[#F26A3D]"><Pin size={9} />Disematkan</span>}
              <span className="rounded-full bg-[#F1EDFA] px-2.5 py-0.5 text-[10px] font-bold text-[#3E03B3]">{p.kategori}</span>
              {(p.prioritas === "PENTING" || p.prioritas === "MENDESAK") && (
                <span className="flex items-center gap-1 rounded-full bg-[#F26A3D] px-2.5 py-0.5 text-[10px] font-bold text-white">
                  <AlertCircle size={9} />{p.prioritas === "MENDESAK" ? "Mendesak" : "Penting"}
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold leading-tight text-slate-900 dark:text-white">{p.judul}</h1>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Avatar src={p.author.fotoProfil} nama={p.author.nama} sizePx={22} fallbackBg="#3E03B3" textClassName="text-[9px] font-bold" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{p.author.nama}</span>
              <span>· {p.author.role === "ADMIN" ? "Admin" : "Guru"}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{p.konten}</p>
            <p className="mt-3 text-[10px] text-slate-400">{formatDate(p.createdAt)}</p>
          </article>

          <KomentarSection
            initialKomentar={p.komentar}
            pengumumanId={p.id}
            currentUserId={currentUserId}
            canManage={canManage}
          />
        </>
      )}

      <PengumumanFormModal
        open={editOpen}
        pengumuman={p}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => { setP((x) => (x ? { ...x, ...saved } : x)); setEditOpen(false); }}
      />
    </div>
  );
}
