"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, ClipboardList, Clock, Search, Users, XCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { PendaftarTempatModal, namaPendaftar } from "@/components/magang/PendaftarTempatModal";
import { DaftarInstansiList, useDaftarInstansi } from "@/components/magang/DaftarInstansiList";
import { StatusFilterCard, type StatusFilterItem } from "@/components/magang/StatusFilterCard";
import { TolakPendaftaranModal } from "@/components/magang/TolakPendaftaranModal";
import { pesanError } from "@/components/magang/pkl-form-ui";
import { STATUS_PENDAFTARAN_CFG, formatAlamat, type PendaftaranMagang, type StatusPendaftaran } from "@/components/magang/types";

const TABS: Omit<StatusFilterItem<StatusPendaftaran | "">, "count">[] = [
  { value: "MENUNGGU", label: "Menunggu", bg: STATUS_PENDAFTARAN_CFG.MENUNGGU.bg, clr: STATUS_PENDAFTARAN_CFG.MENUNGGU.clr, icon: Clock },
  { value: "DITERIMA", label: "Terverifikasi", bg: STATUS_PENDAFTARAN_CFG.DITERIMA.bg, clr: STATUS_PENDAFTARAN_CFG.DITERIMA.clr, icon: CheckCircle2 },
  { value: "DITOLAK", label: "Ditolak", bg: STATUS_PENDAFTARAN_CFG.DITOLAK.bg, clr: STATUS_PENDAFTARAN_CFG.DITOLAK.clr, icon: XCircle },
  { value: "", label: "Semua", bg: "#E0F2FE", clr: "#0EA5E9", icon: Users },
];

const namaSiswa = namaPendaftar;
const TANPA = "__tanpa__";
const GRID_COLS = "2.5rem minmax(9rem,1fr) minmax(12rem,1.6fr) minmax(8rem,auto) 9.5rem";

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
    const map = new Map<string, { key: string; nama: string; alamat: string; rows: PendaftaranMagang[] }>();
    list
      .filter((p) => (tab ? p.status === tab : true))
      .filter((p) => !k
        || namaSiswa(p).toLowerCase().includes(k)
        || (p.siswa?.nis ?? "").includes(k)
        || (p.siswa?.kelas?.nama ?? "").toLowerCase().includes(k)
        || (p.tempatMagang?.namaTempat ?? "").toLowerCase().includes(k))
      .forEach((p) => {
        const key = p.tempatMagang?.id ?? TANPA;
        const g = map.get(key) ?? { key, nama: p.tempatMagang?.namaTempat ?? "Belum memilih tempat PKL", alamat: p.tempatMagang ? formatAlamat(p.tempatMagang) : "-", rows: [] };
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
    <div className="grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)_17rem] xl:grid-cols-[15rem_minmax(0,1fr)_20rem] lg:p-1">
      <StatusFilterCard items={TABS.map((t) => ({ ...t, count: hitung[t.value] }))} value={tab} onChange={setTab} />

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



        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid items-center gap-3 px-4 py-3" style={{ gridTemplateColumns: GRID_COLS, backgroundColor: "#0F172A" }}>
                <span className="text-center text-[10px] font-bold uppercase tracking-wider text-white">No</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Nama Tempat</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Alamat</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Status</span>
                <span className="text-right text-[10px] font-bold uppercase tracking-wider text-white">Siswa</span>
              </div>
              {loading ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)}
                </div>
              ) : grup.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Tidak ada pendaftaran</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {grup.map((g, idx) => {
                    const jumlah = (st: StatusPendaftaran) => g.rows.filter((r) => r.status === st).length;
                    const tanpa = g.key === TANPA;
                    return (
                      <div key={g.key} className="grid items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        style={{ gridTemplateColumns: GRID_COLS }}>
                        <span className="text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                        <p className={`truncate text-sm font-bold ${tanpa ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-white"}`} title={g.nama}>{g.nama}</p>
                        <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300" title={g.alamat}>{g.alamat}</p>
                        <div className="flex flex-wrap gap-1">
                          {(["MENUNGGU", "DITERIMA", "DITOLAK"] as StatusPendaftaran[]).map((st) => {
                            const n = jumlah(st);
                            if (!n) return null;
                            const cfg = STATUS_PENDAFTARAN_CFG[st];
                            return (
                              <span key={st} className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.clr }}>
                                {n} {st === "MENUNGGU" ? "menunggu" : st === "DITERIMA" ? "terverifikasi" : "ditolak"}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex justify-end">
                          <button type="button" onClick={() => setBukaKey(g.key)}
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#3E03B3] px-3 text-xs font-bold text-white">
                            <Users size={13} /> Lihat siswa ({g.rows.length})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
          <TolakPendaftaranModal onClose={() => setTolakTarget(null)}
            onTolak={async (alasan) => { if (await aksi(tolakTarget, "tolak", { alasan })) setTolakTarget(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
