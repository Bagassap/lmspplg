"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Briefcase, Building2, CheckCircle2, Clock, Loader2, MapPin, Phone, Plus, Search, Send, User, UserPlus, Users, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { toTitleCase } from "@/components/data-siswa/shared";
import { STATUS_PENEMPATAN_CFG } from "./types";
import type { PenempatanMagang } from "./types";

type Pilihan = { id: string; namaTempat: string; kuota: number; terisi: number; sisa: number };
type Rekan = { id: string; nis: string; nama: string | null; kelas: { id: string; nama: string } | null; user: { nama: string } | null };
type Me = { nama: string; siswa?: { kelas?: { nama: string } | null } | null };

const LAINNYA = "__lainnya__";
const FIELD = "h-11 w-full rounded-2xl border-0 bg-[#F1EDFA] px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:text-slate-100";
const CAP = "mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

function RekanPicker({ terpilih, onPick, onRemove, excludeIds }: {
  terpilih: Rekan | null; onPick: (r: Rekan) => void; onRemove: () => void; excludeIds: string[];
}) {
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<Rekan[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/magang/penempatan/rekan?q=${encodeURIComponent(q)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setHasil(Array.isArray(d) ? d.filter((x: Rekan) => !excludeIds.includes(x.id)) : []))
        .catch(() => setHasil([]));
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q, open, excludeIds]);

  if (terpilih) {
    return (
      <div className="flex h-11 items-center gap-2 rounded-2xl bg-[#F1EDFA] pl-4 pr-1.5">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-slate-100">
          {toTitleCase(terpilih.user?.nama ?? terpilih.nama ?? "Siswa")} <span className="font-medium text-slate-600">· {terpilih.kelas?.nama}</span>
        </p>
        <button type="button" onClick={onRemove} aria-label="Hapus" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#E8562B]"><X size={14} /></button>
      </div>
    );
  }
  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder="Cari nama atau NIS rekan…" className={`${FIELD} pl-9`} />
      {open && (
        <div className="absolute inset-x-0 top-12 z-20 max-h-56 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(62,3,179,0.35)] dark:bg-slate-800">
          {hasil.length === 0 ? (
            <p className="px-3 py-3 text-xs font-semibold text-slate-600">Tidak ada siswa yang tersedia</p>
          ) : hasil.map((r) => (
            <button key={r.id} type="button" onClick={() => { onPick(r); setOpen(false); setQ(""); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-[#F1EDFA]">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-slate-100">{toTitleCase(r.user?.nama ?? r.nama ?? "Siswa")}</span>
              <span className="shrink-0 text-xs text-slate-600">{r.kelas?.nama} · {r.nis}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Halaman PKL siswa sebelum penempatan aktif: formulir pengajuan, atau status menunggu guru pembimbing. */
export function PengajuanPklPage({ list, onChanged }: { list: PenempatanMagang[]; onChanged: () => void }) {
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [tempat, setTempat] = useState<Pilihan[]>([]);
  const [pilih, setPilih] = useState("");
  const [rekan, setRekan] = useState<(Rekan | null)[]>([]);
  const [baru, setBaru] = useState({ namaTempat: "", dukuh: "", desa: "", kecamatan: "", kabupaten: "", bidangUsaha: "", namaPimpinan: "", noWaUsaha: "" });
  const [saving, setSaving] = useState(false);

  const menunggu = list.filter((p) => p.status === "MENUNGGU");
  const riwayat = list.filter((p) => p.status === "SELESAI" || p.status === "BATAL");

  const load = useCallback(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then(setMe).catch(() => {});
    fetch("/api/magang/tempat/pilihan", { cache: "no-store" }).then((r) => r.json()).then((d) => setTempat(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => { if (menunggu.length === 0) load(); }, [load, menunggu.length]);

  const terpilih = tempat.find((t) => t.id === pilih);
  const modeBaru = pilih === LAINNYA;
  const maksRekan = modeBaru ? 4 : Math.max(0, (terpilih?.sisa ?? 1) - 1);
  const bolehTambah = modeBaru || (!!terpilih && terpilih.sisa > 1);
  const excludeIds = rekan.filter((r): r is Rekan => !!r).map((r) => r.id);

  function onPilih(v: string) {
    setPilih(v);
    setRekan((prev) => {
      const maks = v === LAINNYA ? 4 : Math.max(0, (tempat.find((t) => t.id === v)?.sisa ?? 1) - 1);
      return prev.slice(0, maks);
    });
  }

  async function kirim() {
    if (!pilih) { toast.error("Pilih tempat magang", ""); return; }
    if (modeBaru) {
      const kosong = (Object.keys(baru) as (keyof typeof baru)[]).find((k) => !baru[k].trim());
      if (kosong) { toast.error("Lengkapi data tempat magang", "Semua kolom tempat baru wajib diisi."); return; }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/magang/penempatan/ajukan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(modeBaru ? { tempatBaru: baru } : { tempatMagangId: pilih }),
          rekanSiswaIds: rekan.filter((r): r is Rekan => !!r).map((r) => r.id),
        }),
      });
      if (res.ok) {
        toast.success("Pengajuan terkirim", "Menunggu admin menetapkan guru pembimbing.");
        onChanged();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ? String(Array.isArray(d.message) ? d.message[0] : d.message) : "Gagal mengirim pengajuan", "");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 lg:p-1">
      <div className="hidden rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800 lg:block">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#3E03B3] text-white"><Briefcase size={26} /></span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">PKL</span>
            <h1 className="text-2xl font-extrabold leading-tight text-slate-800 dark:text-white">Penempatan PKL Saya</h1>
          </div>
        </div>
      </div>

      {menunggu.length > 0 ? (
        <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFE9E2] text-[#E8562B]"><Clock size={22} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">Pengajuan terkirim</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Menunggu admin menetapkan guru pembimbing. Menu PKL lainnya terbuka setelah itu.</p>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: STATUS_PENEMPATAN_CFG.MENUNGGU.bg, color: STATUS_PENEMPATAN_CFG.MENUNGGU.clr }}>
              {STATUS_PENEMPATAN_CFG.MENUNGGU.label}
            </span>
          </div>
          <div className="mt-4 space-y-2 rounded-2xl bg-[#F1EDFA] p-3.5 text-sm text-slate-800">
            <p className="flex items-center gap-2 font-bold"><Building2 size={15} className="text-[#3E03B3]" /> {menunggu[0].tempatMagang.namaTempat}</p>
            {menunggu[0].tempatMagang.alamat && <p className="flex items-start gap-2 text-xs"><MapPin size={14} className="mt-0.5 shrink-0 text-[#3E03B3]" /> {menunggu[0].tempatMagang.alamat}</p>}
            {menunggu[0].tempatMagang.namaPimpinan && <p className="flex items-center gap-2 text-xs"><User size={14} className="text-[#3E03B3]" /> {menunggu[0].tempatMagang.namaPimpinan}</p>}
            {menunggu[0].tempatMagang.noWaUsaha && <p className="flex items-center gap-2 text-xs"><Phone size={14} className="text-[#3E03B3]" /> {menunggu[0].tempatMagang.noWaUsaha}</p>}
            <p className="flex items-center gap-2 text-xs"><Users size={14} className="text-[#3E03B3]" /> Diajukan {fmt(menunggu[0].createdAt)}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <p className="text-base font-extrabold text-slate-900 dark:text-white">Ajukan tempat PKL</p>
          <p className="mb-4 text-xs text-slate-600 dark:text-slate-300">Pilih tempat magang yang ingin kamu tempati. Admin akan menetapkan guru pembimbing setelah pengajuan masuk.</p>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={CAP}>Nama</label>
                <input readOnly value={me?.nama ?? ""} className={`${FIELD} opacity-100`} />
              </div>
              <div>
                <label className={CAP}>Kelas</label>
                <input readOnly value={me?.siswa?.kelas?.nama ?? ""} className={FIELD} />
              </div>
            </div>

            {rekan.map((r, i) => (
              <div key={i}>
                <label className={CAP}>Siswa {i + 2}</label>
                <RekanPicker terpilih={r} excludeIds={excludeIds}
                  onPick={(x) => setRekan((prev) => prev.map((p, idx) => (idx === i ? x : p)))}
                  onRemove={() => setRekan((prev) => prev.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            {bolehTambah && rekan.length < maksRekan && (
              <button type="button" onClick={() => setRekan((p) => [...p, null])}
                className="flex h-10 items-center gap-1.5 rounded-full bg-[#F1EDFA] px-4 text-xs font-bold text-[#3E03B3]">
                <UserPlus size={14} /> Tambah siswa
              </button>
            )}

            <div>
              <label className={CAP}>Tempat magang</label>
              <select value={pilih} onChange={(e) => onPilih(e.target.value)} className={FIELD}>
                <option value="">Pilih tempat magang…</option>
                {tempat.filter((t) => t.sisa > 0).map((t) => (
                  <option key={t.id} value={t.id}>{t.namaTempat} (sisa kuota {t.sisa})</option>
                ))}
                <option value={LAINNYA}>Lainnya (isi sendiri)…</option>
              </select>
            </div>

            {modeBaru && (
              <div className="space-y-3 rounded-2xl bg-[#F1EDFA] p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800"><Plus size={13} className="text-[#3E03B3]" /> Data tempat magang baru</p>
                <div>
                  <label className={CAP}>Nama tempat</label>
                  <input value={baru.namaTempat} onChange={(e) => setBaru({ ...baru, namaTempat: e.target.value })} placeholder="Nama perusahaan / instansi" className={`${FIELD} !bg-white`} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([["dukuh", "Dukuh"], ["desa", "Desa"], ["kecamatan", "Kecamatan"], ["kabupaten", "Kabupaten"]] as const).map(([k, l]) => (
                    <div key={k}>
                      <label className={CAP}>{l}</label>
                      <input value={baru[k]} onChange={(e) => setBaru({ ...baru, [k]: e.target.value })} className={`${FIELD} !bg-white`} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className={CAP}>Bidang usaha</label>
                  <input value={baru.bidangUsaha} onChange={(e) => setBaru({ ...baru, bidangUsaha: e.target.value })} placeholder="Contoh: Pengembangan perangkat lunak" className={`${FIELD} !bg-white`} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={CAP}>Nama pimpinan</label>
                    <input value={baru.namaPimpinan} onChange={(e) => setBaru({ ...baru, namaPimpinan: e.target.value })} className={`${FIELD} !bg-white`} />
                  </div>
                  <div>
                    <label className={CAP}>Nomor WA usaha</label>
                    <input inputMode="tel" value={baru.noWaUsaha} onChange={(e) => setBaru({ ...baru, noWaUsaha: e.target.value })} placeholder="08xxxxxxxxxx" className={`${FIELD} !bg-white`} />
                  </div>
                </div>
              </div>
            )}

            <button type="button" onClick={kirim} disabled={saving || !pilih}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3E03B3] text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Ajukan PKL
            </button>
          </div>
        </div>
      )}

      {riwayat.length > 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <p className="mb-2 text-sm font-bold text-slate-800 dark:text-white">Riwayat Penempatan</p>
          <div className="space-y-2">
            {riwayat.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-2xl bg-[#F1EDFA] px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{p.tempatMagang.namaTempat}</p>
                  <p className="text-xs text-slate-600">{fmt(p.tanggalMulai)}</p>
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: STATUS_PENEMPATAN_CFG[p.status].bg, color: STATUS_PENEMPATAN_CFG[p.status].clr }}>
                  <CheckCircle2 size={10} className="mr-1 inline" />{STATUS_PENEMPATAN_CFG[p.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
