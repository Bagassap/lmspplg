"use client";

import { FileText, Download, School } from "lucide-react";
import { kelasShort } from "./shared";
import { DataSiswaExportButtons } from "./DataSiswaExportButtons";

export function UnduhDataSiswaCard({ kelasId, kelasNama }: { kelasId?: string; kelasNama?: string }) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#6334F4,#4F46E5)" }}>
          <FileText size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Unduh Laporan</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Ekspor data siswa ke PDF/Excel</p>
        </div>
      </div>

      <span className="flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <School size={12} className="text-violet-500" />
        {kelasId && kelasNama ? kelasShort(kelasNama) : "Semua Kelas"}
      </span>

      <div className="mt-3">
        <DataSiswaExportButtons kelasId={kelasId} kelasNama={kelasNama} />
      </div>

      <p className="mt-auto flex items-center gap-1.5 pt-3 text-[10px] text-slate-400 dark:text-slate-500">
        <Download size={11} className="shrink-0 text-violet-500" />
        {kelasId ? "Mengunduh data untuk kelas yang dipilih di filter" : "Pilih kelas di filter untuk unduh per kelas, atau langsung unduh semua"}
      </p>
    </div>
  );
}
