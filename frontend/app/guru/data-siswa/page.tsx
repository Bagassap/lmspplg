"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { KartuPelajarBanner } from "@/components/shared/KartuPelajarBanner";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { UnduhDataSiswaCard } from "@/components/data-siswa/UnduhDataSiswaCard";
import { SiswaTable } from "@/components/data-siswa/SiswaTable";
import { type SiswaCardData, type KelasRef, getNama } from "@/components/data-siswa/shared";

export default function GuruDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");

  useEffect(() => {
    // "/api/kelas/saya" - dibatasi ke kelas yang guru ini jadi wali kelasnya,
    // bukan "/api/kelas" yang menampilkan semua kelas di sekolah.
    fetch("/api/kelas/saya").then((r) => r.json()).then((list) => setKelasList(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedKelasId && kelasList.length > 0) setSelectedKelasId(kelasList[0].id);
  }, [kelasList, selectedKelasId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/siswa");
      if (res.ok) setSiswaList(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const inKelas = useMemo(
    () => siswaList.filter((s) => s.kelas.id === selectedKelasId),
    [siswaList, selectedKelasId],
  );

  const displayed = inKelas
    .filter((s) => (filterGender ? s.jenisKelamin === filterGender : true))
    .filter((s) => (search ? (getNama(s).toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search)) : true));

  const isFiltered = !!(search || filterGender);
  const selectedKelas = kelasList.find((k) => k.id === selectedKelasId);

  return (
    <div className="space-y-5">
      <DataSiswaHeader title="Data Siswa" />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
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
        </div>
      </div>
    </div>
  );
}
