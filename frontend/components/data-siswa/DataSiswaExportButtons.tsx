"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { downloadDataSiswaPdf, downloadDataSiswaExcel } from "./downloadDataSiswa";

type ExportKind = "pdf" | "excel";

export function DataSiswaExportButtons({ kelasId, kelasNama }: { kelasId?: string; kelasNama?: string }) {
  const toast = useToast();
  const [loadingKind, setLoadingKind] = useState<ExportKind | null>(null);

  async function run(kind: ExportKind) {
    if (loadingKind) return;
    setLoadingKind(kind);
    try {
      const result =
        kind === "pdf"
          ? await downloadDataSiswaPdf({ kelasId, kelasNama })
          : await downloadDataSiswaExcel({ kelasId, kelasNama });
      if (!result.ok) toast.error(kind === "pdf" ? "Gagal membuat PDF" : "Gagal membuat Excel", result.message);
    } finally {
      setLoadingKind(null);
    }
  }

  const PDF_STYLE = { backgroundColor: "#FFF0EE", color: "#DC2626", borderColor: "#DC262630" };
  const EXCEL_STYLE = { backgroundColor: "#E8F8F1", color: "#0F9D58", borderColor: "#0F9D5830" };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <button type="button" onClick={() => run("pdf")} disabled={!!loadingKind}
        className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={PDF_STYLE}>
        {loadingKind === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
        Download PDF
      </button>
      <button type="button" onClick={() => run("excel")} disabled={!!loadingKind}
        className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={EXCEL_STYLE}>
        {loadingKind === "excel" ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
        Download Excel
      </button>
    </div>
  );
}
