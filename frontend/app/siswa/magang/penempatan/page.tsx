"use client";

import { useEffect, useState } from "react";
import { Briefcase, Building2, CalendarDays, MapPin, Phone, User, Users } from "lucide-react";
import { toTitleCase } from "@/components/data-siswa/shared";
import { STATUS_PENEMPATAN_CFG } from "@/components/magang/types";
import type { PenempatanMagang } from "@/components/magang/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

export default function SiswaMagangPenempatanPage() {
  const [list, setList] = useState<PenempatanMagang[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/magang/penempatan/saya", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const aktif = list.find((p) => p.status === "AKTIF");
  const riwayat = list.filter((p) => p.status !== "AKTIF");

  return (
    <div className="space-y-5 lg:p-1">
      <div className="relative hidden overflow-hidden rounded-2xl p-6 lg:block" style={{ background: "#0082FB" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-14 sm:w-14">
            <Briefcase size={22} className="text-white sm:hidden" />
            <Briefcase size={26} className="hidden text-white sm:block" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">PKL</span>
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Penempatan PKL Saya</h1>
          </div>
        </div>
      </div>

      <div className="hidden space-y-5 lg:block">
        {loading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
        ) : !aktif ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <Users size={24} className="text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Kamu belum ditempatkan PKL</p>
            <p className="max-w-sm text-xs text-slate-400">Admin akan menempatkan kamu ke tempat magang begitu jadwal PKL dimulai.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#0082FB" }}>
                  <Building2 size={18} />
                </span>
                <div>
                  <p className="text-base font-extrabold text-slate-800 dark:text-white">{aktif.tempatMagang.namaTempat}</p>
                  {aktif.tempatMagang.bidangUsaha && <p className="text-[11px] text-slate-400">{aktif.tempatMagang.bidangUsaha}</p>}
                </div>
              </div>
              <span className="shrink-0 rounded-lg px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: STATUS_PENEMPATAN_CFG[aktif.status].bg, color: STATUS_PENEMPATAN_CFG[aktif.status].clr }}>
                {STATUS_PENEMPATAN_CFG[aktif.status].label}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Alamat</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{aktif.tempatMagang.alamat}</p>
                </div>
              </div>
              {aktif.tempatMagang.kontak && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                  <Phone size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Kontak</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{aktif.tempatMagang.kontak}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                <User size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Guru Pembimbing</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{toTitleCase(aktif.guruPembimbing.user.nama)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Periode</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {fmt(aktif.tanggalMulai)}{aktif.tanggalSelesai ? ` – ${fmt(aktif.tanggalSelesai)}` : " – berlangsung"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {riwayat.length > 0 && (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Riwayat Penempatan</p>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {riwayat.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.tempatMagang.namaTempat}</p>
                    <p className="text-[11px] text-slate-400">{fmt(p.tanggalMulai)}{p.tanggalSelesai ? ` – ${fmt(p.tanggalSelesai)}` : ""}</p>
                  </div>
                  <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: STATUS_PENEMPATAN_CFG[p.status].bg, color: STATUS_PENEMPATAN_CFG[p.status].clr }}>
                    {STATUS_PENEMPATAN_CFG[p.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative isolate -m-4 lg:hidden" style={{ background: "#0082FB" }}>
        <div className="h-6" />
        <div className="space-y-4 rounded-t-[28px] bg-[#F1F5F8] p-4 dark:bg-[#1C2B33]">
        {loading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white dark:bg-[#1C2B33]" />
        ) : !aktif ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white px-6 py-14 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1C2B33]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "#0082FB18" }}>
              <Users size={24} style={{ color: "#0082FB" }} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Kamu belum ditempatkan PKL</p>
            <p className="max-w-sm text-xs text-slate-400">Admin akan menempatkan kamu ke tempat magang begitu jadwal PKL dimulai.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl shadow-[0_4px_16px_-6px_rgba(0,130,251,0.35)]" style={{ background: "#0082FB" }}>
            <div className="relative px-5 pb-5 pt-6">
              <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                    <Building2 size={19} className="text-white" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black leading-tight text-white">{aktif.tempatMagang.namaTempat}</p>
                    {aktif.tempatMagang.bidangUsaha && <p className="truncate text-[11px] text-white/70">{aktif.tempatMagang.bidangUsaha}</p>}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold text-white">
                  {STATUS_PENEMPATAN_CFG[aktif.status].label}
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-t-3xl bg-white p-4 dark:bg-[#1C2B33]">
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Alamat</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{aktif.tempatMagang.alamat}</p>
                </div>
              </div>
              {aktif.tempatMagang.kontak && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                  <Phone size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Kontak</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{aktif.tempatMagang.kontak}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                <User size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Guru Pembimbing</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{toTitleCase(aktif.guruPembimbing.user.nama)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-700/30">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-[#0082FB]" />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Periode</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {fmt(aktif.tanggalMulai)}{aktif.tanggalSelesai ? ` – ${fmt(aktif.tanggalSelesai)}` : " – berlangsung"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {riwayat.length > 0 && (
          <div className="rounded-3xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:bg-[#1C2B33]">
            <div className="px-5 pt-4">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Riwayat Penempatan</p>
            </div>
            <div className="divide-y divide-slate-50 px-5 dark:divide-slate-700/30">
              {riwayat.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{p.tempatMagang.namaTempat}</p>
                    <p className="text-[11px] text-slate-400">{fmt(p.tanggalMulai)}{p.tanggalSelesai ? ` – ${fmt(p.tanggalSelesai)}` : ""}</p>
                  </div>
                  <span className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: STATUS_PENEMPATAN_CFG[p.status].bg, color: STATUS_PENEMPATAN_CFG[p.status].clr }}>
                    {STATUS_PENEMPATAN_CFG[p.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
