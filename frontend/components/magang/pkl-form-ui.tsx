"use client";

import type { Alamat } from "./types";

export const PKL_FIELD = "h-11 w-full rounded-2xl border-0 bg-[#F1EDFA] px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] disabled:cursor-not-allowed disabled:opacity-70 read-only:cursor-default dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400";
export const PKL_CAP = "mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300";
export const ALAMAT_KOSONG: Alamat = { dukuh: "", rt: "", rw: "", desa: "", kecamatan: "", kabupaten: "" };

export function pesanError(d: unknown, fallback: string): string {
  const m = (d as { message?: unknown } | null)?.message;
  if (Array.isArray(m)) return String(m[0] ?? fallback);
  return m ? String(m) : fallback;
}

export function PklInput({ label, wajib, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wajib?: boolean }) {
  return (
    <div className="min-w-0">
      <label className={PKL_CAP}>{label}{wajib && <span className="text-[#E8562B]"> *</span>}</label>
      <input {...props} className={PKL_FIELD} />
    </div>
  );
}

export function AlamatFields({ value, onChange, disabled }: { value: Alamat; onChange: (v: Alamat) => void; disabled?: boolean }) {
  const set = (k: keyof Alamat, v: string) => onChange({ ...value, [k]: v });
  const angka = (v: string) => v.replace(/\D/g, "").slice(0, 3);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_72px_72px] gap-2 sm:gap-3">
        <PklInput label="Dukuh" wajib value={value.dukuh} disabled={disabled} onChange={(e) => set("dukuh", e.target.value)} />
        <PklInput label="RT" wajib inputMode="numeric" placeholder="001" value={value.rt} disabled={disabled} onChange={(e) => set("rt", angka(e.target.value))} />
        <PklInput label="RW" wajib inputMode="numeric" placeholder="002" value={value.rw} disabled={disabled} onChange={(e) => set("rw", angka(e.target.value))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <PklInput label="Desa" wajib value={value.desa} disabled={disabled} onChange={(e) => set("desa", e.target.value)} />
        <PklInput label="Kecamatan" wajib value={value.kecamatan} disabled={disabled} onChange={(e) => set("kecamatan", e.target.value)} />
        <PklInput label="Kabupaten" wajib value={value.kabupaten} disabled={disabled} onChange={(e) => set("kabupaten", e.target.value)} />
      </div>
    </div>
  );
}

export function alamatLengkap(a: Alamat) {
  return (Object.keys(a) as (keyof Alamat)[]).every((k) => a[k].trim());
}

export const WA_VALID = /^[0-9+\s-]{8,20}$/;
