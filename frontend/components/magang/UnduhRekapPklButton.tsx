"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

export function UnduhRekapPklButton() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function unduh() {
    setBusy(true);
    try {
      const res = await fetch("/api/magang/pendaftaran/export-excel", { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal membuat rekap Excel", "");
        return;
      }
      const blob = await res.blob();
      const nama = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "Rekap_PKL.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Tidak dapat terhubung ke server", "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={unduh} disabled={busy}
      className="flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#3E03B3] text-xs font-bold text-white disabled:opacity-60">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Unduh Rekap Excel
    </button>
  );
}
