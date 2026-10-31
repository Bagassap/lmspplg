"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, Eye, FolderOpen, UserX } from "lucide-react";
import { ArsipViewer } from "@/components/ukk/ArsipViewer";
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

function urlZip(o: { tahapanId?: string; kelasId?: string }) {
  const qs = new URLSearchParams();
  if (o.tahapanId) qs.set("tahapanId", o.tahapanId);
  if (o.kelasId) qs.set("kelasId", o.kelasId);
  return `/api/ujian-ukk/submisi/unduh-semua?${qs.toString()}`;
}

function tgl(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}
function tglJam(s: string) {
  const d = new Date(s);
  const t = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  const j = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" }).replace(".", ":");
  return `${t}, ${j} WIB`;
}
const adalahArsip = (s: SubmisiRow) => s.fileUrl.startsWith("/uploads/") && /\.(zip|rar)$/i.test(s.fileName || s.fileUrl);
function labelBerkas(url: string) {
  if (url.startsWith("http")) return "GDrive";
  return /\.(pdf|png|jpe?g|webp|gif)$/i.test(url) ? "Buka" : "Unduh";
}

/**
 * Rekap pengumpulan satu task UKK per kelas XII: kartu "Sudah" dan "Belum mengumpulkan"
 * bisa diklik untuk melihat siswanya, ditampilkan 10 siswa per halaman.
 */
export function RekapPengumpulan({ submisi, tahapanId }: { submisi: SubmisiRow[]; tahapanId?: string }) {
  const toast = useToast();
  async function salin(teks: string, pesan: string) {
    try { await navigator.clipboard.writeText(teks); toast.success(pesan, ""); }
    catch { toast.error("Tidak bisa menyalin", teks); }
  }
  const [kelasList, setKelasList] = useState<KelasXII[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [tab, setTab] = useState<"sudah" | "belum">("sudah");
  const [page, setPage] = useState(0);
  const [arsip, setArsip] = useState<{ id: string; nama: string; siswa: string } | null>(null);

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
      <div className="flex shrink-0 flex-col gap-2 px-4 pb-3 sm:flex-row sm:items-center sm:gap-3 sm:px-8">
      {kelasList.length > 0 && (
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:flex-1 sm:pb-0">
          {kelasList.map((k) => {
            const on = k.id === aktifId;
            const n = new Set(submisi.filter((s) => kelasOf(s) === k.id).map((s) => s.siswa?.id)).size;
            return (
              <button key={k.id} type="button" onClick={() => setKelasId(k.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${on ? "bg-[#3E03B3] text-white" : "bg-slate-100 text-[#3E03B3] dark:bg-slate-700"}`}>
                {k.nama}
                <span className={`rounded-xl px-1.5 text-[10px] ${on ? "bg-white text-[#3E03B3]" : "bg-white text-slate-600"}`}>{n}/{k.siswa.length}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
        {tiles.map((t) => {
          const on = tab === t.key;
          const Icon = t.key === "sudah" ? CheckCircle2 : UserX;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors sm:gap-2 sm:px-4 sm:text-xs ${on ? "bg-[#F26A3D] text-white" : "bg-[#FFE9E2] text-[#E8562B] dark:bg-slate-700"}`}>
              <Icon size={14} className="shrink-0" /> <span className="truncate">{t.label} ({t.val})</span>
            </button>
          );
        })}
      </div>
      </div>

      {tab === "sudah" && folderKelas && (
        <div className="flex shrink-0 items-center gap-3 px-4 pb-3 sm:px-8">
          <button type="button" onClick={() => salin(folderKelas, `Link folder ${aktif?.nama ?? "kelas"} disalin`)}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-[#3E03B3] dark:bg-slate-700">
            <FolderOpen size={13} /> Salin link folder {aktif?.nama} (Google Drive)
          </button>
        </div>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-4 sm:px-8">
        {total === 0 ? (
          <p className="py-14 text-center text-xs font-semibold text-slate-500">
            {tab === "sudah" ? "Belum ada siswa di kelas ini yang mengumpulkan" : "Semua siswa di kelas ini sudah mengumpulkan"}
          </p>
        ) : tab === "sudah" ? (
          sudahRows.slice(from, to).map((s) => {
            const nama = s.siswa?.user?.nama || s.siswa?.nama || "Siswa";
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-slate-100 px-4 py-2.5 dark:bg-slate-700/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#3E03B3] text-xs font-bold text-white">{nama[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{nama}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Dikirim {tglJam(s.submittedAt)}</p>
                </div>
                <span className="shrink-0 rounded-xl bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#3E03B3] dark:bg-slate-800">Terkumpul</span>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {s.driveUrl && (
                    <button type="button" onClick={() => salin(s.driveUrl!, "Link Google Drive disalin")} title="Salin link Google Drive"
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#3E03B3] dark:bg-slate-800">
                      <Copy size={13} /> Salin link
                    </button>
                  )}
                  {adalahArsip(s) && (
                    <button type="button" onClick={() => setArsip({ id: s.id, nama: s.fileName, siswa: nama })}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F26A3D] px-3 py-1.5 text-[11px] font-bold text-white">
                      <Eye size={13} /> Lihat isi
                    </button>
                  )}
                  <a href={s.driveUrl ?? (s.fileUrl.startsWith("http") ? s.fileUrl : `/api${s.fileUrl}`)} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 rounded-xl bg-[#3E03B3] px-3 py-1.5 text-[11px] font-bold text-white">
                    {s.driveUrl ? "Drive" : labelBerkas(s.fileUrl)}
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          belumList.slice(from, to).map((s) => {
            const nama = s.user?.nama || s.nama || "Siswa";
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2.5 dark:bg-slate-700/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-300 text-xs font-bold text-slate-700">{nama[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{nama}</p>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-300">NIS {s.nis}</p>
                </div>
                <span className="shrink-0 rounded-xl bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#E8562B] dark:bg-slate-800">Belum kumpul</span>
              </div>
            );
          })
        )}
      </div>

      {(total > 0 || submisi.length > 0) && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pb-6 pt-1 sm:px-8 sm:pb-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {total > 0 && <span className="mr-1 text-xs font-semibold text-slate-600">{from + 1}–{to} dari {total} siswa</span>}
            {submisi.length > 0 && (
              <>
                <a href={urlZip({ tahapanId })} download
                  className="flex items-center gap-2 rounded-xl bg-[#3E03B3] px-3 py-1.5 text-[11px] font-bold text-white">
                  <Download size={13} /> Unduh semua (ZIP)
                </a>
                {aktif && (
                  <a href={urlZip({ tahapanId, kelasId: aktif.id })} download
                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-[#3E03B3] dark:bg-slate-700">
                    <Download size={13} /> Unduh {aktif.nama}
                  </a>
                )}
                <button type="button" onClick={() => salin(`${window.location.origin}${urlZip({ tahapanId, kelasId: aktif?.id })}`, "Alamat unduh disalin (harus login admin/guru)")}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-[#3E03B3] dark:bg-slate-700">
                  <Copy size={13} /> Salin alamat unduh
                </button>
              </>
            )}
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#3E03B3] disabled:opacity-40 dark:bg-slate-700"><ChevronLeft size={16} /></button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{page + 1}/{pageCount}</span>
              <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#3E03B3] disabled:opacity-40 dark:bg-slate-700"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      )}
      {arsip && <ArsipViewer submisiId={arsip.id} nama={arsip.nama} siswa={arsip.siswa} onClose={() => setArsip(null)} />}
    </>
  );
}
