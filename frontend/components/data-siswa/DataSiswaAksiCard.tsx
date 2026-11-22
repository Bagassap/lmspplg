"use client";

import Link from "next/link";
import { ArrowUpCircle, ChevronRight, NotebookPen } from "lucide-react";
import { AppFold } from "@/components/app/AppUI";
import { KartuPelajarBanner } from "@/components/shared/KartuPelajarBanner";
import { UnduhDataSiswaCard } from "./UnduhDataSiswaCard";

const BARIS = "flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left transition-colors hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-600";

function Pembatas() {
  return <div className="mx-5 h-px bg-slate-200 dark:bg-slate-600" />;
}

function IsiBaris({ icon: Icon, label }: { icon: typeof NotebookPen; label: string }) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className="icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#EFE9FD" }}>
          <Icon size={18} />
        </span>
        <span className="text-sm font-bold text-slate-800 dark:text-white">{label}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </>
  );
}

export function DataSiswaAksiCard({ role, kelasId, kelasNama, onKenaikan }: {
  role: "admin" | "guru";
  kelasId?: string;
  kelasNama?: string;
  onKenaikan?: () => void;
}) {
  return (
    <div className="flex flex-col rounded-3xl bg-white shadow-sm dark:bg-slate-800">
      <AppFold title="Kartu pelajar, unduh & catatan">
        <div className="p-5"><KartuPelajarBanner compact /></div>
        <Pembatas />
        <div className="p-5"><UnduhDataSiswaCard kelasId={kelasId} kelasNama={kelasNama} /></div>
        <Pembatas />
        {onKenaikan && (
          <>
            <div className="p-5">
              <button type="button" onClick={onKenaikan} className={BARIS}>
                <IsiBaris icon={ArrowUpCircle} label="Kenaikan Kelas & Kelulusan" />
              </button>
            </div>
            <Pembatas />
          </>
        )}
        <div className="p-5">
          <Link href={`/${role}/catatan-siswa`} className={BARIS}>
            <IsiBaris icon={NotebookPen} label="Catatan Siswa" />
          </Link>
        </div>
      </AppFold>
    </div>
  );
}
