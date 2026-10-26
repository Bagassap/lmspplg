"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CornerUpLeft, Send, Loader2, X, MessageCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { Avatar } from "@/components/shared/Avatar";

export type KomentarItem = {
  id: string;
  konten: string;
  authorId: string;
  author: { id: string; nama: string; role: string; fotoProfil?: string | null };
  parentId: string | null;
  replies?: KomentarItem[];
  createdAt: string;
};

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", GURU: "Guru", SISWA: "Siswa" };
const ROLE_COLOR: Record<string, string> = { ADMIN: "#3E03B3", GURU: "#F26A3D", SISWA: "#059669" };

function jam(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hourCycle: "h23", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");
}
function hari(iso: string): string {
  const d = new Date(iso);
  const key = (x: Date) => x.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
  const now = new Date();
  const kemarin = new Date(now.getTime() - 86400000);
  if (key(d) === key(now)) return "Hari ini";
  if (key(d) === key(kemarin)) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

/** Komentar pengumuman bergaya chat (ala BBM/WhatsApp): gelembung kiri/kanan, kutipan balasan, kolom ketik di bawah. */
export function KomentarSection({
  initialKomentar, pengumumanId, currentUserId, canManage,
}: {
  initialKomentar: KomentarItem[];
  pengumumanId: string;
  currentUserId: string;
  canManage: boolean;
}) {
  const toast = useToast();
  const [flat, setFlat] = useState<KomentarItem[]>(() =>
    initialKomentar
      .flatMap((k) => [k, ...(k.replies ?? []).map((r) => ({ ...r, parentId: r.parentId ?? k.id }))])
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
  );
  const [teks, setTeks] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<KomentarItem | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const byId = useMemo(() => new Map(flat.map((k) => [k.id, k])), [flat]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [flat.length]);

  async function kirim() {
    const konten = teks.trim();
    if (!konten || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/pengumuman/${pengumumanId}/komentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ konten, ...(replyTo ? { parentId: replyTo.parentId ?? replyTo.id } : {}) }),
      });
      if (res.ok) {
        const baru: KomentarItem = await res.json();
        setFlat((p) => [...p, { ...baru, parentId: baru.parentId ?? replyTo?.id ?? null }]);
        setTeks("");
        setReplyTo(null);
      } else {
        toast.error("Gagal mengirim pesan", "Coba lagi beberapa saat.");
      }
    } catch {
      toast.error("Koneksi bermasalah", "Periksa koneksi internet kamu.");
    } finally {
      setSending(false);
    }
  }

  async function hapus(id: string) {
    if (!await toast.confirm("Hapus pesan ini?")) return;
    const res = await fetch(`/api/pengumuman/komentar/${id}`, { method: "DELETE" });
    if (res.ok) setFlat((p) => p.filter((k) => k.id !== id && k.parentId !== id));
    else toast.error("Gagal menghapus pesan");
  }

  let lastDay = "";

  return (
    <div className="flex flex-col">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <MessageCircle size={13} /> Diskusi ({flat.length})
      </p>

      <div className="space-y-1.5 rounded-2xl bg-[#F1EDFA] p-3 dark:bg-slate-800">
        {flat.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">Belum ada pesan. Mulai diskusi di bawah.</p>
        )}
        {flat.map((k) => {
          const mine = k.authorId === currentUserId;
          const quote = k.parentId ? byId.get(k.parentId) : null;
          const day = hari(k.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          const color = ROLE_COLOR[k.author.role] ?? "#3E03B3";
          return (
            <div key={k.id}>
              {showDay && (
                <div className="my-2 flex justify-center">
                  <span className="rounded-xl bg-white px-3 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{day}</span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <Avatar src={k.author.fotoProfil} nama={k.author.nama} sizePx={28} fallbackBg={color} textClassName="text-[10px] font-bold" />}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "rounded-br-sm bg-[#3E03B3] text-white" : "rounded-bl-sm bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-100"}`}>
                  {!mine && (
                    <p className="text-[11px] font-bold" style={{ color }}>
                      {k.author.nama} <span className="font-semibold">· {ROLE_LABEL[k.author.role] ?? "Siswa"}</span>
                    </p>
                  )}
                  {quote && (
                    <div className={`mb-1 mt-0.5 rounded-lg border-l-[3px] border-[#F26A3D] px-2 py-1 text-[11px] ${mine ? "bg-[#2D0281]" : "bg-[#F1EDFA] dark:bg-slate-600"}`}>
                      <p className="font-bold" style={{ color: mine ? "#FFD2C2" : "#F26A3D" }}>{quote.author.nama}</p>
                      <p className="line-clamp-2">{quote.konten}</p>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-snug">{k.konten}</p>
                  <div className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${mine ? "text-white" : "text-slate-500"}`}>
                    <button type="button" onClick={() => setReplyTo(k)} className="flex items-center gap-0.5 font-semibold hover:underline">
                      <CornerUpLeft size={10} /> Balas
                    </button>
                    {(canManage || mine) && (
                      <button type="button" onClick={() => hapus(k.id)} className="font-semibold hover:underline">Hapus</button>
                    )}
                    <span>{jam(k.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[6rem] z-10 mt-3 rounded-3xl border border-slate-100 bg-white p-2 shadow-[0_8px_24px_-8px_rgba(62,3,179,0.3)] dark:border-slate-700 dark:bg-slate-900 lg:bottom-3">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border-l-[3px] border-[#F26A3D] bg-[#F1EDFA] px-3 py-1.5 text-[11px] dark:bg-slate-800">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#F26A3D]">Membalas {replyTo.author.nama}</p>
              <p className="truncate text-slate-500 dark:text-slate-400">{replyTo.konten}</p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} className="text-slate-400" aria-label="Batal balas"><X size={14} /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            placeholder="Ketik pesan…"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-3xl bg-[#F1EDFA] px-4 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/30 dark:bg-slate-800 dark:text-slate-100"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 1024px)").matches) { e.preventDefault(); kirim(); }
            }}
          />
          <button
            type="button"
            onClick={kirim}
            disabled={sending || !teks.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3E03B3] text-white shadow-md transition-opacity disabled:opacity-40"
            aria-label="Kirim"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
