"use client";

import { useState, useEffect } from "react";
import { FileText, FileSpreadsheet, Download, Users, School, Loader2 } from "lucide-react";
import { kelasShort } from "./shared";
import { downloadDataSiswaPdf, downloadDataSiswaExcel } from "./downloadDataSiswa";
import { useToast } from "@/components/shared/ToastSystem";
import { OptionCard3D } from "@/components/shared/Icon3D";

type Scope = "semua" | "kelas";
type ExportKind = "pdf" | "excel";

export function UnduhLaporanDropdown({ kelasId, kelasNama }: { kelasId?: string; kelasNama?: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("semua");
  const [loadingKind, setLoadingKind] = useState<ExportKind | null>(null);

  useEffect(() => {
    if (scope === "kelas" && !kelasId) setScope("semua");
  }, [kelasId, scope]);

  async function run(kind: ExportKind) {
    setLoadingKind(kind);
    try {
      const opts = scope === "kelas" ? { kelasId, kelasNama } : {};
      const result = kind === "pdf" ? await downloadDataSiswaPdf(opts) : await downloadDataSiswaExcel(opts);
      if (!result.ok) toast.error(kind === "pdf" ? "Gagal membuat PDF" : "Gagal membuat Excel", result.message);
      else setOpen(false);
    } finally {
      setLoadingKind(null);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10.5 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 transition-all hover:border-[#3E03B3] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <Download size={15} className="text-[#3E03B3] dark:text-[#8F6DD3]" />
        Unduh Laporan
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1.5 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Cakupan</p>
            <div className="mb-3 grid grid-cols-1 gap-2">
              <OptionCard3D icon={Users} tone="emerald" label="Semua Siswa" caption="Seluruh data"
                active={scope === "semua"} onClick={() => setScope("semua")} />
              <OptionCard3D icon={School} tone="sky" label={kelasNama ? kelasShort(kelasNama) : "Kelas Ini"} caption="Kelas terpilih"
                active={scope === "kelas"} disabled={!kelasId} title={!kelasId ? "Pilih kelas di filter dahulu" : undefined}
                onClick={() => kelasId && setScope("kelas")} />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => run("pdf")}
                disabled={!!loadingKind}
                className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 border-[#A1F919]/20 bg-[#F6FEE8] text-[#5D900F] dark:bg-[#A1F919]/15 dark:text-[#A1F919]"
              >
                {loadingKind === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => run("excel")}
                disabled={!!loadingKind}
                className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 border-[#A1F919]/20 bg-[#F6FEE8] text-[#5D900F] dark:bg-[#A1F919]/15 dark:text-[#A1F919]"
              >
                {loadingKind === "excel" ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                Download Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
