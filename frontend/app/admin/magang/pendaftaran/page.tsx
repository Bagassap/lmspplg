"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Building2, CheckCircle2, ClipboardList, Loader2, MapPin, Phone, RotateCcw, Search, XCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { Avatar } from "@/components/shared/Avatar";
import { avatarColorFor, toTitleCase, waLink } from "@/components/data-siswa/shared";
import { DaftarInstansiList, useDaftarInstansi } from "@/components/magang/DaftarInstansiList";
import { TolakPendaftaranModal } from "@/components/magang/TolakPendaftaranModal";
import { pesanError } from "@/components/magang/pkl-form-ui";
import { STATUS_PENDAFTARAN_CFG, formatAlamat, type PendaftaranMagang, type StatusPendaftaran } from "@/components/magang/types";

const TABS: { value: StatusPendaftaran | ""; label: string }[] = [
  { value: "MENUNGGU", label: "Menunggu" },
  { value: "DITERIMA", label: "Terverifikasi" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "", label: "Semua" },
];

const namaSiswa = (p: PendaftaranMagang) => toTitleCase(p.siswa?.user?.nama ?? p.siswa?.nama ?? "—");

export default function AdminPendaftaranPklPage() {
  const toast = useToast();
  const instansi = useDaftarInstansi();
  const [list, setList] = useState<PendaftaranMagang[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusPendaftaran | "">("MENUNGGU");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tolakTarget, setTolakTarget] = useState<PendaftaranMagang | null>(null);

  const load = useCallback(() => {
    fetch("/api/magang/pendaftaran", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function aksi(p: PendaftaranMagang, jenis: "terima" | "tolak" | "batal-verifikasi", body?: object) {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/magang/pendaftaran/${p.id}/${jenis}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) { toast.error(pesanError(d, "Gagal memproses pendaftaran"), ""); return false; }
      if (Array.isArray(d)) setList(d);
      const pesan = { terima: "Pendaftaran diverifikasi", tolak: "Pendaftaran ditolak", "batal-verifikasi": "Verifikasi dibatalkan" }[jenis];
      toast.success(pesan, namaSiswa(p));
      return true;
    } finally {
      setBusyId(null);
    }
  }

  async function batalVerifikasi(p: PendaftaranMagang) {
    const ok = await toast.confirm("Batalkan verifikasi?", `Pendaftaran ${namaSiswa(p)} kembali berstatus menunggu.`, "Ya, batalkan");
    if (ok) await aksi(p, "batal-verifikasi");
  }

  const hitung = useMemo(() => ({
    MENUNGGU: list.filter((p) => p.status === "MENUNGGU").length,
    DITERIMA: list.filter((p) => p.status === "DITERIMA").length,
    DITOLAK: list.filter((p) => p.status === "DITOLAK").length,
    "": list.length,
  }), [list]);

  const tampil = useMemo(() => {
    const k = q.trim().toLowerCase();
    return list
      .filter((p) => (tab ? p.status === tab : true))
      .filter((p) => !k || namaSiswa(p).toLowerCase().includes(k) || (p.siswa?.nis ?? "").includes(k) || (p.siswa?.kelas?.nama ?? "").toLowerCase().includes(k))
      .sort((a, b) => (a.siswa?.kelas?.nama ?? "").localeCompare(b.siswa?.kelas?.nama ?? "", "id") || namaSiswa(a).localeCompare(namaSiswa(b), "id", { sensitivity: "base" }));
  }, [list, tab, q]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_20rem] lg:p-1">
      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"><ClipboardList size={18} /></span>
          <p className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Pendaftaran PKL</p>
        </div>

        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t.label} type="button" onClick={() => setTab(t.value)}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold ${tab === t.value ? "bg-[#3E03B3] text-white" : "bg-[#F1EDFA] text-[#3E03B3] dark:bg-slate-700 dark:text-[#C4B5FD]"}`}>
              {t.label}
              <span className={`rounded-lg px-1.5 text-[10px] ${tab === t.value ? "bg-white/20" : "bg-white dark:bg-slate-800"}`}>{hitung[t.value]}</span>
            </button>
          ))}
        </div>

        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, NIS, atau kelas…"
            className="h-10 w-full rounded-2xl border-0 bg-[#F1EDFA] pl-9 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400" />
        </div>

        <div className="space-y-2.5">
          {loading ? (
            [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#F1EDFA] dark:bg-slate-700" />)
          ) : tampil.length === 0 ? (
            <p className="rounded-2xl bg-[#F1EDFA] px-4 py-10 text-center text-sm font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">Tidak ada pendaftaran</p>
          ) : tampil.map((p) => {
            const cfg = STATUS_PENDAFTARAN_CFG[p.status];
            const wa = waLink(p.noWa);
            const busy = busyId === p.id;
            return (
              <div key={p.id} className="rounded-2xl bg-[#F1EDFA] p-3.5 dark:bg-slate-700">
                <div className="flex items-center gap-2.5">
                  <Avatar src={p.siswa?.user?.fotoProfil} nama={namaSiswa(p)} sizePx={36} fallbackBg={avatarColorFor(namaSiswa(p))} textClassName="text-[11px] font-extrabold" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{namaSiswa(p)}</p>
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300">{p.siswa?.kelas?.nama ?? "-"} · NIS {p.siswa?.nis ?? "-"}</p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-white px-2.5 py-1 text-[10px] font-bold dark:bg-slate-800" style={{ color: cfg.clr }}>{cfg.label}</span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-200">
                  <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> {formatAlamat(p)}</p>
                  <p className="flex items-center gap-1.5"><Phone size={12} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" />
                    {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{p.noWa}</a> : p.noWa}
                  </p>
                  <p className="flex items-center gap-1.5"><Building2 size={12} className="shrink-0 text-[#3E03B3] dark:text-[#C4B5FD]" /> {p.tempatMagang?.namaTempat ?? "Belum memilih tempat PKL"}</p>
                  {p.status === "DITOLAK" && p.alasanTolak && <p className="font-semibold text-[#E8562B]">Alasan ditolak: {p.alasanTolak}</p>}
                </div>
                {p.status === "MENUNGGU" && (
                  <div className="mt-2.5 flex gap-2">
                    <button type="button" onClick={() => setTolakTarget(p)} disabled={busy}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3.5 text-xs font-bold text-[#E8562B] disabled:opacity-50 dark:bg-slate-800">
                      <XCircle size={13} /> Tolak
                    </button>
                    <button type="button" onClick={() => aksi(p, "terima")} disabled={busy}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#3E03B3] text-xs font-bold text-white disabled:opacity-50">
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Verifikasi
                    </button>
                  </div>
                )}
                {p.status === "DITERIMA" && (
                  <button type="button" onClick={() => batalVerifikasi(p)} disabled={busy}
                    className="mt-2.5 flex h-9 items-center gap-1.5 rounded-xl bg-white px-3.5 text-xs font-bold text-[#3E03B3] disabled:opacity-50 dark:bg-slate-800 dark:text-[#C4B5FD]">
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Batalkan verifikasi
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DaftarInstansiList list={instansi.list} loading={instansi.loading} />

      <AnimatePresence>
        {tolakTarget && (
          <TolakPendaftaranModal nama={namaSiswa(tolakTarget)} onClose={() => setTolakTarget(null)}
            onTolak={async (alasan) => { if (await aksi(tolakTarget, "tolak", { alasan })) setTolakTarget(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
