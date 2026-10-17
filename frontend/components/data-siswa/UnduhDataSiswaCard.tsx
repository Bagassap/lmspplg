"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Users, School } from "lucide-react";
import { kelasShort } from "./shared";
import { OptionCard3D, type Tone3D } from "@/components/shared/Icon3D";
import { DataSiswaExportButtons } from "./DataSiswaExportButtons";

type Scope = "semua" | "kelas";

const SCOPE_CARDS: { key: Scope; label: string; caption: string; icon: React.ElementType; tone: Tone3D }[] = [
  { key: "semua", label: "Semua Siswa", caption: "Seluruh data", icon: Users, tone: "emerald" },
  { key: "kelas", label: "Kelas Ini", caption: "Kelas terpilih", icon: School, tone: "sky" },
];

export function UnduhDataSiswaCard({
  kelasId, kelasNama,
}: {
  kelasId?: string; kelasNama?: string;
}) {
  const [scope, setScope] = useState<Scope>("semua");

  useEffect(() => {
    if (scope === "kelas" && !kelasId) setScope("semua");
  }, [kelasId, scope]);

  const caption = scope === "kelas" && kelasNama ? kelasShort(kelasNama) : "Semua kelas";

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#3E03B3" }}>
          <FileText size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Unduh Laporan</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Ekspor data siswa ke PDF/Excel</p>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 content-center gap-2">
        {SCOPE_CARDS.map((opt) => {
          const disabled = opt.key === "kelas" && !kelasId;
          return (
            <OptionCard3D
              key={opt.key}
              icon={opt.icon}
              tone={opt.tone}
              label={opt.label}
              caption={opt.caption}
              active={scope === opt.key}
              disabled={disabled}
              title={disabled ? "Pilih kelas/jurusan di filter dahulu" : undefined}
              onClick={() => setScope(opt.key)}
            />
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-300">
        <School size={12} className="shrink-0 text-[#3E03B3]" />
        {caption}
      </p>

      <div className="mt-3">
        <DataSiswaExportButtons
          kelasId={scope === "kelas" ? kelasId : undefined}
          kelasNama={scope === "kelas" ? kelasNama : undefined}
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
        <Download size={11} className="shrink-0 text-[#3E03B3]" />
        Pilih cakupan, lalu klik salah satu tombol ekspor
      </p>
    </div>
  );
}
