"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle, Code2, Download, ListChecks, PenLine, UserX, ChevronRight } from "lucide-react";
import type { TugasItem, TugasSubmisiItem } from "./types";
import { formatTgl, formatTglJam, statusInfo, tipeLabel } from "./types";
import { TugasPraktikViewerModal } from "./TugasPraktikViewerModal";
import { TugasJawabanViewerModal } from "./TugasJawabanViewerModal";
import { TugasFileViewerModal } from "./TugasFileViewerModal";
import { useToast } from "@/components/shared/ToastSystem";

type Kelas = { id: string; nama: string };
type BelumSiswa = { id: string; nama: string | null; kelas: Kelas | null; user: { id: string; nama: string } | null };
type SubmisiRow = TugasSubmisiItem & { siswa?: TugasSubmisiItem["siswa"] & { kelasId?: string | null; kelas?: Kelas | null } };

const SEMUA = "__semua__";

/**
 * Halaman Submisi Tugas (menu sendiri, bukan modal). Tiap kelas punya tab sendiri,
 * jadi satu tugas untuk beberapa kelas tidak tercampur: 1 kelas = 1 daftar submisi.
 */
export function TugasSubmisiPage({ tugasId, role }: { tugasId: string; role: "ADMIN" | "GURU" }) {
  const toast = useToast();
  const router = useRouter();
  const back = `/${role.toLowerCase()}/materi?tab=tugas`;
  const [tugas, setTugas] = useState<TugasItem | null>(null);
  const [rows, setRows] = useState<SubmisiRow[]>([]);
  const [belum, setBelum] = useState<BelumSiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelasAktif, setKelasAktif] = useState<string>("");
  const [tab, setTab] = useState<"sudah" | "belum">("sudah");
  const [codeT, setCodeT] = useState<SubmisiRow | null>(null);
  const [jawabanT, setJawabanT] = useState<SubmisiRow | null>(null);
  const [fileT, setFileT] = useState<SubmisiRow | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, s, b] = await Promise.all([
        fetch("/api/tugas").then((r) => r.json()),
        fetch("/api/tugas/submisi").then((r) => r.json()),
        fetch(`/api/tugas/${tugasId}/belum-mengumpulkan`).then((r) => r.json()),
      ]);
      const found = (Array.isArray(t) ? t : []).find((x: TugasItem) => x.id === tugasId) ?? null;
      setTugas(found);
      setRows((Array.isArray(s) ? s : []).filter((x: SubmisiRow) => x.tugasId === tugasId));
      setBelum(Array.isArray(b) ? b : []);
    } finally {
      setLoading(false);
    }
  }, [tugasId]);

  useEffect(() => { load(); }, [load]);

  // Daftar kelas: dari target tugas; kalau "semua kelas", dari siswa yang muncul di data.
  const kelasList: Kelas[] = useMemo(() => {
    if (tugas?.kelasList?.length) return tugas.kelasList;
    const map = new Map<string, Kelas>();
    rows.forEach((r) => { const k = r.siswa?.kelas; if (k) map.set(k.id, k); });
    belum.forEach((b) => { if (b.kelas) map.set(b.kelas.id, b.kelas); });
    return [...map.values()].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [tugas, rows, belum]);

  useEffect(() => {
    if (!kelasAktif && kelasList.length > 0) setKelasAktif(kelasList[0].id);
  }, [kelasList, kelasAktif]);

  const tabs = kelasList.length > 0 ? kelasList : [{ id: SEMUA, nama: "Semua" }];
  const aktif = kelasList.length > 0 ? kelasAktif : SEMUA;
  const inKelas = (kelasId?: string | null) => aktif === SEMUA || kelasId === aktif;
  const sudahK = rows.filter((r) => inKelas(r.siswa?.kelas?.id ?? r.siswa?.kelasId));
  const belumK = belum.filter((b) => inKelas(b.kelas?.id));

  const isPraktik = tugas?.tipe === "PRAKTIK";
  const isSoal = tugas?.tipe === "PILIHAN_GANDA" || tugas?.tipe === "ESSAY";

  async function simpanNilai(id: string, nilai: number) {
    const res = await fetch(`/api/tugas/submisi/${id}/nilai`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nilai }),
    });
    if (res.ok) { toast.success("Nilai disimpan!", `Nilai ${nilai} tersimpan, tugas otomatis ditandai selesai.`); load(); }
    else toast.error("Gagal menyimpan nilai");
  }

  const namaOf = (s: SubmisiRow) => s.siswa?.user?.nama || s.siswa?.nama || "Siswa";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push(back)} aria-label="Kembali"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3]">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-slate-900 dark:text-white">{tugas?.judul ?? "Submisi Tugas"}</p>
          {tugas && (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600 dark:text-slate-300">
              <span>{tugas.mapel}</span><span>· {tipeLabel(tugas.tipe)}</span>
              <span className="flex items-center gap-1"><CalendarClock size={11} /> {formatTgl(tugas.deadline)}</span>
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />)}</div>
      ) : !tugas ? (
        <p className="py-16 text-center text-sm font-semibold text-slate-600">Tugas tidak ditemukan</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((k) => {
              const total = rows.filter((r) => k.id === SEMUA || (r.siswa?.kelas?.id ?? r.siswa?.kelasId) === k.id).length;
              const sisa = belum.filter((b) => k.id === SEMUA || b.kelas?.id === k.id).length;
              const on = aktif === k.id;
              return (
                <button key={k.id} type="button" onClick={() => setKelasAktif(k.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${on ? "bg-[#3E03B3] text-white" : "bg-white text-[#3E03B3] dark:bg-slate-800"}`}>
                  {k.nama}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${on ? "bg-white text-[#3E03B3]" : "bg-[#F1EDFA] text-[#3E03B3]"}`}>{total}/{total + sisa}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Sudah mengumpulkan", v: sudahK.length, c: "#3E03B3", bg: "#F1EDFA" },
              { l: "Belum mengumpulkan", v: belumK.length, c: "#E8562B", bg: "#FFE9E2" },
            ].map((t) => (
              <div key={t.l} className="rounded-2xl px-3 py-3 text-center" style={{ background: t.bg }}>
                <p className="text-2xl font-extrabold leading-none" style={{ color: t.c }}>{t.v}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">{t.l}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {([["sudah", `Sudah mengumpulkan (${sudahK.length})`, CheckCircle], ["belum", `Belum (${belumK.length})`, UserX]] as const).map(([k, label, Icon]) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold ${tab === k ? "bg-[#3E03B3] text-white" : "bg-[#F1EDFA] text-[#3E03B3]"}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {tab === "belum" ? (
              belumK.length === 0 ? (
                <p className="py-12 text-center text-sm font-semibold text-slate-600">Semua siswa di kelas ini sudah mengumpulkan</p>
              ) : belumK.map((s) => {
                const nama = s.user?.nama || s.nama || "Siswa";
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[0_2px_10px_-3px_rgba(62,3,179,0.14)] dark:bg-slate-800">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE9E2] text-sm font-bold text-[#E8562B]">{nama[0]?.toUpperCase()}</span>
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">{nama}</p>
                    <span className="shrink-0 rounded-full bg-[#FFE9E2] px-2.5 py-1 text-[10px] font-bold text-[#E8562B]">Belum kumpul</span>
                  </div>
                );
              })
            ) : sudahK.length === 0 ? (
              <p className="py-12 text-center text-sm font-semibold text-slate-600">Belum ada siswa di kelas ini yang mengumpulkan</p>
            ) : sudahK.map((s) => {
              const sc = statusInfo(s.status);
              const nama = namaOf(s);
              const open = () => (isPraktik ? setCodeT(s) : isSoal ? setJawabanT(s) : setFileT(s));
              const Icon = isPraktik ? Code2 : isSoal ? (tugas.tipe === "PILIHAN_GANDA" ? ListChecks : PenLine) : Download;
              return (
                <button key={s.id} type="button" onClick={open}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-[0_2px_10px_-3px_rgba(62,3,179,0.14)] active:scale-[0.99] dark:bg-slate-800">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#3E03B3]"><Icon size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{nama}</span>
                    <span className="block truncate text-[11px] text-slate-600 dark:text-slate-300">{formatTglJam(s.submittedAt)}</span>
                  </span>
                  {isSoal && s.nilai !== null && <span className="shrink-0 rounded-full bg-[#3E03B3] px-2 py-0.5 text-[10px] font-bold text-white">{s.nilai}</span>}
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  <ChevronRight size={16} className="shrink-0 text-slate-300" />
                </button>
              );
            })}
          </div>
        </>
      )}

      <TugasPraktikViewerModal
        open={!!codeT} onClose={() => setCodeT(null)}
        title={codeT ? namaOf(codeT) : "Siswa"} subtitle={tugas?.judul}
        html={codeT?.submittedHtml ?? ""} css={codeT?.submittedCss ?? ""} js={codeT?.submittedJs ?? ""}
      />
      <TugasFileViewerModal
        open={!!fileT} onClose={() => setFileT(null)}
        title={fileT ? namaOf(fileT) : "Siswa"} subtitle={tugas?.judul}
        fileUrl={fileT?.fileUrl ?? null} fileName={fileT?.fileName ?? null} catatan={fileT?.catatan ?? null}
        submittedAt={fileT?.submittedAt}
      />
      <TugasJawabanViewerModal
        open={!!jawabanT} onClose={() => setJawabanT(null)}
        judul={jawabanT ? namaOf(jawabanT) : "Siswa"} tipe={tugas?.tipe ?? ""}
        jawaban={jawabanT?.jawaban ?? []} nilai={jawabanT?.nilai} canGrade
        onSaveNilai={async (nilai) => { if (!jawabanT) return; await simpanNilai(jawabanT.id, nilai); setJawabanT(null); }}
      />
    </div>
  );
}
