"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Building2, ChevronLeft, Clock, FileDown, FileText, Loader2, Search, Trash2, Users } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

import { KelolaTempatModal } from "@/components/magang/KelolaTempatModal";
import { TetapkanGuruModal } from "@/components/magang/TetapkanGuruModal";
import { PenempatanTempatModal } from "@/components/magang/PenempatanTempatModal";
import { FormSiswaModal } from "@/components/magang/FormSiswaModal";
import { PengajuanPklModal } from "@/components/magang/PengajuanPklModal";
import { EditPenempatanModal } from "@/components/magang/EditPenempatanModal";
import type { PenempatanStatusFilter } from "@/components/magang/PenempatanFilterBar";
import { KuotaTerpenuhiChip } from "@/components/magang/KuotaTerpenuhiChip";
import { StatusFilterCard, type StatusFilterItem } from "@/components/magang/StatusFilterCard";
import { formatAlamat, type PendaftaranMagang, type TempatMagang, type PenempatanMagang, type StatusPenempatan } from "@/components/magang/types";
import { namaSiswa } from "@/lib/nama";
import { useAutoRefresh } from "@/lib/useAutoRefresh";

type GuruOption = { id: string; user: { id: string; nama: string } };

const CHIP_STATUS: { value: StatusPenempatan; label: string; bg: string; clr: string }[] = [
  { value: "MENUNGGU", label: "menunggu", bg: "#F1EDFA", clr: "#3E03B3" },
  { value: "AKTIF", label: "aktif", bg: "#E4F5EC", clr: "#22A06B" },
  { value: "SELESAI", label: "selesai", bg: "#FFF4E0", clr: "#D97706" },
  { value: "BATAL", label: "batal", bg: "#FEE2E2", clr: "#DC2626" },
];

const GRID_COLS = "2.5rem minmax(9rem,1fr) minmax(10rem,1.3fr) minmax(8rem,auto) 24rem";

const STATUS_FILTER: Omit<StatusFilterItem<PenempatanStatusFilter>, "count">[] = [
  { value: "MENUNGGU", label: "Perlu diproses", bg: "#F1EDFA", clr: "#3E03B3", icon: Clock },
  { value: "", label: "Semua", bg: "#E0F2FE", clr: "#0EA5E9", icon: Users },
];

