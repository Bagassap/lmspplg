"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCheck, Megaphone, ClipboardCheck, BookOpen, Briefcase, FileText, Info } from "lucide-react";
import { icon3dStyle, type Tone3D } from "@/components/shared/Icon3D";

type ApiNotifType = "PENGUMUMAN" | "ABSENSI" | "TUGAS" | "MAGANG" | "UKK" | "SISTEM";
type ApiNotification = {
  id: string; title: string; message: string; type: ApiNotifType; isRead: boolean; link: string | null; createdAt: string;
};

const META: Record<ApiNotifType, { icon: React.ElementType; tone: Tone3D }> = {
  PENGUMUMAN: { icon: Megaphone, tone: "violet" },
  ABSENSI: { icon: ClipboardCheck, tone: "emerald" },
  TUGAS: { icon: BookOpen, tone: "amber" },
  MAGANG: { icon: Briefcase, tone: "sky" },
  UKK: { icon: FileText, tone: "amber" },
  SISTEM: { icon: Info, tone: "sky" },
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

/** Halaman Notifikasi (menu sendiri, bukan dropdown): daftar kartu ringkas, yang belum dibaca ditandai titik oranye. */
export function AppNotifikasiPage() {
  const router = useRouter();
  const pathname = usePathname();
  const role = pathname.split("/").filter(Boolean)[0] ?? "siswa";
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=50", { cache: "no-store" });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (res.ok) setItems((await res.json()).items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = items.filter((n) => !n.isRead).length;

  async function markAll() {
    setItems((p) => p.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  function open(n: ApiNotification) {
    if (!n.isRead) {
      setItems((p) => p.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
    }
    if (n.link) router.push(`/${role}${n.link}`);
  }

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {loading ? "Memuat…" : unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
        </p>
        {unread > 0 && (
          <button type="button" onClick={markAll}
            className="flex items-center gap-1.5 rounded-full bg-[#F1EDFA] px-3.5 py-1.5 text-xs font-bold text-[#3E03B3]">
            <CheckCheck size={13} /> Tandai semua
          </button>
        )}
      </div>

      {loading ? (
        [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white dark:bg-[#1E293B]" />)
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#3E03B3]"><Bell size={24} /></span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Belum ada notifikasi</p>
        </div>
      ) : (
        items.map((n) => {
          const m = META[n.type] ?? META.SISTEM;
          const Icon = m.icon;
          return (
            <button key={n.id} type="button" onClick={() => open(n)}
              className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left shadow-[0_2px_10px_-3px_rgba(62,3,179,0.14)] ${n.isRead ? "bg-white dark:bg-[#1E293B]" : "bg-[#F1EDFA] dark:bg-[#1E293B]"}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(m.tone)}>
                <Icon size={18} color="#fff" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className={`flex-1 text-sm leading-snug ${n.isRead ? "font-semibold text-slate-700 dark:text-slate-300" : "font-extrabold text-slate-900 dark:text-white"}`}>{n.title}</p>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F26A3D]" />}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
