"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ListChecks, PenLine, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { TugasJawabanItem } from "./types";
import { nilaiPilihanGanda } from "./types";
import { icon3dStyle } from "@/components/shared/Icon3D";

export function TugasJawabanViewerModal({
  open, onClose, judul, tipe, jawaban, nilai, canGrade, onSaveNilai,
}: {
  open: boolean;
  onClose: () => void;
  judul: string;
  tipe: string;
  jawaban: TugasJawabanItem[];
  nilai?: number | null;
  canGrade?: boolean;
  onSaveNilai?: (nilai: number) => Promise<void>;
}) {
  const isPg = tipe === "PILIHAN_GANDA";
  const sorted = [...jawaban].sort((a, b) => (a.soal?.urutan ?? 0) - (b.soal?.urutan ?? 0));
  const benar = sorted.filter((j) => j.soal?.jawabanBenar && j.jawabanPilihan === j.soal.jawabanBenar).length;
  const nilaiAkhir = isPg ? nilaiPilihanGanda({ nilai, jawaban: sorted }) : null;
  const nilaiAwal = nilai ?? nilaiAkhir;

  const [nilaiInput, setNilaiInput] = useState(nilaiAwal != null ? String(nilaiAwal) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setNilaiInput(nilaiAwal != null ? String(nilaiAwal) : "");
  }, [open, nilaiAwal]);

  async function handleSaveNilai() {
    if (nilaiInput === "" || saving) return;
    const parsed = Math.round(Number(nilaiInput));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return;
    setSaving(true);
    try {
      await onSaveNilai?.(parsed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative flex h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:rounded-3xl">
            <div className="flex shrink-0 items-center gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(isPg ? "amber" : "sky")}>
                {isPg ? <ListChecks size={26} color="#fff" /> : <PenLine size={26} color="#fff" />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">{judul}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isPg ? `${benar} dari ${sorted.length} soal benar` : `${sorted.length} soal esai`}
                </p>
              </div>
              {(isPg ? nilaiAkhir : nilai) != null && (
                <div className="shrink-0 rounded-2xl bg-[#F1EDFA] px-5 py-2 text-center">
                  <p className="text-[11px] font-bold text-slate-600">Nilai</p>
                  <p className="text-2xl font-black leading-none text-[#3E03B3]">{isPg ? nilaiAkhir : nilai}</p>
                </div>
              )}
              <button onClick={onClose} aria-label="Tutup"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#3E03B3]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8">
              {sorted.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Belum ada jawaban.</p>
              ) : (
                <div className="space-y-4">
                  {sorted.map((j, idx) => {
                    const soal = j.soal;
                    const isCorrect = isPg && !!soal?.jawabanBenar && j.jawabanPilihan === soal.jawabanBenar;
                    const isWrong = isPg && !!soal?.jawabanBenar && !!j.jawabanPilihan && j.jawabanPilihan !== soal.jawabanBenar;
                    return (
                      <div key={j.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-700">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <p className="text-base font-bold text-slate-900 dark:text-white">{idx + 1}. {soal?.pertanyaan}</p>
                          {isPg && soal?.jawabanBenar && (
                            isCorrect ? <CheckCircle size={22} className="shrink-0 text-[#5D900F]" /> : <XCircle size={22} className="shrink-0 text-[#E8562B]" />
                          )}
                        </div>
                        {isPg ? (
                          <div className="space-y-2">
                            {(["A", "B", "C", "D"] as const).map((huruf) => {
                              const teks = soal?.[`pilihan${huruf}` as "pilihanA" | "pilihanB" | "pilihanC" | "pilihanD"];
                              if (!teks) return null;
                              const isSelected = j.jawabanPilihan === huruf;
                              const isKey = soal?.jawabanBenar === huruf;
                              return (
                                <div key={huruf}
                                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base ${
                                    isKey ? "bg-[#F6FEE8] dark:bg-slate-700"
                                    : isSelected ? "bg-[#FFE9E2]"
                                    : "bg-white dark:bg-slate-800"
                                  }`}>
                                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                    isKey ? "bg-[#5D900F] text-white" : isSelected ? "bg-[#E8562B] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-700"
                                  }`}>{huruf}</span>
                                  <span className="text-slate-800 dark:text-slate-100">{teks}</span>
                                  {isSelected && <span className="ml-auto shrink-0 text-xs font-bold text-slate-600">Dipilih siswa</span>}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <p className="mb-1.5 text-sm font-bold text-slate-900 dark:text-white">Jawaban siswa</p>
                              <p className="whitespace-pre-wrap rounded-2xl bg-white px-5 py-4 text-base text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                                {j.jawabanEssay || <span className="text-slate-400">(belum dijawab)</span>}
                              </p>
                            </div>
                            {soal?.jawabanBenar && (
                              <div>
                                <p className="mb-1.5 text-sm font-bold text-[#48700B]">Kunci jawaban</p>
                                <p className="whitespace-pre-wrap rounded-2xl bg-[#F6FEE8] px-5 py-4 text-base text-slate-800">
                                  {soal.jawabanBenar}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {canGrade && (
              <div className="flex shrink-0 flex-wrap items-center gap-4 px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
                <label className="text-base font-bold text-slate-900 dark:text-white">Nilai (0–100)</label>
                <div className="relative">
                  <input type="number" min={0} max={100} step={1} value={nilaiInput} disabled={saving}
                    onChange={(e) => setNilaiInput(e.target.value)}
                    onBlur={handleSaveNilai}
                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                    placeholder="0-100"
                    className="h-12 w-32 rounded-full border-0 bg-[#F1EDFA] px-5 text-center text-lg font-bold text-[#3E03B3] outline-none focus:ring-2 focus:ring-[#3E03B3] disabled:opacity-60" />
                  {saving && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">Isi nilai lalu tekan Enter atau klik di luar kolom untuk menyimpan.</span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
