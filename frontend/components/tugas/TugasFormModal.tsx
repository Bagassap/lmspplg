"use client";

import { DateInputID } from "@/components/shared/DateInputID";
import { TimeInput24 } from "@/components/shared/TimeInput24";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ClipboardList, Loader2, Upload, File as FileIcon, CalendarClock, Send, Code2,
  ListChecks, PenLine, Plus, Trash2, CheckCircle2, ChevronDown, FileDown, FileUp,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { CodePracticeCanvas } from "@/components/materi/CodePracticeCanvas";
import { formatTglJam } from "./types";
import type { TugasItem, TugasTipe } from "./types";
import { useSheetHeader } from "@/components/app/AppUI";
import { downloadTemplateSoal, parseSoalDocx } from "@/lib/soalWord";

type KelasOption = { id: string; nama: string };

type SoalDraft = {
  pertanyaan: string;
  pilihanA: string;
  pilihanB: string;
  pilihanC: string;
  pilihanD: string;
  jawabanBenar: string;
};

function emptySoal(): SoalDraft {
  return { pertanyaan: "", pilihanA: "", pilihanB: "", pilihanC: "", pilihanD: "", jawabanBenar: "" };
}

const INPUT_CLS = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:border-[#3E03B3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3E03B3]/15 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#00AAFA] dark:focus:bg-slate-700";

function toLocalInputValue(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600 * 1000);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const parts = fmt.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function wibInputToIso(value: string) {
  return new Date(`${value}:00+07:00`).toISOString();
}

const TIPE_OPTIONS: { value: TugasTipe; label: string; icon: typeof Send; gradient: string; desc: string }[] = [
  { value: "SUBMIT", label: "Kirim File", icon: Send, gradient: "#3E03B3", desc: "Siswa mengunggah file jawaban (PDF/PPT/ZIP), tanpa mode pengerjaan di LMS." },
  { value: "PRAKTIK", label: "Praktik Kode", icon: Code2, gradient: "#F26A3D", desc: "Siswa mengetik HTML/CSS/JS langsung di LMS dan hasilnya tampil live." },
  { value: "PILIHAN_GANDA", label: "Pilihan Ganda", icon: ListChecks, gradient: "#F26A3D", desc: "Siswa memilih jawaban A–D untuk tiap soal." },
  { value: "ESSAY", label: "Essay", icon: PenLine, gradient: "#0EA5E9", desc: "Siswa mengetik jawaban esai untuk tiap soal." },
];

export function TugasFormModal({
  open, tugas, onClose, onSaved, mapelOptions,
}: {
  open: boolean;
  tugas?: TugasItem | null;
  onClose: () => void;
  onSaved: (t: TugasItem) => void;
  mapelOptions?: string[];
}) {
  const isEdit = !!tugas;
  const h = useSheetHeader("#3E03B3");
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mapel, setMapel] = useState("");
  const [kelasIds, setKelasIds] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [kelasDropdownOpen, setKelasDropdownOpen] = useState(false);
  const kelasDropdownRef = useRef<HTMLDivElement>(null);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [deadline, setDeadline] = useState(toLocalInputValue());
  const [tipe, setTipe] = useState<TugasTipe>("SUBMIT");
  const [file, setFile] = useState<File | null>(null);
  const [code, setCode] = useState({ html: "", css: "", js: "" });
  const [soalList, setSoalList] = useState<SoalDraft[]>([emptySoal()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSoalBased = tipe === "PILIHAN_GANDA" || tipe === "ESSAY";

  useEffect(() => {
    if (open) {
      setMapel(tugas?.mapel ?? "");
      setKelasIds(tugas?.kelasList?.map((k) => k.id) ?? []);
      setKelasDropdownOpen(false);
      setJudul(tugas?.judul ?? "");
      setDeskripsi(tugas?.deskripsi ?? "");
      setDeadline(toLocalInputValue(tugas?.deadline));
      setTipe((tugas?.tipe as TugasTipe) ?? "SUBMIT");
      setFile(null);
      setCode({ html: tugas?.starterHtml ?? "", css: tugas?.starterCss ?? "", js: tugas?.starterJs ?? "" });
      setSoalList(
        tugas?.soal?.length
          ? tugas.soal.map((s) => ({
              pertanyaan: s.pertanyaan,
              pilihanA: s.pilihanA ?? "",
              pilihanB: s.pilihanB ?? "",
              pilihanC: s.pilihanC ?? "",
              pilihanD: s.pilihanD ?? "",
              jawabanBenar: s.jawabanBenar ?? "",
            }))
          : [emptySoal()]
      );
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetch("/api/kelas").then((r) => r.json()).then((d) => setKelasList(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [open, tugas]);

  useEffect(() => {
    if (!kelasDropdownOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (kelasDropdownRef.current && !kelasDropdownRef.current.contains(e.target as Node)) {
        setKelasDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [kelasDropdownOpen]);

  function toggleKelas(id: string) {
    setKelasIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function updateSoal(idx: number, patch: Partial<SoalDraft>) {
    setSoalList((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function addSoal() {
    setSoalList((prev) => [...prev, emptySoal()]);
  }
  const isKosong = (x: SoalDraft) => !x.pertanyaan.trim() && !x.pilihanA && !x.pilihanB && !x.pilihanC && !x.pilihanD && !x.jawabanBenar.trim();

  // Tambah banyak soal sekaligus: cukup ketik jumlahnya (2/3/4/5/...).
  const [bulk, setBulk] = useState("");
  function addMany() {
    const n = Math.min(100, Math.max(0, parseInt(bulk, 10) || 0));
    if (n < 1) return;
    setSoalList((prev) => [...prev, ...Array.from({ length: n }, () => emptySoal())]);
    setBulk("");
    toast.success(`${n} soal ditambahkan`, "Tinggal isi pertanyaan dan jawabannya.");
  }

  // Impor soal + jawaban dari berkas Word (.docx) sesuai templat.
  const wordRef = useRef<HTMLInputElement>(null);
  const [wordBusy, setWordBusy] = useState(false);
  async function handleWord(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/\.docx$/i.test(f.name)) { toast.error("Berkas harus .docx", "Simpan dokumen Word sebagai .docx lalu coba lagi."); return; }
    setWordBusy(true);
    try {
      const hasil = await parseSoalDocx(f, tipe);
      if (hasil.length === 0) {
        toast.warning("Soal tidak terbaca", "Pakai templat Word: tiap soal diawali nomor (1. 2. 3.) dan jawabannya di baris 'Jawaban:' / 'Kunci:'.");
        return;
      }
      setSoalList((prev) => (prev.every(isKosong) ? hasil : [...prev.filter((x) => !isKosong(x)), ...hasil]));
      const tanpaJawaban = hasil.filter((x) => !x.jawabanBenar.trim()).length;
      toast.success(`${hasil.length} soal dibaca dari Word`, tanpaJawaban ? `${tanpaJawaban} soal belum ada jawaban/kunci, lengkapi di bawah.` : "Periksa lalu simpan tugas.");
    } catch {
      toast.error("Gagal membaca berkas Word", "Pastikan berkasnya tidak rusak dan berformat .docx.");
    } finally {
      setWordBusy(false);
    }
  }
  function removeSoal(idx: number) {
    setSoalList((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !mapel.trim() || !deadline) {
      setError("Mata pelajaran, judul, dan deadline wajib diisi.");
      return;
    }
    if (isSoalBased && soalList.every((s) => !s.pertanyaan.trim())) {
      setError("Minimal 1 soal dengan pertanyaan wajib diisi.");
      return;
    }
    if (tipe === "PILIHAN_GANDA" && soalList.some((s) => s.pertanyaan.trim() && !s.jawabanBenar)) {
      setError("Setiap soal pilihan ganda wajib punya jawaban benar — klik salah satu huruf di samping pilihan.");
      return;
    }
    if (tipe === "ESSAY" && soalList.some((s) => s.pertanyaan.trim() && !s.jawabanBenar.trim())) {
      setError("Setiap soal essay wajib punya kunci jawaban sebagai acuan penilaian.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("mapel", mapel);
      fd.append("kelasIds", JSON.stringify(kelasIds));
      fd.append("judul", judul);
      fd.append("deskripsi", deskripsi);
      fd.append("deadline", wibInputToIso(deadline));
      fd.append("tipe", tipe);
      if (tipe === "PRAKTIK") {
        fd.append("starterHtml", code.html);
        fd.append("starterCss", code.css);
        fd.append("starterJs", code.js);
      }
      if (isSoalBased) {
        const payload = soalList
          .filter((s) => s.pertanyaan.trim())
          .map((s) =>
            tipe === "PILIHAN_GANDA"
              ? { pertanyaan: s.pertanyaan, pilihanA: s.pilihanA, pilihanB: s.pilihanB, pilihanC: s.pilihanC, pilihanD: s.pilihanD, jawabanBenar: s.jawabanBenar }
              : { pertanyaan: s.pertanyaan, jawabanBenar: s.jawabanBenar }
          );
        fd.append("soal", JSON.stringify(payload));
      }
      if (file) fd.append("file", file);

      const url = isEdit ? `/api/tugas/${tugas!.id}` : "/api/tugas";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = Array.isArray(d.message) ? d.message.join(", ") : (d.message ?? "Gagal menyimpan tugas.");
        setError(msg);
        toast.error("Gagal menyimpan", msg);
        return;
      }
      const saved = await res.json();
      toast.success(isEdit ? "Tugas diperbarui!" : "Tugas ditambahkan!", judul);
      onSaved(saved);
      onClose();
    } catch {
      const msg = "Server tidak dapat dijangkau.";
      setError(msg);
      toast.error("Koneksi bermasalah", msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className={`relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:rounded-3xl ${tipe === "PRAKTIK" || isSoalBased ? "max-w-3xl" : "max-w-lg"}`}
          >
            <div className="relative flex shrink-0 items-center gap-3 overflow-hidden px-6 py-5" style={{ background: h.bg }}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${h.iconBox}`}>
                <ClipboardList size={18} />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${h.sub}`}>Tugas</p>
                <h2 className={`text-base font-extrabold ${h.title}`}>{isEdit ? "Edit Tugas" : "Tambah Tugas"}</h2>
              </div>
              <button onClick={onClose}
                className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${h.close}`}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-300">
                    Mata Pelajaran <span className="text-[#5D900F] dark:text-[#C4B5FD]">*</span>
                  </label>
                  {mapelOptions ? (
                    <select value={mapel} onChange={(e) => setMapel(e.target.value)} className={INPUT_CLS}>
                      <option value="">Pilih mata pelajaran…</option>
                      {(mapel && !mapelOptions.includes(mapel) ? [mapel, ...mapelOptions] : mapelOptions).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={mapel} onChange={(e) => setMapel(e.target.value)}
                      placeholder="Contoh: Pemrograman Web" className={INPUT_CLS} />
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-300">Kelas Target</label>
                  <div className="relative" ref={kelasDropdownRef}>
                    <button type="button" onClick={() => setKelasDropdownOpen((v) => !v)}
                      className={INPUT_CLS + " flex items-center justify-between gap-2 text-left"}>
                      <span className={`truncate ${kelasIds.length ? "" : "text-gray-400"}`}>
                        {kelasIds.length === 0
                          ? "Semua Kelas"
                          : kelasList.filter((k) => kelasIds.includes(k.id)).map((k) => k.nama).join(", ")}
                      </span>
                      <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${kelasDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {kelasDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-slate-600 dark:bg-slate-700"
                        >
                          {kelasList.length === 0 && (
                            <p className="px-3 py-2 text-xs text-gray-400 dark:text-slate-500">Memuat daftar kelas…</p>
                          )}
                          {kelasList.map((k) => {
                            const active = kelasIds.includes(k.id);
                            return (
                              <label key={k.id}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-600">
                                <input type="checkbox" checked={active} onChange={() => toggleKelas(k.id)}
                                  className="h-3.5 w-3.5 rounded border-gray-300 text-[#3E03B3] focus:ring-[#3E03B3] dark:border-slate-500" />
                                {k.nama}
                              </label>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400 dark:text-slate-500">
                    {kelasIds.length === 0 ? "Semua Kelas" : `${kelasIds.length} kelas dipilih`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-300">
                    Judul Tugas <span className="text-[#5D900F] dark:text-[#C4B5FD]">*</span>
                  </label>
                  <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Membuat Landing Page" className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                    <CalendarClock size={12} /> Deadline <span className="text-[#5D900F] dark:text-[#C4B5FD]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <DateInputID value={deadline.slice(0, 10)} onChange={(v) => setDeadline(`${v}T${deadline.slice(11, 16) || "23:59"}`)} className={INPUT_CLS + " flex-1"} />
                    <div className="w-40 shrink-0">
                      <TimeInput24 value={deadline.slice(11, 16) || "23:59"}
                        onChange={(v) => setDeadline(`${deadline.slice(0, 10) || toLocalInputValue().slice(0, 10)}T${v}`)} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-300">Jenis Pengerjaan</label>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {TIPE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setTipe(opt.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2.5 text-xs font-bold transition-all ${
                        tipe === opt.value ? "shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                      style={tipe === opt.value ? { background: opt.gradient, color: opt.gradient === "#F26A3D" ? "#0F172A" : "#FFFFFF" } : {}}>
                      <opt.icon size={14} /> {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 dark:text-slate-500">
                  {TIPE_OPTIONS.find((o) => o.value === tipe)?.desc}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-300">Instruksi / Deskripsi</label>
                <textarea rows={3} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan instruksi pengerjaan tugas ini…" className={INPUT_CLS + " resize-none"} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-300">
                  File Soal / Lampiran <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:border-[#3E03B3]/40 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/40">
                  <Upload size={16} className="shrink-0 text-[#3E03B3]" />
                  <div className="min-w-0 flex-1">
                    {file ? (
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-800 dark:text-slate-200">
                        <FileIcon size={13} className="shrink-0" /> {file.name}
                      </p>
                    ) : tugas?.fileName ? (
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-200">{tugas.fileName} <span className="font-normal text-gray-400">(saat ini, pilih untuk ganti)</span></p>
                    ) : (
                      <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Klik untuk unggah PDF/PPT/ZIP (maks. 20MB)</p>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.ppt,.pptx,.zip,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-zip-compressed"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>
              </div>

              {tipe === "PRAKTIK" && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-300">
                    Kode Awal Praktik <span className="font-normal text-gray-400">(tampil sebagai starter code siswa)</span>
                  </label>
                  <CodePracticeCanvas
                    initialHtml={tugas?.starterHtml ?? ""}
                    initialCss={tugas?.starterCss ?? ""}
                    initialJs={tugas?.starterJs ?? ""}
                    onChange={setCode}
                    minHeight={320}
                  />
                </div>
              )}

              {isSoalBased && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                      Daftar Soal <span className="text-[#E8562B]">*</span>
                      <span className="ml-1.5 font-normal text-gray-500">({soalList.filter((x) => !isKosong(x)).length} terisi / {soalList.length})</span>
                    </label>
                    <button type="button" onClick={addSoal}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm"
                      style={{ background: "#3E03B3" }}>
                      <Plus size={12} /> Tambah 1
                    </button>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[#F1EDFA] p-2.5">
                    <div className="flex items-center gap-1.5">
                      <input type="number" inputMode="numeric" min={1} max={100} value={bulk}
                        onChange={(e) => setBulk(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMany(); } }}
                        placeholder="Jumlah"
                        className="h-9 w-20 rounded-full border-0 bg-white px-3 text-center text-sm font-bold text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3]" />
                      <button type="button" onClick={addMany} disabled={!(parseInt(bulk, 10) > 0)}
                        className="flex h-9 items-center gap-1 rounded-full bg-[#3E03B3] px-3.5 text-[11px] font-bold text-white disabled:opacity-50">
                        <Plus size={12} /> Tambah {parseInt(bulk, 10) > 0 ? parseInt(bulk, 10) : ""} soal
                      </button>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button type="button" onClick={() => downloadTemplateSoal(tipe)}
                        className="flex h-9 items-center gap-1 rounded-full bg-white px-3 text-[11px] font-bold text-[#3E03B3]">
                        <FileDown size={13} /> Templat Word
                      </button>
                      <button type="button" onClick={() => wordRef.current?.click()} disabled={wordBusy}
                        className="flex h-9 items-center gap-1 rounded-full bg-white px-3 text-[11px] font-bold text-[#3E03B3] disabled:opacity-60">
                        {wordBusy ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />} Impor dari Word
                      </button>
                      <input ref={wordRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleWord} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {soalList.map((s, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 dark:border-slate-600 dark:bg-slate-700/30">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">Soal {idx + 1}</span>
                          {soalList.length > 1 && (
                            <button type="button" onClick={() => removeSoal(idx)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-[#5D900F] dark:text-[#C4B5FD] hover:bg-[#F6FEE8] dark:hover:bg-slate-600">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <textarea rows={2} value={s.pertanyaan} onChange={(e) => updateSoal(idx, { pertanyaan: e.target.value })}
                          placeholder="Tulis pertanyaan..." className={INPUT_CLS + " resize-none mb-2"} />
                        {tipe === "PILIHAN_GANDA" && (
                          <div>
                            <label className="mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-slate-400">
                              Pilihan Jawaban <span className="text-[#5D900F] dark:text-[#C4B5FD]">*</span>{" "}
                              <span className="font-normal text-gray-400">(klik lingkaran di samping pilihan untuk menandai jawaban yang benar)</span>
                            </label>
                            <div className="space-y-1.5">
                              {(["A", "B", "C", "D"] as const).map((huruf) => {
                                const isKey = s.jawabanBenar === huruf;
                                return (
                                  <div key={huruf} className="flex items-center gap-2">
                                    <button type="button" onClick={() => updateSoal(idx, { jawabanBenar: huruf })}
                                      title="Tandai sebagai jawaban benar"
                                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                                        isKey ? "border-[#F26A3D] bg-[#3E03B3] text-white" : "border-gray-300 bg-white text-gray-400 hover:border-[#F26A3D] dark:bg-slate-700 dark:border-slate-600"
                                      }`}>
                                      {isKey ? <CheckCircle2 size={15} /> : huruf}
                                    </button>
                                    <input value={s[`pilihan${huruf}` as keyof SoalDraft]}
                                      onChange={(e) => updateSoal(idx, { [`pilihan${huruf}`]: e.target.value } as Partial<SoalDraft>)}
                                      placeholder={`Pilihan ${huruf}`}
                                      className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-[#3E03B3] dark:bg-slate-800 dark:text-slate-100 ${
                                        isKey ? "border-[#F26A3D] dark:border-[#48700B]" : "border-gray-200 dark:border-slate-600"
                                      }`} />
                                    {isKey && <span className="shrink-0 text-[10px] font-bold text-[#5D900F] dark:text-[#C4B5FD]">Jawaban Benar</span>}
                                  </div>
                                );
                              })}
                            </div>
                            {s.pertanyaan.trim() && !s.jawabanBenar ? (
                              <p className="mt-1.5 pl-9 text-[10px] font-bold text-[#5D900F] dark:text-[#C4B5FD]">⚠ Belum ada jawaban benar yang ditandai untuk soal ini</p>
                            ) : (
                              <p className="mt-1.5 pl-9 text-[10px] text-gray-400">Klik lingkaran huruf untuk menandai jawaban benar</p>
                            )}
                          </div>
                        )}
                        {tipe === "ESSAY" && (
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-gray-500 dark:text-slate-400">
                              Kunci Jawaban <span className="text-[#5D900F] dark:text-[#C4B5FD]">*</span>{" "}
                              <span className="font-normal text-gray-400">(acuan untuk kamu cocokkan saat menilai, tidak dikirim ke siswa)</span>
                            </label>
                            <textarea rows={2} value={s.jawabanBenar} onChange={(e) => updateSoal(idx, { jawabanBenar: e.target.value })}
                              placeholder="Tulis jawaban ideal / poin kunci yang harus ada..."
                              className={`w-full resize-none rounded-lg border bg-[#F6FEE8]/50 px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-[#F26A3D] dark:bg-[#48700B]/10 dark:text-slate-100 ${
                                s.pertanyaan.trim() && !s.jawabanBenar.trim() ? "border-[#F26A3D] dark:border-[#48700B]" : "border-[#F6FEE8] dark:border-[#48700B]"
                              }`} />
                            {s.pertanyaan.trim() && !s.jawabanBenar.trim() && (
                              <p className="mt-1.5 text-[10px] font-bold text-[#5D900F] dark:text-[#C4B5FD]">⚠ Belum ada kunci jawaban untuk soal ini</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-[#F6FEE8] px-4 py-2.5 text-sm text-[#5D900F] dark:bg-[#48700B]/30 dark:text-[#C4B5FD]">{error}</p>
              )}
            </form>

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 p-6 pt-4 dark:border-slate-700">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
                Batal
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60 ${h.app ? "rounded-full" : "rounded-xl"}`}
                style={{ background: h.app ? "#3E03B3" : "#3E03B3" }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Tugas"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
