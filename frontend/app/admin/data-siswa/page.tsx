"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, User, School } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { ResetPasswordModal } from "@/components/shared/ResetPasswordModal";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { SiswaTable } from "@/components/data-siswa/SiswaTable";
import { EditSiswaModal } from "@/components/data-siswa/EditSiswaModal";
import { type SiswaCardData, type KelasRef, getNama, toTitleCase, hasGenderData } from "@/components/data-siswa/shared";

export default function AdminDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [editTarget, setEditTarget] = useState<SiswaCardData | null>(null);
  const [resetTarget, setResetTarget] = useState<SiswaCardData | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/kelas").then((r) => r.json()).then((list) => setKelasList(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterKelas)   qs.set("kelasId",      filterKelas);
      if (filterJurusan) qs.set("jurusan",      filterJurusan);
      if (filterGender)  qs.set("jenisKelamin", filterGender);
      const res = await fetch(`/api/siswa?${qs}`);
      if (res.ok) setSiswaList(await res.json());
    } finally { setLoading(false); }
  }, [filterKelas, filterJurusan, filterGender]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayed = search
    ? siswaList.filter((s) => { const q = search.toLowerCase(); return getNama(s).toLowerCase().includes(q) || s.nis.includes(q); })
    : siswaList;

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

  const isFiltered = !!(search || filterKelas || filterJurusan || filterGender);
  const kelasNamaOrder = kelasList.map((k) => k.nama).sort();
  const totalL = siswaList.filter((s) => s.jenisKelamin === "Laki-laki").length;
  const totalP = siswaList.filter((s) => s.jenisKelamin === "Perempuan").length;
  const genderKnown = hasGenderData(siswaList);
  const kelasSet = new Set(siswaList.map((s) => s.kelas.nama));

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

      <FilterBar
        search={search} onSearch={setSearch}
        filterJurusan={filterJurusan} onFilterJurusan={setFilterJurusan}
        filterKelas={filterKelas} onFilterKelas={setFilterKelas}
        filterGender={filterGender} onFilterGender={setFilterGender}
        kelasList={kelasList}
        isFiltered={isFiltered}
        onReset={() => { setSearch(""); setFilterKelas(""); setFilterJurusan(""); setFilterGender(""); }}
        loading={loading}
        totalCount={siswaList.length}
        displayedCount={displayed.length}
        kelasCount={kelasSet.size}
      />

      <SiswaTable
        loading={loading}
        siswas={displayed}
        grouped={!isFiltered}
        kelasNamaOrder={kelasNamaOrder}
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
