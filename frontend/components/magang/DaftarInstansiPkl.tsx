"use client";

import { useState } from "react";
import { DaftarInstansiList, useDaftarInstansi } from "./DaftarInstansiList";

const MODE = [
  { value: "daftar", label: "Sudah didaftar" },
  { value: "ditempati", label: "Sudah ditempati" },
] as const;

export default function DaftarInstansiPkl() {
  const instansi = useDaftarInstansi();
  const [mode, setMode] = useState<"daftar" | "ditempati">("daftar");

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-sm dark:bg-slate-800">
        {MODE.map((m) => (
          <button key={m.value} type="button" onClick={() => setMode(m.value)}
            className={`h-10 flex-1 rounded-xl text-xs font-bold transition-colors ${mode === m.value ? "bg-[#3E03B3] text-white" : "text-slate-500 dark:text-slate-400"}`}>
            {m.label}
          </button>
        ))}
      </div>
      <DaftarInstansiList list={instansi.list} loading={instansi.loading} mode={mode} />
    </div>
  );
}
