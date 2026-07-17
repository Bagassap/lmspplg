"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, User, School } from "lucide-react";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { SiswaTable } from "@/components/data-siswa/SiswaTable";
import { type SiswaCardData, type KelasRef, getNama, hasGenderData } from "@/components/data-siswa/shared";

export default function GuruDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterGender, setFilterGender] = useState("");

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
    } finally {
      setLoading(false);
    }
  }, [filterKelas, filterJurusan, filterGender]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayed = search
    ? siswaList.filter((s) => {
        const q = search.toLowerCase();
        return getNama(s).toLowerCase().includes(q) || s.nis.includes(q);
      })
    : siswaList;

  const isFiltered = !!(search || filterKelas || filterJurusan || filterGender);
  const kelasNamaOrder = kelasList.map((k) => k.nama).sort();
  const totalL = siswaList.filter((s) => s.jenisKelamin === "Laki-laki").length;
  const totalP = siswaList.filter((s) => s.jenisKelamin === "Perempuan").length;
  const genderKnown = hasGenderData(siswaList);
  const kelasSet = new Set(siswaList.map((s) => s.kelas.nama));

  return (
    <div className="space-y-5">
      <DataSiswaHeader
        roleBadge="Guru"
        title="Data Siswa"
        subtitle="Lihat daftar seluruh peserta didik"
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
      />
    </div>
  );
}
