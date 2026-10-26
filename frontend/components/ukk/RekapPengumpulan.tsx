"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, UserX } from "lucide-react";

type SubmisiRow = {
  id: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
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
        <div className="flex shrink-0 gap-2 overflow-x-auto px-6 pb-3 pt-4">
          {kelasList.map((k) => {
            const on = k.id === aktifId;
            const n = new Set(submisi.filter((s) => kelasOf(s) === k.id).map((s) => s.siswa?.id)).size;
            return (
              <button key={k.id} type="button" onClick={() => setKelasId(k.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${on ? "bg-[#3E03B3] text-white" : "bg-slate-100 text-[#3E03B3] dark:bg-slate-700"}`}>
                {k.nama}
                <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white text-[#3E03B3]" : "bg-white text-slate-600"}`}>{n}/{k.siswa.length}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pb-3">
        {tiles.map((t) => {
          const on = tab === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`rounded-2xl p-4 text-center transition-colors ${on ? "bg-slate-100 dark:bg-slate-700" : "bg-white dark:bg-slate-800"}`}
              style={on ? { boxShadow: `inset 0 0 0 2px ${t.color}` } : { boxShadow: "inset 0 0 0 1px #cbd5e1" }}>
              <p className="text-3xl font-extrabold" style={{ color: t.color }}>{t.val}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-600">{t.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {total === 0 ? (
          <div className="px-6 py-14 text-center">
            {tab === "sudah" ? <UserX size={32} className="mx-auto mb-2 text-slate-300" /> : <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-300" />}
            <p className="text-sm font-semibold text-slate-500">
              {tab === "sudah" ? "Belum ada siswa di kelas ini yang mengumpulkan" : "Semua siswa di kelas ini sudah mengumpulkan"}
            </p>
          </div>
        ) : tab === "sudah" ? (
          sudahRows.slice(from, to).map((s) => {
            const nama = s.siswa?.user?.nama || s.siswa?.nama || "Siswa";
            return (
              <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3E03B3] text-sm font-bold text-white">{nama[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{nama}</p>
                  <p className="truncate text-xs text-slate-500">Dikumpulkan {tgl(s.submittedAt)}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-[#3E03B3] dark:bg-slate-700">✓ Terkumpul</span>
                <a href={s.fileUrl.startsWith("http") ? s.fileUrl : `/api${s.fileUrl}`} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#3E03B3] dark:bg-slate-700">
                  {labelBerkas(s.fileUrl)}
                </a>
              </div>
            );
          })
        ) : (
          belumList.slice(from, to).map((s) => {
            const nama = s.user?.nama || s.nama || "Siswa";
            return (
              <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">{nama[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{nama}</p>
                  <p className="truncate text-xs text-slate-500">NIS {s.nis}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-[#E8562B] dark:bg-slate-700">Belum kumpul</span>
              </div>
            );
          })
        )}
      </div>

      {total > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-3">
          <span className="text-xs font-semibold text-slate-500">{from + 1}–{to} dari {total} siswa</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[#3E03B3] disabled:opacity-40 dark:bg-slate-700"><ChevronLeft size={16} /></button>
            <span className="text-xs font-bold text-slate-600">{page + 1}/{pageCount}</span>
            <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[#3E03B3] disabled:opacity-40 dark:bg-slate-700"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
}
