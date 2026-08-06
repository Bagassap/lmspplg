"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Users, User, School } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { UnduhDataSiswaCard } from "@/components/data-siswa/UnduhDataSiswaCard";
import { SiswaTable } from "@/components/data-siswa/SiswaTable";
import { EditSiswaModal } from "@/components/data-siswa/EditSiswaModal";
import { type SiswaCardData, type KelasRef, getNama, toTitleCase, hasGenderData } from "@/components/data-siswa/shared";

export default function AdminDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [search, setSearch] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [editTarget, setEditTarget] = useState<SiswaCardData | null>(null);
  const [resetTarget, setResetTarget] = useState<SiswaCardData | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/kelas").then((r) => r.json()).then((list) => setKelasList(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

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
    .filter((s) => (filterJurusan ? s.jurusan === filterJurusan : true))
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

  const isFiltered = !!(search || filterJurusan || filterGender);
  const totalL = siswaList.filter((s) => s.jenisKelamin === "Laki-laki").length;
  const totalP = siswaList.filter((s) => s.jenisKelamin === "Perempuan").length;
  const genderKnown = hasGenderData(siswaList);
  const kelasSet = new Set(siswaList.map((s) => s.kelas.nama));
  const selectedKelas = kelasList.find((k) => k.id === selectedKelasId);

  return (
    <div className="space-y-5">
      <DataSiswaHeader
        roleBadge="Admin"
        title="Data Siswa"
        subtitle="Kelola data seluruh peserta didik"
        stats={[
          { icon: Users, label: `${loading ? "—" : siswaList.length} Total` },
          { icon: User, label: `${loading ? "—" : genderKnown ? totalL : "–"} Laki-laki` },
          { icon: User, label: `${loading ? "—" : genderKnown ? totalP : "–"} Perempuan` },
          { icon: School, label: `${loading ? "—" : kelasSet.size} Kelas` },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FilterBar
            search={search} onSearch={setSearch}
            filterJurusan={filterJurusan} onFilterJurusan={setFilterJurusan}
            filterGender={filterGender} onFilterGender={setFilterGender}
            kelasList={kelasList} selectedKelasId={selectedKelasId} onSelectKelas={setSelectedKelasId}
            siswaList={inKelas}
            isFiltered={isFiltered}
            onReset={() => { setSearch(""); setFilterJurusan(""); setFilterGender(""); }}
            loading={loading}
            totalCount={inKelas.length}
            displayedCount={displayed.length}
          />
        </div>

        <UnduhDataSiswaCard
          kelasId={selectedKelasId || undefined}
          kelasNama={selectedKelas?.nama}
          jurusan={filterJurusan || undefined}
        />
      </div>

      <SiswaTable
        loading={loading}
        siswas={displayed}
        onEdit={setEditTarget}
        onResetPassword={setResetTarget}
        onImpersonate={handleImpersonate}
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