export default function AdminMagangPenempatanPage() {
  const router = useRouter();
  const toast = useToast();
  const [tempatList, setTempatList] = useState<TempatMagang[]>([]);
  const [penempatanList, setPenempatanList] = useState<PenempatanMagang[]>([]);
  const [guruList, setGuruList] = useState<GuruOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKelolaTempat, setShowKelolaTempat] = useState(false);
  const [tetapkanRows, setTetapkanRows] = useState<PenempatanMagang[] | null>(null);
  const [pengajuanRows, setPengajuanRows] = useState<PenempatanMagang[] | null>(null);
  const [editTarget, setEditTarget] = useState<PenempatanMagang | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PenempatanStatusFilter>("");
  const [bukaTempat, setBukaTempat] = useState<string | null>(null);
  const [terverifikasi, setTerverifikasi] = useState<PendaftaranMagang[]>([]);
  const [unduhId, setUnduhId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [formTempat, setFormTempat] = useState<string | null>(null);

  const loadTempat = useCallback(async () => {
    const res = await fetch("/api/magang/tempat", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setTempatList(Array.isArray(list) ? list : []);
  }, []);

  const loadTerverifikasi = useCallback(async () => {
    const res = await fetch("/api/magang/pendaftaran?status=DITERIMA", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setTerverifikasi(Array.isArray(list) ? list : []);
  }, []);

  async function hapusInstansi(g: { id: string; nama: string; rows: PenempatanMagang[]; terdaftar: number; belum: PendaftaranMagang[] }) {
    const ket = g.rows.length > 0
      ? `"${g.nama}" beserta ${g.rows.length} data penempatan siswa di dalamnya akan dihapus permanen.`
      : `"${g.nama}" akan dihapus permanen.`;
    const ok = await toast.confirm("Hapus instansi ini?", ket);
    if (!ok) return;
    setHapusId(g.id);
    try {
      const res = await fetch(`/api/magang/tempat/${g.id}?paksa=1`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Instansi dihapus", g.nama);
        loadPenempatan(); loadTempat(); loadTerverifikasi();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menghapus instansi", "");
      }
    } finally {
      setHapusId(null);
    }
  }

  async function unduhSurat(id: string) {
    setUnduhId(id);
    try {
      const res = await fetch(`/api/magang/tempat/${id}/surat-permohonan`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal membuat surat permohonan", "");
        return;
      }
      const blob = await res.blob();
      const nama = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "Surat_Permohonan_PKL.docx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setUnduhId(null);
    }
  }

  const loadPenempatan = useCallback(async () => {
    const res = await fetch("/api/magang/penempatan", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setPenempatanList(Array.isArray(list) ? list : []);
  }, []);

  const loadGuru = useCallback(async () => {
    const res = await fetch("/api/kelas/guru-list", { cache: "no-store" });
    const list = await res.json().catch(() => []);
    setGuruList(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTempat(), loadPenempatan(), loadGuru(), loadTerverifikasi()]).finally(() => setLoading(false));
  }, [loadTempat, loadPenempatan, loadGuru, loadTerverifikasi]);
  const segarkan = useCallback(() => { loadTempat(); loadPenempatan(); loadTerverifikasi(); }, [loadTempat, loadPenempatan, loadTerverifikasi]);
  useAutoRefresh(segarkan);

  async function ubahStatus(p: PenempatanMagang, status: StatusPenempatan) {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/magang/penempatan/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success("Status penempatan diperbarui", ""); loadPenempatan(); loadTempat(); }
      else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal mengubah status", "");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function hapus(p: PenempatanMagang) {
    const nama = namaSiswa(p.siswa.nama ?? p.siswa.user?.nama ?? "—");
    const ok = await toast.confirm(
      "Hapus penempatan ini?",
      `Penempatan ${nama} di "${p.tempatMagang.namaTempat}" akan dihapus.`,
    );
    if (!ok) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/magang/penempatan/${p.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Penempatan dihapus", ""); loadPenempatan(); loadTempat(); }
      else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menghapus penempatan", "");
      }
    } finally {
      setBusyId(null);
    }
  }

  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const nm = (p: PenempatanMagang) => (p.siswa.nama ?? p.siswa.user?.nama ?? "").toLowerCase();
    const cmp = (a: string, b: string) => a.localeCompare(b, "id");
    return penempatanList
      .filter((p) => (statusFilter ? p.status === statusFilter : true))
      .filter((p) => {
        if (!q) return true;
        const nama = (p.siswa.nama ?? p.siswa.user?.nama ?? "").toLowerCase();
        return nama.includes(q) || p.siswa.nis.includes(q) || p.tempatMagang.namaTempat.toLowerCase().includes(q) || (p.guruPembimbing?.user.nama ?? "").toLowerCase().includes(q) || p.siswa.kelas.nama.toLowerCase().includes(q);
      })
      .sort((a, b) =>
        cmp(a.tempatMagang.namaTempat, b.tempatMagang.namaTempat)
        || cmp(a.guruPembimbing?.user.nama ?? "\uffff", b.guruPembimbing?.user.nama ?? "\uffff")
        || cmp(nm(a), nm(b)));
  }, [penempatanList, search, statusFilter]);

  const grup = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; alamat: string; rows: PenempatanMagang[]; terdaftar: number; belum: PendaftaranMagang[] }>();
    displayList.forEach((p) => {
      const g = map.get(p.tempatMagang.id) ?? { id: p.tempatMagang.id, nama: p.tempatMagang.namaTempat, alamat: formatAlamat(p.tempatMagang), rows: [], terdaftar: 0, belum: [] };
      g.rows.push(p);
      map.set(p.tempatMagang.id, g);
    });
    const q = search.trim().toLowerCase();
    const sudahIsi = new Set(penempatanList.filter((p) => p.status === "MENUNGGU" || p.status === "AKTIF").map((p) => p.siswa.id));
    terverifikasi.forEach((d) => {
      const t = d.tempatMagang;
      if (!t || (d.siswa && sudahIsi.has(d.siswa.id))) return;
      if (!map.has(t.id)) {
        if (statusFilter) return;
        if (q && !t.namaTempat.toLowerCase().includes(q)) return;
      }
      const g = map.get(t.id) ?? { id: t.id, nama: t.namaTempat, alamat: formatAlamat(t), rows: [], terdaftar: 0, belum: [] };
      g.terdaftar += 1;
      g.belum.push(d);
      map.set(t.id, g);
    });
    const urut: Record<string, number> = { MENUNGGU: 0, AKTIF: 1, SELESAI: 2, BATAL: 3 };
    return [...map.values()]
      .map((g) => ({ ...g, rows: [...g.rows].sort((a, b) => urut[a.status] - urut[b.status]) }))
      .sort((a, b) => Number(b.rows.some((r) => r.status === "MENUNGGU")) - Number(a.rows.some((r) => r.status === "MENUNGGU"))
        || a.nama.localeCompare(b.nama, "id", { sensitivity: "base" }));
  }, [displayList, terverifikasi, search, statusFilter, penempatanList]);

  const grupForm = formTempat ? grup.find((g) => g.id === formTempat) ?? null : null;
  const grupBuka = bukaTempat ? grup.find((g) => g.id === bukaTempat) ?? null : null;
  const tempatPenuh = useMemo(() => new Set(tempatList.filter((t) => t.penuh).map((t) => t.id)), [tempatList]);

  return (
    <div className="lg:p-1">

      <div className="relative -mx-4 -mt-4 lg:hidden" style={{ background: "#3E03B3" }}>
        <div data-pkl-header className="app-header-row relative flex items-center px-4 pb-3 pt-4">
          <button type="button" onClick={() => router.push("/admin/dashboard")}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white active:bg-white/25">
            <ChevronLeft size={18} />
          </button>
          <h1 className="absolute inset-x-0 text-center text-base font-bold text-white">Penempatan PKL</h1>
        </div>
        <div className="h-7 rounded-t-[28px] bg-surface dark:bg-[#0F172A]" />
      </div>

      <div className="mt-0 grid items-start gap-5 lg:mt-5 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]">
      <StatusFilterCard
        items={STATUS_FILTER.map((w) => ({ ...w, count: w.value ? penempatanList.filter((p) => p.status === w.value).length : penempatanList.length }))}
        value={statusFilter} onChange={setStatusFilter}
        aksi={
          <button type="button" onClick={() => setShowKelolaTempat(true)}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#FFE9E2] text-xs font-bold text-[#E8562B]">
            <Building2 size={14} /> Kelola Tempat
          </button>
        } />

      <div className="min-w-0 lg:rounded-3xl lg:bg-white lg:p-5 lg:shadow-sm lg:dark:bg-slate-800">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FFE9E2", color: "#E8562B" }}><Building2 size={18} /></span>
          <p className="min-w-0 flex-1 text-base font-extrabold text-slate-900 dark:text-white">
            Daftar Penempatan <span className="font-medium text-slate-400 dark:text-slate-500">({grup.length})</span>
          </p>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tempat, siswa, NIS…"
              className="h-10 w-full rounded-xl border-0 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3E03B3] dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400" />
          </div>
        </div>

        <div className="space-y-2 md:hidden">
          {loading ? (
            [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700" />)
          ) : grup.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Tidak ada penempatan yang ditemukan</p>
          ) : grup.map((g) => (
            <div key={g.id} className="rounded-3xl bg-white p-3.5 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{g.nama}</p>
                  {g.alamat !== "-" && <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{g.alamat}</p>}
                </div>
                <button type="button" onClick={() => hapusInstansi(g)} disabled={hapusId === g.id} aria-label="Hapus instansi"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626] disabled:opacity-50">
                  {hapusId === g.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {tempatPenuh.has(g.id) && <KuotaTerpenuhiChip />}
                {g.terdaftar > 0 && (
                  <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: "#FFF4E0", color: "#D97706" }}>{g.terdaftar} menunggu form</span>
                )}
                {CHIP_STATUS.map((w) => {
                  const n = g.rows.filter((r) => r.status === w.value).length;
                  if (!n) return null;
                  return <span key={w.value} className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: w.bg, color: w.clr }}>{n} {w.label}</span>;
                })}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => unduhSurat(g.id)} disabled={unduhId === g.id}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#22A06B] text-xs font-bold text-white disabled:opacity-50">
                  {unduhId === g.id ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} Unduh surat
                </button>
                <button type="button" onClick={() => setBukaTempat(g.id)} disabled={g.rows.length === 0}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#3E03B3] text-xs font-bold text-white disabled:opacity-40">
                  <Users size={13} /> Siswa ({g.rows.length})
                </button>
                <button type="button" onClick={() => setFormTempat(g.id)}
                  className="col-span-2 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#E0F2FE] text-xs font-bold text-[#0369A1] dark:text-[#7DD3FC]">
                  <FileText size={13} /> Lihat form
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700 md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            <div className="grid items-center gap-3 px-4 py-3" style={{ gridTemplateColumns: GRID_COLS, backgroundColor: "#0F172A" }}>
              <span className="text-center text-[10px] font-bold uppercase tracking-wider text-white">No</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Nama Tempat</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Alamat</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Status</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Aksi</span>
            </div>
            {loading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)}
              </div>
            ) : grup.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Tidak ada penempatan yang ditemukan</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {grup.map((g, idx) => (
                  <div key={g.id} className="grid items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    style={{ gridTemplateColumns: GRID_COLS }}>
                    <span className="text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-white" title={g.nama}>{g.nama}</p>
                    <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300" title={g.alamat}>{g.alamat}</p>
                    <div className="flex flex-wrap gap-1">
                      {tempatPenuh.has(g.id) && <KuotaTerpenuhiChip />}
                      {g.terdaftar > 0 && (
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: "#FFF4E0", color: "#D97706" }}>
                          {g.terdaftar} menunggu form
                        </span>
                      )}
                      {CHIP_STATUS.map((w) => {
                        const n = g.rows.filter((r) => r.status === w.value).length;
                        if (!n) return null;
                        return (
                          <span key={w.value} className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: w.bg, color: w.clr }}>
                            {n} {w.label}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center justify-start gap-1.5">
                      <button type="button" onClick={() => unduhSurat(g.id)} disabled={unduhId === g.id}
                        title="Unduh surat permohonan (Word)"
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-[#22A06B] px-3 text-xs font-bold text-white disabled:opacity-50">
                        {unduhId === g.id ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} Unduh surat
                      </button>
                      <button type="button" onClick={() => setBukaTempat(g.id)} disabled={g.rows.length === 0}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-[#3E03B3] px-3 text-xs font-bold text-white disabled:opacity-40">
                        <Users size={13} /> Siswa ({g.rows.length})
                      </button>
                      <button type="button" onClick={() => setFormTempat(g.id)}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-[#E0F2FE] px-3 text-xs font-bold text-[#0369A1] dark:text-[#7DD3FC]">
                        <FileText size={13} /> Lihat form
                      </button>
                      <button type="button" onClick={() => hapusInstansi(g)} disabled={hapusId === g.id}
                        title="Hapus instansi" aria-label="Hapus instansi"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626] disabled:opacity-50">
                        {hapusId === g.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      </div>

      <AnimatePresence>
        {grupForm && (
          <FormSiswaModal judul={grupForm.nama} terkirim={grupForm.rows} belum={grupForm.belum}
            onLihat={(p) => setPengajuanRows([p])} onClose={() => setFormTempat(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {grupBuka && (
          <PenempatanTempatModal judul={grupBuka.nama} rows={grupBuka.rows} busyId={busyId}
            onPeriksa={(p) => setPengajuanRows([p])} onTetapkanGuru={setTetapkanRows}
            onUbahStatus={ubahStatus} onEdit={setEditTarget} onHapus={hapus}
            onClose={() => setBukaTempat(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showKelolaTempat && (
          <KelolaTempatModal
            tempatList={tempatList}
            onClose={() => setShowKelolaTempat(false)}
            onSaved={loadTempat}
          />
        )}
        {pengajuanRows && (
          <PengajuanPklModal
            rows={pengajuanRows}
            guruList={guruList}
            onClose={() => setPengajuanRows(null)}
            onSaved={() => { loadPenempatan(); loadTempat(); }}
          />
        )}
        {tetapkanRows && (
          <TetapkanGuruModal
            rows={tetapkanRows}
            guruList={guruList}
            onClose={() => setTetapkanRows(null)}
            onSaved={() => { loadPenempatan(); loadTempat(); }}
          />
        )}
        {editTarget && (
          <EditPenempatanModal
            penempatan={editTarget}
            tempatList={tempatList}
            guruList={guruList}
            onClose={() => setEditTarget(null)}
            onSaved={() => { loadPenempatan(); loadTempat(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
