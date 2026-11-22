"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { DataSiswaAksiCard } from "@/components/data-siswa/DataSiswaAksiCard";
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
    <div>
      <DataSiswaHeader title="Data Siswa" />

      <div className="mt-0 grid grid-cols-1 items-start gap-4 lg:mt-5 lg:grid-cols-4">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-slate-800 lg:col-span-3">
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
            compact
          />
          <div className="border-t border-slate-100 dark:border-slate-700/50">
            <SiswaTable
              loading={loading}
              siswas={displayed}
              lihatPassword
              mobileNative
            />
          </div>
        </div>

        <DataSiswaAksiCard role="guru" kelasId={selectedKelasId || undefined} kelasNama={selectedKelas?.nama} />
      </div>
    </div>
  );
}
