"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Building2, ChevronRight, ClipboardList, Search, Users } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { PendaftarTempatModal, namaPendaftar } from "@/components/magang/PendaftarTempatModal";
import { DaftarInstansiList, useDaftarInstansi } from "@/components/magang/DaftarInstansiList";
import { TolakPendaftaranModal } from "@/components/magang/TolakPendaftaranModal";
import { pesanError } from "@/components/magang/pkl-form-ui";
import { STATUS_PENDAFTARAN_CFG, type PendaftaranMagang, type StatusPendaftaran } from "@/components/magang/types";

const TABS: { value: StatusPendaftaran | ""; label: string; bg: string; clr: string }[] = [
  { value: "MENUNGGU", label: "Menunggu", bg: STATUS_PENDAFTARAN_CFG.MENUNGGU.bg, clr: STATUS_PENDAFTARAN_CFG.MENUNGGU.clr },
  { value: "DITERIMA", label: "Terverifikasi", bg: STATUS_PENDAFTARAN_CFG.DITERIMA.bg, clr: STATUS_PENDAFTARAN_CFG.DITERIMA.clr },
  { value: "DITOLAK", label: "Ditolak", bg: STATUS_PENDAFTARAN_CFG.DITOLAK.bg, clr: STATUS_PENDAFTARAN_CFG.DITOLAK.clr },
  { value: "", label: "Semua", bg: "#E0F2FE", clr: "#0EA5E9" },
];

const namaSiswa = namaPendaftar;
const TANPA = "__tanpa__";

export default function AdminPendaftaranPklPage() {
  const toast = useToast();
  const instansi = useDaftarInstansi();
  const [list, setList] = useState<PendaftaranMagang[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusPendaftaran | "">("MENUNGGU");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tolakTarget, setTolakTarget] = useState<PendaftaranMagang | null>(null);
  const [bukaKey, setBukaKey] = useState<string | null>(null);

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

  const grup = useMemo(() => {
    const k = q.trim().toLowerCase();
    const map = new Map<string, { key: string; nama: string; rows: PendaftaranMagang[] }>();
    list
      .filter((p) => (tab ? p.status === tab : true))
      .filter((p) => !k
        || namaSiswa(p).toLowerCase().includes(k)
        || (p.siswa?.nis ?? "").includes(k)
        || (p.siswa?.kelas?.nama ?? "").toLowerCase().includes(k)
        || (p.tempatMagang?.namaTempat ?? "").toLowerCase().includes(k))
      .forEach((p) => {
        const key = p.tempatMagang?.id ?? TANPA;
        const g = map.get(key) ?? { key, nama: p.tempatMagang?.namaTempat ?? "Belum memilih tempat PKL", rows: [] };
        g.rows.push(p);
        map.set(key, g);
      });
    const cmpSiswa = (a: PendaftaranMagang, b: PendaftaranMagang) =>
      (a.siswa?.kelas?.nama ?? "").localeCompare(b.siswa?.kelas?.nama ?? "", "id") || namaSiswa(a).localeCompare(namaSiswa(b), "id", { sensitivity: "base" });
    return [...map.values()]
      .map((g) => ({ ...g, rows: g.rows.sort(cmpSiswa) }))
      .sort((a, b) => Number(a.key === TANPA) - Number(b.key === TANPA) || a.nama.localeCompare(b.nama, "id", { sensitivity: "base" }));
  }, [list, tab, q]);

  const grupBuka = bukaKey ? grup.find((g) => g.key === bukaKey) ?? null : null;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_20rem] lg:p-1">
      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#E0F2FE", color: "#0EA5E9" }}><ClipboardList size={18} /></span>
          <p className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">Pendaftaran PKL</p>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tempat, siswa, NIS, kelas…"
              className="h-10 w-full rounded-xl border-0 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400" />
          </div>
        </div>

        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const aktif = tab === t.value;
            return (
              <button key={t.label} type="button" onClick={() => setTab(t.value)}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-colors"
                style={aktif ? { background: t.clr, color: "#fff" } : { background: t.bg, color: t.clr }}>
                {t.label}
                <span className="rounded-lg px-1.5 text-[10px]" style={{ background: aktif ? "rgba(255,255,255,0.22)" : "#fff" }}>{hitung[t.value]}</span>
              </button>
            );
          })}
        </div>


        <div className="space-y-1.5">
          {loading ? (
            [0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)
          ) : grup.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">Tidak ada pendaftaran</p>
          ) : grup.map((g) => {
            const menunggu = g.rows.filter((r) => r.status === "MENUNGGU").length;
            return (
              <button key={g.key} type="button" onClick={() => setBukaKey(g.key)}
                className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={g.key === TANPA ? { background: "#FFF4E0", color: "#D97706" } : { background: "#E0F2FE", color: "#0EA5E9" }}>
                  <Building2 size={15} />
                </span>
                <p className={`min-w-0 flex-1 truncate text-sm font-bold ${g.key === TANPA ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-white"}`}>{g.nama}</p>
                {menunggu > 0 && (
                  <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: STATUS_PENDAFTARAN_CFG.MENUNGGU.bg, color: STATUS_PENDAFTARAN_CFG.MENUNGGU.clr }}>{menunggu} menunggu</span>
                )}
                <span className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: "#E4F5EC", color: "#22A06B" }}>
                  <Users size={11} /> {g.rows.length}
                </span>
                <ChevronRight size={16} className="shrink-0 text-[#F26A3D]" />
              </button>
            );
          })}
        </div>
      </div>

      <DaftarInstansiList list={instansi.list} loading={instansi.loading} />

      <AnimatePresence>
        {grupBuka && (
          <PendaftarTempatModal judul={grupBuka.nama} rows={grupBuka.rows} busyId={busyId}
            onTerima={(p) => aksi(p, "terima")} onTolak={setTolakTarget} onBatal={batalVerifikasi}
            onClose={() => setBukaKey(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tolakTarget && (
          <TolakPendaftaranModal nama={namaSiswa(tolakTarget)} onClose={() => setTolakTarget(null)}
            onTolak={async (alasan) => { if (await aksi(tolakTarget, "tolak", { alasan })) setTolakTarget(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
