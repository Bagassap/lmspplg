"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowUpCircle, ChevronRight } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { KartuPelajarBanner } from "@/components/shared/KartuPelajarBanner";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { UnduhDataSiswaCard } from "@/components/data-siswa/UnduhDataSiswaCard";
import { KenaikanKelasModal } from "@/components/data-siswa/KenaikanKelasModal";
import { SiswaTable } from "@/components/data-siswa/SiswaTable";
import { EditSiswaModal } from "@/components/data-siswa/EditSiswaModal";
import { type SiswaCardData, type KelasRef, getNama, toTitleCase } from "@/components/data-siswa/shared";

export default function AdminDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [editTarget, setEditTarget] = useState<SiswaCardData | null>(null);
  const [resetTarget, setResetTarget] = useState<SiswaCardData | null>(null);
  const [kenaikanOpen, setKenaikanOpen] = useState(false);
  const toast = useToast();

  const loadKelasList = useCallback(async () => {
    const res = await fetch("/api/kelas");
    const list = await res.json().catch(() => []);
    setKelasList(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => { loadKelasList(); }, [loadKelasList]);

  useEffect(() => {
    if (!selectedKelasId && kelasList.length > 0) setSelectedKelasId(kelasList[0].id);
  }, [kelasList, selectedKelasId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/siswa");
      if (res.ok) setSiswaList(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const inKelas = useMemo(
    () => siswaList.filter((s) => s.kelas.id === selectedKelasId),
    [siswaList, selectedKelasId],
  );

  const displayed = inKelas
    .filter((s) => (filterGender ? s.jenisKelamin === filterGender : true))
    .filter((s) => (search ? (getNama(s).toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search)) : true));

  function handleSaved() {
    fetchData();
    setEditTarget(null);
  }
  async function handleImpersonate(s: SiswaCardData) {
    if (!s.user) return;
    try {
      const res = await fetch(`/api/users/${s.user.id}/impersonate`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
      sessionStorage.setItem("lms_session", "1");
      window.location.href = data.redirectTo || "/siswa/dashboard";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memulai mode pemantauan.";
      toast.error("Gagal memantau akun", msg);
    }
  }

  // Siswa keluar/pindah sekolah: HAPUS PERMANEN — seluruh riwayat (absensi,
  // tugas, PKL, UKK) dan akun login (kalau ada) dihapus dari sistem, bukan
  // sekadar ditandai status. Tidak bisa dibatalkan.
  async function handleKeluarkan(s: SiswaCardData) {
    const nama = toTitleCase(getNama(s));
    const ok = await toast.confirm(
      "Hapus siswa ini secara permanen?",
      `"${nama}" beserta SELURUH riwayatnya (absensi, tugas, PKL, UKK) dan akun login (kalau ada) akan DIHAPUS PERMANEN dari sistem. Aksi ini TIDAK BISA DIBATALKAN.`,
    );
    if (!ok) return;
    const res = await fetch(`/api/siswa/${s.id}/keluarkan`, { method: "PATCH" });
    if (res.ok) {
      toast.success("Siswa dihapus permanen", nama);
      fetchData();
    } else {
      const d = await res.json().catch(() => null);
      toast.error(d?.message ?? "Gagal menghapus siswa", "");
    }
  }

  const isFiltered = !!(search || filterGender);
  const selectedKelas = kelasList.find((k) => k.id === selectedKelasId);

  return (
    <div className="space-y-5">
      <DataSiswaHeader title="Data Siswa" />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4">
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-3">
          <FilterBar
            search={search} onSearch={setSearch}
            filterGender={filterGender} onFilterGender={setFilterGender}
            kelasList={kelasList} selectedKelasId={selectedKelasId} onSelectKelas={setSelectedKelasId}
            siswaList={inKelas}
            isFiltered={isFiltered}
            onReset={() => { setSearch(""); setFilterGender(""); }}
            loading={loading}
            totalCount={inKelas.length}
            displayedCount={displayed.length}
          />
          <div className="border-t border-slate-100 dark:border-slate-700/50">
            <SiswaTable
              loading={loading}
              siswas={displayed}
              onEdit={setEditTarget}
              onResetPassword={setResetTarget}
              onImpersonate={handleImpersonate}
              onKeluarkan={handleKeluarkan}
            />
          </div>
        </div>

        <div className="flex flex-col rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="p-5">
            <KartuPelajarBanner />
          </div>

          <div className="border-t border-slate-100 p-5 dark:border-slate-700/50">
            <UnduhDataSiswaCard
              kelasId={selectedKelasId || undefined}
              kelasNama={selectedKelas?.nama}
            />
          </div>

          <div className="border-t border-slate-100 p-5 dark:border-slate-700/50">
            <button onClick={() => setKenaikanOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#0082FB" }}>
                  <ArrowUpCircle size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Kenaikan Kelas &amp; Kelulusan</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Naikkan siswa antar kelas, atau luluskan satu kelas sekaligus (akhir tahun ajaran)</p>
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      <KenaikanKelasModal
        open={kenaikanOpen}
        onClose={() => setKenaikanOpen(false)}
        kelasList={kelasList}
        onDone={() => { loadKelasList(); fetchData(); }}
      />

      {editTarget && <EditSiswaModal siswa={editTarget} kelasList={kelasList} onClose={() => setEditTarget(null)} onSave={handleSaved} />}

      {resetTarget?.user && (
        <ResetPasswordModal
          userId={resetTarget.user.id}
          userName={toTitleCase(getNama(resetTarget))}
          nis={resetTarget.nis}
          mustChangePassword={resetTarget.user.mustChangePassword}
          onClose={() => setResetTarget(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
