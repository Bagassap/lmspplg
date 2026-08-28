"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2, Lock, ShieldAlert, Timer, Send, Code2, ListChecks, PenLine,
  CheckCircle2, ChevronLeft, ChevronRight, ListOrdered,
} from "lucide-react";
import { CodePracticeCanvas } from "@/components/materi/CodePracticeCanvas";
import { useToast } from "@/components/shared/ToastSystem";
import { LOCKDOWN_TIPE, MAKSIMAL_PERCOBAAN, maksimalPercobaanEfektif } from "@/components/tugas/types";
import type { TugasItem, TugasSoalItem } from "@/components/tugas/types";

type Phase = "loading" | "error" | "intro" | "locked" | "diterima" | "active";

type JawabanState = Record<string, string>;

function formatSisaWaktu(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function KerjakanTugasPage() {
  const params = useParams<{ tugasId: string }>();
  const tugasId = params.tugasId;
  const router = useRouter();
  const toast = useToast();

  const [phase, setPhase] = useState<Phase>("loading");
  const [tugas, setTugas] = useState<TugasItem | null>(null);
  const [percobaanKe, setPercobaanKe] = useState(0);
  // Batas percobaan efektif (MAKSIMAL_PERCOBAAN + bonus dari guru/admin, lihat
  // maksimalPercobaanEfektif()) — tidak selalu sama dengan MAKSIMAL_PERCOBAAN
  // begitu siswa pernah diberi tambahan percobaan.
  const [maksPercobaan, setMaksPercobaan] = useState(MAKSIMAL_PERCOBAAN);
  const [errorMsg, setErrorMsg] = useState("");
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSelesai, setShowConfirmSelesai] = useState(false);
  const [deadlineTs, setDeadlineTs] = useState<number | null>(null);
  const [sisaMs, setSisaMs] = useState<number | null>(null);

  const [code, setCode] = useState({ html: "", css: "", js: "" });
  const [jawaban, setJawaban] = useState<JawabanState>({});
  const [catatan, setCatatan] = useState("");
  const [currentSoalIdx, setCurrentSoalIdx] = useState(0);

  const codeRef = useRef(code);
  const jawabanRef = useRef(jawaban);
  const catatanRef = useRef(catatan);
  const phaseRef = useRef<Phase>("loading");
  const firedRef = useRef(false);
  const tugasIdRef = useRef(tugasId);
  const percobaanKeRef = useRef(percobaanKe);
  const maksPercobaanRef = useRef(maksPercobaan);
  const tugasJudulRef = useRef("");

  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { jawabanRef.current = jawaban; }, [jawaban]);
  useEffect(() => { catatanRef.current = catatan; }, [catatan]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { percobaanKeRef.current = percobaanKe; }, [percobaanKe]);
  useEffect(() => { maksPercobaanRef.current = maksPercobaan; }, [maksPercobaan]);
  useEffect(() => { tugasJudulRef.current = tugas?.judul ?? "Tugas"; }, [tugas]);

  const loadTugas = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch(`/api/tugas/${tugasId}`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrorMsg(d.message ?? "Tugas tidak ditemukan");
        setPhase("error");
        return;
      }
      const t: TugasItem = await res.json();
      if (!LOCKDOWN_TIPE.has(t.tipe)) {
        router.replace("/siswa/materi?tab=tugas");
        return;
      }
      setTugas(t);
      const mySubmisi = t.submisi?.[0];
      setMaksPercobaan(maksimalPercobaanEfektif(mySubmisi));

      if (mySubmisi?.status === "DITERIMA") {
        setPhase("diterima");
        return;
      }
      if (mySubmisi?.waktuMulai) {
        // Percobaan sedang berjalan (misal halaman ter-refresh) — lanjutkan
        // memakai deadline yang sudah tersimpan di server, jangan konsumsi
        // percobaan baru.
        setPercobaanKe(mySubmisi.jumlahPercobaan ?? 1);
        setCode({ html: t.starterHtml ?? "", css: t.starterCss ?? "", js: t.starterJs ?? "" });
        setJawaban({});
        setCurrentSoalIdx(0);
        setDeadlineTs(mySubmisi.deadlineWaktu ? new Date(mySubmisi.deadlineWaktu).getTime() : null);
        setPhase("active");
        return;
      }
      if (mySubmisi?.terkunci) {
        setPhase("locked");
        return;
      }
      setPercobaanKe((mySubmisi?.jumlahPercobaan ?? 0) + 1);
      setPhase("intro");
    } catch {
      setErrorMsg("Server tidak dapat dijangkau");
      setPhase("error");
    }
  }, [tugasId, router]);

  useEffect(() => { loadTugas(); }, [loadTugas]);

  // Timer countdown — dihitung dari deadline yang dikirim server, bukan durasi
  // lokal, supaya tidak bisa dimanipulasi lewat jam/JS di sisi klien.
  useEffect(() => {
    if (phase !== "active" || deadlineTs == null) return;
    const tick = () => setSisaMs(deadlineTs - Date.now());
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [phase, deadlineTs]);

  const buildPayload = useCallback((dipaksa: boolean) => {
    const t = tugas;
    const isPraktik = t?.tipe === "PRAKTIK";
    const isSoalBased = t?.tipe === "PILIHAN_GANDA" || t?.tipe === "ESSAY";
    const isPg = t?.tipe === "PILIHAN_GANDA";
    const payload: Record<string, unknown> = { dipaksa, catatan: catatanRef.current || undefined };
    if (isPraktik) {
      payload.submittedHtml = codeRef.current.html;
      payload.submittedCss = codeRef.current.css;
      payload.submittedJs = codeRef.current.js;
    }
    if (isSoalBased) {
      const soalList = t?.soal ?? [];
      const arr = soalList.map((s) => ({
        soalId: s.id,
        ...(isPg ? { jawabanPilihan: jawabanRef.current[s.id] ?? "" } : { jawabanEssay: jawabanRef.current[s.id] ?? "" }),
      }));
      payload.jawaban = JSON.stringify(arr);
    }
    return payload;
  }, [tugas]);

  // Kirim jawaban paksa (beacon, tetap terkirim walau halaman langsung
  // ditutup) — siswa TETAP login, tidak di-logout. Kalau tampilkeNotifikasi
  // true, tunjukkan toast LMS (bukan dialog bawaan Chrome) lalu kembalikan ke
  // menu Materi & Tugas lewat navigasi SPA (bukan window.location, supaya
  // sesi login tidak terganggu). false dipakai di beforeunload karena
  // memaksa navigasi saat halaman sedang unload itu sia-sia/berisiko.
  const fireForcedKeluar = useCallback((tampilkanNotifikasi: boolean) => {
    if (firedRef.current || phaseRef.current !== "active") return;
    firedRef.current = true;
    const payload = JSON.stringify(buildPayload(true));
    const url = `/api/tugas/${tugasIdRef.current}/paksa-keluar`;
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      } else {
        fetch(url, { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch {
      // sendBeacon jarang melempar error, tapi jaga-jaga agar tidak crash halaman.
    }
    if (tampilkanNotifikasi) {
      const sisa = Math.max(0, maksPercobaanRef.current - percobaanKeRef.current);
      toast.error(
        `Kamu keluar dari "${tugasJudulRef.current}"`,
        sisa > 0
          ? `Jawabanmu otomatis dikumpulkan. Kamu masih punya ${sisa} kesempatan lagi untuk mengerjakan ulang.`
          : "Jawabanmu otomatis dikumpulkan. Kesempatan mengerjakan tugas ini sudah habis.",
      );
      router.replace("/siswa/materi?tab=tugas");
    }
  }, [buildPayload, toast, router]);

  // Deteksi keluar halaman: visibilitychange (ganti tab/minimize/tutup) adalah
  // sinyal paling andal; beforeunload untuk penutupan tab langsung — tidak
  // memakai dialog konfirmasi bawaan browser, cukup kirim beacon diam-diam;
  // cleanup saat unmount untuk navigasi SPA internal (tombol back, dsb).
  useEffect(() => {
    if (phase !== "active") return;
    function onVisibility() {
      if (document.hidden) fireForcedKeluar(true);
    }
    function onBeforeUnload() {
      fireForcedKeluar(false);
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      fireForcedKeluar(true);
    };
  }, [phase, fireForcedKeluar]);

  // Anti salin-tempel di seluruh halaman selama mengerjakan.
  useEffect(() => {
    if (phase !== "active") return;
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [phase]);

  async function handleMulai() {
    setStarting(true);
    try {
      const res = await fetch(`/api/tugas/${tugasId}/mulai-percobaan`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Tidak bisa memulai", d.message ?? "Coba lagi");
        loadTugas();
        return;
      }
      firedRef.current = false;
      setPercobaanKe(d.percobaanKe);
      setMaksPercobaan(d.maksimalPercobaan ?? MAKSIMAL_PERCOBAAN);
      setDeadlineTs(d.deadlineWaktu ? new Date(d.deadlineWaktu).getTime() : null);
      setCode({ html: d.tugas.starterHtml ?? "", css: d.tugas.starterCss ?? "", js: d.tugas.starterJs ?? "" });
      setJawaban({});
      setCatatan("");
      setCurrentSoalIdx(0);
      setTugas((prev) => (prev ? { ...prev, soal: d.tugas.soal ?? prev.soal } : prev));
      setPhase("active");
    } catch {
      toast.error("Server tidak dapat dijangkau");
    } finally {
      setStarting(false);
    }
  }

  const doSubmit = useCallback(async (dipaksa: boolean) => {
    firedRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tugas/${tugasId}/submit-percobaan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(dipaksa)),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error("Gagal mengumpulkan", d.message ?? "Coba lagi");
        firedRef.current = false;
        return;
      }
      toast.success("Jawaban berhasil dikumpulkan!", "Guru/Admin akan mereview tugasmu.");
      router.replace("/siswa/materi?tab=tugas");
    } catch {
      toast.error("Server tidak dapat dijangkau");
      firedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [tugasId, buildPayload, toast, router]);

  useEffect(() => {
    if (phase === "active" && sisaMs != null && sisaMs <= 0 && !submitting) {
      doSubmit(false);
    }
  }, [phase, sisaMs, submitting, doSubmit]);

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-slate-900">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-slate-900">
        <ShieldAlert size={40} className="text-red-400" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{errorMsg}</p>
        <button onClick={() => router.replace("/siswa/materi?tab=tugas")}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: "#0033FF" }}>
          Kembali ke Materi
        </button>
      </div>
    );
  }

  if (phase === "diterima") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-slate-900">
        <CheckCircle2 size={40} className="text-[#00D67F]" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tugas ini sudah diterima, tidak perlu dikerjakan lagi.</p>
        <button onClick={() => router.replace("/siswa/materi?tab=tugas")}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: "#0033FF" }}>
          Kembali ke Materi
        </button>
      </div>
    );
  }

  if (phase === "locked") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-slate-900">
        <Lock size={40} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Percobaan kamu untuk tugas ini sudah habis (maksimal {maksPercobaan}x).
        </p>
        <p className="text-xs text-slate-400">Hubungi guru mapel jika butuh kesempatan ulang.</p>
        <button onClick={() => router.replace("/siswa/materi?tab=tugas")}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: "#0033FF" }}>
          Kembali ke Materi
        </button>
      </div>
    );
  }

  if (!tugas) return null;

  const isPraktik = tugas.tipe === "PRAKTIK";
  const isPg = tugas.tipe === "PILIHAN_GANDA";
  const isSoalBased = isPg || tugas.tipe === "ESSAY";
  const soalList = tugas.soal ?? [];
  // Satu warna biru brand untuk semua tipe lembar pengerjaan (praktik/essay/
  // pilihan ganda) — dulu tiap tipe punya warna beda (hijau/lime/biru).
  const warna = "#0033FF";
  const textOnWarna = "#FFFFFF";
  const Icon = isPraktik ? Code2 : isPg ? ListChecks : PenLine;
  const dijawabCount = isSoalBased ? soalList.filter((s) => (jawaban[s.id] ?? "").trim().length > 0).length : 0;
  const progresPct = isSoalBased && soalList.length > 0 ? Math.round((dijawabCount / soalList.length) * 100) : 0;

  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 overflow-y-auto bg-[#F1F5F8] p-6 text-center dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl bg-white p-8 shadow-xl shadow-blue-950/5 dark:bg-slate-800"
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: warna, color: textOnWarna }}>
            <div className="absolute inset-0 -z-10 scale-125 rounded-2xl opacity-15 blur-xl" style={{ background: warna }} />
            <Icon size={30} />
          </div>
          <div>
            <p className="text-lg font-black text-slate-800 dark:text-white">{tugas.judul}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide" style={{ color: warna }}>{tugas.mapel}</p>
          </div>
          {tugas.deskripsi && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
              {tugas.deskripsi}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-lg px-3 py-1.5 text-[11px] font-bold" style={{ background: "#EEF1FF", color: warna }}>
              Percobaan ke-{percobaanKe} dari {maksPercobaan}
            </span>
            {tugas.durasiMenit ? (
              <span className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold" style={{ background: "#EEF1FF", color: warna }}>
                <Timer size={11} /> {tugas.durasiMenit} menit
              </span>
            ) : null}
          </div>
          <div className="w-full rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-left text-[11px] leading-relaxed text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400">
            Lembar pengerjaan ini <strong>terkunci</strong>: tidak bisa salin-tempel, dan jika kamu meninggalkan halaman ini
            (pindah tab, menutup jendela, atau menekan tombol kembali) kamu akan <strong>otomatis logout</strong> dan jawaban
            yang sudah terisi <strong>langsung tersimpan</strong> sebagai jawaban akhir. Kesempatan mengerjakan hanya {maksPercobaan}x.
          </div>
          <div className="flex w-full gap-3">
            <button onClick={() => router.replace("/siswa/materi?tab=tugas")}
              className="flex-1 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Batal
            </button>
            <button onClick={handleMulai} disabled={starting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-sm shadow-blue-900/20 transition-transform active:scale-[0.98] disabled:opacity-60"
              style={{ background: warna, color: textOnWarna }}>
              {starting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Mulai Mengerjakan
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // phase === "active"
  const habisSebentarLagi = sisaMs != null && sisaMs <= 60_000;
  const soalIdx = Math.min(currentSoalIdx, Math.max(0, soalList.length - 1));
  const soalAktif: TugasSoalItem | undefined = soalList[soalIdx];
  const jamColor = habisSebentarLagi ? "#EF4444" : warna;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#F1F5F8] dark:bg-slate-900" style={{ userSelect: "none" }}>
      <div className="relative flex shrink-0 items-center gap-3.5 overflow-hidden px-5 py-4 shadow-lg" style={{ background: warna, color: textOnWarna }}>
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-24 -bottom-16 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-6 -bottom-10 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "#FFFFFF26" }}>
          <div className="absolute inset-0 -z-10 scale-125 rounded-2xl bg-white/10 blur-md" />
          <Icon size={19} />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className="truncate text-base font-black leading-tight">{tugas.judul}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold" style={{ opacity: 0.7 }}>{tugas.mapel}</p>
        </div>
        <div className="relative hidden shrink-0 items-center gap-1.5 sm:flex">
          <span className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={{ backgroundColor: "#FFFFFF26" }}>
            <Lock size={10} /> Terkunci
          </span>
          <span className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={{ backgroundColor: "#FFFFFF26" }}>
            Percobaan {percobaanKe}/{maksPercobaan}
          </span>
          {isSoalBased && soalList.length > 0 && (
            <span className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={{ backgroundColor: "#FFFFFF26" }}>
              {dijawabCount}/{soalList.length} Dijawab
            </span>
          )}
        </div>
      </div>

      {isSoalBased && soalList.length > 0 && (
        <div className="h-1 w-full shrink-0 bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-r-full transition-all duration-300" style={{ width: `${progresPct}%`, background: warna }} />
        </div>
      )}

      {/* Timer besar, sengaja ditaruh di bawah topbar (bukan di dalamnya) supaya
          jelas terbaca — dulu cuma badge kecil di pojok topbar. */}
      {sisaMs != null && (
        <div className={`flex shrink-0 items-center justify-center gap-3 py-2.5 transition-colors ${habisSebentarLagi ? "animate-pulse" : ""}`}
          style={{ background: habisSebentarLagi ? "#FEE9EA" : "#EEF1FF" }}>
          <Timer size={20} style={{ color: jamColor }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: jamColor }}>Sisa Waktu</span>
          <span className="text-2xl font-black tabular-nums sm:text-3xl" style={{ color: jamColor }}>{formatSisaWaktu(sisaMs)}</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tugas.deskripsi && (
          <p className="mx-auto mb-4 max-w-5xl rounded-xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
            {tugas.deskripsi}
          </p>
        )}

        {isPraktik && (
          <>
            <CodePracticeCanvas
              key={tugas.id}
              initialHtml={code.html}
              initialCss={code.css}
              initialJs={code.js}
              onChange={setCode}
              minHeight={520}
              restrictPaste
            />
            <div className="mx-auto mt-4 flex max-w-5xl justify-end">
              <button type="button" onClick={() => setShowConfirmSelesai(true)} disabled={submitting}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-900/20 transition-transform active:scale-[0.98] disabled:opacity-60"
                style={{ background: warna }}>
                <Send size={14} /> Selesai Mengerjakan
              </button>
            </div>
          </>
        )}

        {isSoalBased && (
          soalList.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Belum ada soal pada tugas ini.</p>
          ) : (
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-4 lg:grid-cols-[0.85fr_2fr]">
              {/* Kartu kiri, sengaja lebih kecil dari kartu soal — cuma ringkasan
                  jumlah & navigasi cepat, bukan tempat mengerjakan. */}
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 lg:sticky lg:top-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "#EEF1FF", color: warna }}>
                    <ListOrdered size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white">{soalList.length} Soal</p>
                    <p className="text-[11px] font-semibold text-slate-400">{dijawabCount} sudah dijawab</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
                  {soalList.map((s, idx) => {
                    const terjawab = (jawaban[s.id] ?? "").trim().length > 0;
                    const aktif = idx === soalIdx;
                    return (
                      <button key={s.id} type="button" onClick={() => setCurrentSoalIdx(idx)}
                        className="flex h-8 items-center justify-center rounded-lg text-xs font-bold transition-all"
                        style={
                          aktif
                            ? { background: warna, color: "#FFFFFF" }
                            : terjawab
                            ? { background: "#C3F84A", color: "#1C2B33" }
                            : { background: "#F1F5F8", color: "#94a3b8" }
                        }>
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-400 dark:border-slate-700">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded" style={{ background: warna }} /> Soal ini</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded" style={{ background: "#C3F84A" }} /> Sudah dijawab</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#F1F5F8]" /> Belum dijawab</span>
                </div>
              </div>

              {/* Kartu kanan — 1 soal per tampilan, ganti soal lewat navigasi. */}
              {soalAktif && (
                <motion.div key={soalAktif.id}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                  className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-lg px-2.5 py-1 text-[11px] font-bold" style={{ background: "#EEF1FF", color: warna }}>
                      Soal {soalIdx + 1} dari {soalList.length}
                    </span>
                    {(jawaban[soalAktif.id] ?? "").trim().length > 0 && (
                      <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold" style={{ background: "#C3F84A", color: "#1C2B33" }}>
                        <CheckCircle2 size={13} /> Terjawab
                      </span>
                    )}
                  </div>
                  <p className="mb-5 text-base font-bold leading-relaxed text-slate-800 dark:text-white sm:text-lg">
                    {soalAktif.pertanyaan}
                  </p>

                  {isPg ? (
                    <div className="space-y-2">
                      {(["A", "B", "C", "D"] as const).map((huruf) => {
                        const teks = soalAktif[`pilihan${huruf}` as "pilihanA" | "pilihanB" | "pilihanC" | "pilihanD"];
                        if (!teks) return null;
                        const active = jawaban[soalAktif.id] === huruf;
                        return (
                          <button key={huruf} type="button"
                            onClick={() => setJawaban((prev) => ({ ...prev, [soalAktif.id]: huruf }))}
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition-all hover:border-slate-300 dark:border-slate-600"
                            style={active ? { borderColor: warna, background: "#EEF1FF" } : undefined}>
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              active ? "" : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                            }`} style={active ? { background: warna, color: "#FFFFFF" } : undefined}>{huruf}</span>
                            <span className={active ? "font-semibold text-slate-800 dark:text-white" : "text-slate-700 dark:text-slate-200"}>{teks}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea rows={8} value={jawaban[soalAktif.id] ?? ""}
                      onChange={(e) => setJawaban((prev) => ({ ...prev, [soalAktif.id]: e.target.value }))}
                      placeholder="Tulis jawabanmu..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#0033FF] focus:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                    <button type="button" onClick={() => setCurrentSoalIdx((i) => Math.max(0, i - 1))} disabled={soalIdx === 0}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 transition-opacity disabled:opacity-40 dark:border-slate-600 dark:text-slate-400">
                      <ChevronLeft size={15} /> Sebelumnya
                    </button>
                    <button type="button" onClick={() => setCurrentSoalIdx((i) => Math.min(soalList.length - 1, i + 1))} disabled={soalIdx === soalList.length - 1}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity disabled:opacity-40"
                      style={{ background: warna }}>
                      Soal Berikutnya <ChevronRight size={15} />
                    </button>
                  </div>

                  {/* Selesai baru "menyala" begitu semua soal terjawab — sebelum
                      itu dibiarkan redup & tidak bisa diklik. */}
                  <button type="button" onClick={() => setShowConfirmSelesai(true)}
                    disabled={dijawabCount < soalList.length || submitting}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:shadow-none"
                    style={
                      dijawabCount >= soalList.length
                        ? { background: warna, color: "#FFFFFF" }
                        : { background: "#F1F5F8", color: "#94a3b8" }
                    }>
                    <Send size={14} />
                    {dijawabCount >= soalList.length ? "Selesai Mengerjakan" : `Jawab semua soal dulu (${dijawabCount}/${soalList.length})`}
                  </button>
                </motion.div>
              )}
            </div>
          )
        )}
      </div>

      {showConfirmSelesai && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
            <p className="mb-2 text-base font-extrabold text-slate-800 dark:text-white">Kumpulkan sekarang?</p>
            <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
              Setelah dikumpulkan, jawaban ini tidak bisa diubah lagi kecuali guru meminta revisi.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmSelesai(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 dark:border-slate-600 dark:text-slate-400">
                Batal
              </button>
              <button onClick={() => { setShowConfirmSelesai(false); doSubmit(false); }} disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "#00D67F" }}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Ya, Kumpulkan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
