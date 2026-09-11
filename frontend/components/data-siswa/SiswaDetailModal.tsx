"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, User, GraduationCap, BookOpen, Phone, UserCheck, Users, Pencil, X, MapPin, CheckCircle2, XCircle, Hash, KeyRound,
} from "lucide-react";
import {
  type SiswaCardData, toTitleCase, getNama, kelasShort, formatTempatTanggalLahir, formatAlamatLengkap,
  completeness, missingFields, waLink,
} from "./shared";
import { Avatar } from "@/components/shared/Avatar";
import { ProgressRing } from "./ProgressRing";
import { MobileDetailModal } from "@/components/shared/MobileDetailModal";

function MobileRow({ icon: Icon, label, value, href }: {
  icon: React.ElementType; label: string; value: string | null | undefined; href?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-700/30">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <Icon size={13} /> {label}
      </span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" title="Kirim pesan WhatsApp"
          className="mt-1 block break-words text-sm font-bold text-emerald-600 underline decoration-emerald-200 dark:text-emerald-400">
          {value}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-white">{value || "—"}</p>
      )}
    </div>
  );
}

const HEADER_GRADIENT = "#0082FB";
const REF_PRIMARY = "#0082FB";
const REF_SUCCESS = "#00D67F";

function FieldItem({ icon: Icon, label, value, full, href }: {
  icon: React.ElementType; label: string; value: string | null | undefined; full?: boolean; href?: string | null;
}) {
  return (
    <div className={`flex items-start gap-1.5 ${full ? "col-span-2" : ""}`}>
      <Icon size={12} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Kirim pesan WhatsApp"
            className="mt-1.5 inline-block break-words text-[15px] font-bold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1.5 break-words text-[15px] font-bold text-slate-800 dark:text-white">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export function SiswaDetailModal({ siswa, onEdit, onClose }: {
  siswa: SiswaCardData; onEdit?: () => void; onClose: () => void;
}) {
  const displayNama = toTitleCase(getNama(siswa));
  const tempatTanggal = formatTempatTanggalLahir(siswa.tempatLahir, siswa.tanggalLahir);
  const waliKelas = siswa.kelas.waliKelasGuru?.user.nama ?? null;
  const alamatLengkap = formatAlamatLengkap(siswa);
  const pct = completeness(siswa);
  const missing = missingFields(siswa);
  const sudahGanti = siswa.user ? siswa.user.mustChangePassword === false : null;

  return (
    <>
    <AnimatePresence>
      <div className="fixed inset-0 z-100 hidden items-center justify-center p-4 lg:flex">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-800 sm:mx-0">

          <div className="relative shrink-0 overflow-hidden px-6 py-5" style={{ background: HEADER_GRADIENT }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/8" />

            <button onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
              <X size={15} />
            </button>

            <div className="relative flex items-center gap-4">
              <div className="rounded-full border border-white/40" style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.18)" }}>
                <Avatar
                  src={siswa.user?.fotoProfil}
                  nama={displayNama}
                  sizePx={64}
                  fallbackBg="rgba(255,255,255,0.22)"
                  textClassName="text-lg font-extrabold"
                />
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-[19px] font-extrabold leading-tight text-white">{displayNama}</h2>
                <p className="mt-1 font-mono text-xs text-white/70">NIS: {siswa.nis}</p>
                <span className="mt-2 inline-flex items-center rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  {kelasShort(siswa.kelas.nama)}
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    <Hash size={12} style={{ color: REF_PRIMARY }} />
                    Informasi Rekening
                  </p>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-700/50">
                    <FieldItem icon={Hash} label="NIS" value={siswa.nis} />
                    <FieldItem icon={GraduationCap} label="Kelas" value={kelasShort(siswa.kelas.nama)} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    <User size={12} style={{ color: REF_PRIMARY }} />
                    Informasi Pribadi
                  </p>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-700/50">
                    <FieldItem icon={CalendarDays} label="Tempat & Tanggal Lahir" value={tempatTanggal} full />
                    <FieldItem icon={User} label="Jenis Kelamin" value={siswa.jenisKelamin} />
                    <FieldItem icon={Phone} label="No. HP" value={siswa.noHp} href={waLink(siswa.noHp)} />
                    <FieldItem icon={MapPin} label="Alamat" value={alamatLengkap} full />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-white">
                    <KeyRound size={14} style={{ color: REF_PRIMARY }} />
                    Status Password
                  </div>
                  {sudahGanti === null ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Belum ada akun</span>
                  ) : sudahGanti ? (
                    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${REF_SUCCESS}26`, color: REF_SUCCESS }}>
                      <CheckCircle2 size={12} />
                      Sudah Ganti
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      <XCircle size={12} />
                      Masih NIS
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/30">
                  <ProgressRing percent={pct} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-white">Kelengkapan Data {pct}%</p>
                    {missing.length === 0 ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={11} /> Semua data sudah lengkap
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                        Belum lengkap: {missing.map((m) => m.label).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: REF_PRIMARY }}>
                    <GraduationCap size={12} />
                    Informasi Sekolah
                  </p>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl p-3" style={{ borderWidth: 1, borderColor: `${REF_PRIMARY}33`, backgroundColor: `${REF_PRIMARY}0d` }}>
                    <FieldItem icon={BookOpen} label="Jurusan" value={siswa.jurusan} full />
                    <FieldItem icon={GraduationCap} label="Angkatan" value={String(siswa.angkatan)} />
                    <FieldItem icon={UserCheck} label="Wali Kelas" value={waliKelas} full />
                    <FieldItem icon={Users} label="Nama Orang Tua" value={siswa.namaOrtu} full />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-3.5 dark:border-slate-700/50 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button" onClick={onClose}
                className="flex items-center justify-center rounded-lg border-2 border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:py-1.5 sm:text-xs"
              >
                <X size={12} className="mr-1" /> Tutup
              </button>
              {onEdit && (
                <motion.button
                  type="button" onClick={onEdit}
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(0,100,224,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-bold text-white shadow-sm sm:py-1.5 sm:text-xs"
                  style={{ background: HEADER_GRADIENT }}
                >
                  <Pencil size={12} /> Edit Data
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>

    <AnimatePresence>
      <MobileDetailModal onClose={onClose} accent={HEADER_GRADIENT} className="lg:hidden">
        <div className="relative px-6 pb-8 pt-10 text-center">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/8" />
          <div className="relative mx-auto w-fit rounded-full border border-white/40" style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.18)" }}>
            <Avatar src={siswa.user?.fotoProfil} nama={displayNama} sizePx={64} fallbackBg="rgba(255,255,255,0.22)" textClassName="text-lg font-extrabold" />
          </div>
          <h2 className="relative mt-3 break-words text-lg font-extrabold text-white">{displayNama}</h2>
          <p className="relative mt-1 font-mono text-xs text-white/70">NIS: {siswa.nis}</p>
          <span className="relative mt-2 inline-flex items-center rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {kelasShort(siswa.kelas.nama)}
          </span>
        </div>

        <div className="relative -mt-4 rounded-t-3xl bg-white pb-6 pt-6 dark:bg-slate-800">
          <div className="mx-auto max-w-md space-y-2 px-6 text-left">
            <MobileRow icon={CalendarDays} label="Tempat & Tanggal Lahir" value={tempatTanggal} />
            <MobileRow icon={User} label="Jenis Kelamin" value={siswa.jenisKelamin} />
            <MobileRow icon={Phone} label="No. HP" value={siswa.noHp} href={waLink(siswa.noHp)} />
            <MobileRow icon={MapPin} label="Alamat" value={alamatLengkap} />

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-700/30">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <KeyRound size={13} style={{ color: REF_PRIMARY }} /> Status Password
              </span>
              {sudahGanti === null ? (
                <span className="text-xs font-bold text-slate-400">Belum ada akun</span>
              ) : sudahGanti ? (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: REF_SUCCESS }}>
                  <CheckCircle2 size={13} /> Sudah Ganti
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <XCircle size={13} /> Masih NIS
                </span>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-700/30">
              <div className="flex items-center gap-3">
                <ProgressRing percent={pct} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Kelengkapan Data {pct}%</p>
                  {missing.length === 0 ? (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={11} /> Semua data sudah lengkap
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      Belum lengkap: {missing.map((m) => m.label).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <MobileRow icon={BookOpen} label="Jurusan" value={siswa.jurusan} />
            <MobileRow icon={GraduationCap} label="Angkatan" value={String(siswa.angkatan)} />
            <MobileRow icon={UserCheck} label="Wali Kelas" value={waliKelas} />
            <MobileRow icon={Users} label="Nama Orang Tua" value={siswa.namaOrtu} />
          </div>

          {onEdit && (
            <div className="mx-auto mt-4 max-w-md px-6">
              <button type="button" onClick={onEdit}
                className="flex w-full items-center justify-center gap-1.5 rounded-full py-3.5 text-sm font-extrabold text-white shadow-sm"
                style={{ background: HEADER_GRADIENT }}>
                <Pencil size={14} /> Edit Data
              </button>
            </div>
          )}
        </div>
      </MobileDetailModal>
    </AnimatePresence>
    </>
  );
}
