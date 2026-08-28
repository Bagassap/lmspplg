"use client";

import { Lock, PlusCircle, RotateCcw, ShieldAlert } from "lucide-react";

// Bar info + aksi percobaan (lockdown PRAKTIK/PILIHAN_GANDA/ESSAY) — dipakai
// di dalam modal Lihat Kode & Lihat Jawaban, BUKAN di baris daftar submisi,
// supaya baris daftar tidak penuh tombol (lihat riwayat: reset & tambah
// percobaan dulu ada di baris, terlalu banyak aksi jadi "rumpek").
export function PercobaanBar({
  jumlahPercobaan, maksimalPercobaan, terkunci, dipaksaKeluar, bonusPercobaan,
  onTambahPercobaan, onResetPercobaan,
}: {
  jumlahPercobaan: number;
  maksimalPercobaan: number;
  terkunci: boolean;
  dipaksaKeluar?: boolean;
  bonusPercobaan?: number;
  onTambahPercobaan?: () => void;
  onResetPercobaan?: () => void;
}) {
  if (!jumlahPercobaan) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-700 dark:bg-slate-700/20">
      <span className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
        terkunci ? "bg-red-50 text-red-500 dark:bg-red-900/20" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
      }`}>
        <Lock size={10} /> Percobaan {jumlahPercobaan}/{maksimalPercobaan}
        {!!bonusPercobaan && ` (+${bonusPercobaan})`}
      </span>
      {dipaksaKeluar && (
        <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-500 dark:bg-red-900/20">
          <ShieldAlert size={10} /> Dipaksa Keluar
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">
        {terkunci && onTambahPercobaan && (
          <button onClick={onTambahPercobaan}
            title="Tambah 1 kesempatan tanpa menghapus riwayat percobaan sebelumnya — cocok untuk kasus HP mati/keluar tanpa sengaja"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400">
            <PlusCircle size={12} /> Tambah 1x Percobaan
          </button>
        )}
        {onResetPercobaan && (
          <button onClick={onResetPercobaan}
            title="Reset penuh ke 0 percobaan — riwayat percobaan sebelumnya hilang"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400">
            <RotateCcw size={12} /> Reset Percobaan
          </button>
        )}
      </div>
    </div>
  );
}
