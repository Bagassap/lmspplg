"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, FolderOpen, UserX } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

type SubmisiRow = {
  id: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  driveUrl?: string | null;
  driveFolderUrl?: string | null;
  siswa?: { id: string; nama?: string | null; kelasId?: string | null; kelas?: { id: string; nama: string } | null; user?: { nama?: string } | null } | null;
};
type KelasXII = { id: string; nama: string; siswa: { id: string; nama: string | null; nis: string; user?: { nama: string } | null }[] };

const PER_PAGE = 10;

function tgl(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}
function labelBerkas(url: string) {
  if (url.startsWith("http")) return "GDrive";
  return /\.(pdf|png|jpe?g|webp|gif)$/i.test(url) ? "Buka" : "Unduh";
}

/**
 * Rekap pengumpulan satu task UKK per kelas XII: kartu "Sudah" dan "Belum mengumpulkan"
 * bisa diklik untuk melihat siswanya, ditampilkan 10 siswa per halaman.
 */
export function RekapPengumpulan({ submisi }: { submisi: SubmisiRow[] }) {
  const toast = useToast();
  async function salin(teks: string, pesan: string) {
    try { await navigator.clipboard.writeText(teks); toast.success(pesan, ""); }
    catch { toast.error("Tidak bisa menyalin", teks); }
  }
  const [kelasList, setKelasList] = useState<KelasXII[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [tab, setTab] = useState<"sudah" | "belum">("sudah");
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch("/api/ujian-ukk/peserta-xii", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setKelasList(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const kelasOf = (s: SubmisiRow) => s.siswa?.kelas?.id ?? s.siswa?.kelasId ?? "";
  const aktifId = kelasList.some((k) => k.id === kelasId)
    ? kelasId
    : (kelasList.find((k) => submisi.some((s) => kelasOf(s) === k.id)) ?? kelasList[0])?.id ?? "";
  const aktif = kelasList.find((k) => k.id === aktifId);

  const sudahRows = useMemo(
    () => submisi.filter((s) => kelasOf(s) === aktifId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submisi, aktifId],
  );
  const sudahIds = useMemo(() => new Set(sudahRows.map((s) => s.siswa?.id)), [sudahRows]);
  const folderKelas = sudahRows.find((s) => s.driveFolderUrl)?.driveFolderUrl ?? null;
  const belumList = useMemo(() => (aktif?.siswa ?? []).filter((s) => !sudahIds.has(s.id)), [aktif, sudahIds]);

  useEffect(() => { setPage(0); }, [aktifId, tab]);

  const total = tab === "sudah" ? sudahRows.length : belumList.length;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = page * PER_PAGE;
  const to = Math.min(from + PER_PAGE, total);

  const tiles = [
    { key: "sudah" as const, label: "Sudah mengumpulkan", val: sudahRows.length, color: "#3E03B3" },
    { key: "belum" as const, label: "Belum mengumpulkan", val: belumList.length, color: "#E8562B" },
  ];

  return (
    <>
      {kelasList.length > 0 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-6 pb-3 sm:px-8">
          {kelasList.map((k) => {
            const on = k.id === aktifId;
            const n = new Set(submisi.filter((s) => kelasOf(s) === k.id).map((s) => s.siswa?.id)).size;
            return (
              <button key={k.id} type="button" onClick={() => setKelasId(k.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold ${on ? "bg-[#3E03B3] text-white" : "bg-slate-100 text-[#3E03B3] dark:bg-slate-700"}`}>
                {k.nama}
                <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white text-[#3E03B3]" : "bg-white text-slate-600"}`}>{n}/{k.siswa.length}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pb-4 sm:px-8">
        {tiles.map((t) => {
          const on = tab === t.key;
          const Icon = t.key === "sudah" ? CheckCircle2 : UserX;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition-colors ${on ? "bg-[#3E03B3] text-white" : "bg-slate-100 text-[#3E03B3] dark:bg-slate-700"}`}>
              <Icon size={16} /> {t.label} ({t.val})
            </button>
          );
        })}
      </div>

      {tab === "sudah" && folderKelas && (
        <div className="flex shrink-0 items-center gap-3 px-6 pb-3 sm:px-8">
          <button type="button" onClick={() => salin(folderKelas, `Link folder ${aktif?.nama ?? "kelas"} disalin`)}
            className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-[#3E03B3] dark:bg-slate-700">
            <FolderOpen size={14} /> Salin link folder {aktif?.nama} (Google Drive)
          </button>
        </div>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto px-6 pb-4 sm:px-8">
        {total === 0 ? (
          <p className="py-14 text-center text-sm font-semibold text-slate-500">
            {tab === "sudah" ? "Belum ada siswa di kelas ini yang mengumpulkan" : "Semua siswa di kelas ini sudah mengumpulkan"}
          </p>
        ) : tab === "sudah" ? (
          sudahRows.slice(from, to).map((s) => {
            const nama = s.siswa?.user?.nama || s.siswa?.nama || "Siswa";
            return (
              <div key={s.id} className="flex items-center gap-4 rounded-2xl bg-slate-100 px-5 py-4 dark:bg-slate-700/60">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3E03B3] text-sm font-bold text-white">{nama[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-slate-900 dark:text-white">{nama}</p>
                  <p className="truncate text-sm text-slate-600 dark:text-slate-300">{tgl(s.submittedAt)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#3E03B3] dark:bg-slate-800">Terkumpul</span>
                {s.driveUrl && (
                  <button type="button" onClick={() => salin(s.driveUrl!, "Link Google Drive disalin")} title="Salin link Google Drive"
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#3E03B3] dark:bg-slate-800">
                    <Copy size={13} /> Salin link
                  </button>
                )}
                <a href={s.driveUrl ?? (s.fileUrl.startsWith("http") ? s.fileUrl : `/api${s.fileUrl}`)} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-[#3E03B3] px-4 py-2 text-xs font-bold text-white">
                  {s.driveUrl ? "Drive" : labelBerkas(s.fileUrl)}
                </a>
              </div>
            );
          })
        ) : (
          belumList.slice(from, to).map((s) => {
            const nama = s.user?.nama || s.nama || "Siswa";
            return (
              <div key={s.id} className="flex items-center gap-4 rounded-2xl bg-slate-100 px-5 py-4 dark:bg-slate-700/60">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700">{nama[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-slate-900 dark:text-white">{nama}</p>
                  <p className="truncate text-sm text-slate-600 dark:text-slate-300">NIS {s.nis}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#E8562B] dark:bg-slate-800">Belum kumpul</span>
              </div>
            );
          })
        )}
      </div>

      {total > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 pb-6 pt-1 sm:px-8 sm:pb-8">
          <span className="text-sm font-semibold text-slate-600">{from + 1}–{to} dari {total} siswa</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#3E03B3] disabled:opacity-40 dark:bg-slate-700"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{page + 1}/{pageCount}</span>
            <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#3E03B3] disabled:opacity-40 dark:bg-slate-700"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </>
  );
}
