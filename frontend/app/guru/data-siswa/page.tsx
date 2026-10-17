"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { CreditCard } from "lucide-react";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { KARTU_PELAJAR_URL } from "@/components/shared/KartuPelajarBanner";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { UnduhLaporanDropdown } from "@/components/data-siswa/UnduhLaporanDropdown";
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

      <div className="mt-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:mt-5">
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
          toolbarExtra={
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={KARTU_PELAJAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10.5 items-center gap-2 rounded-lg px-3.5 text-sm font-bold text-white transition-colors hover:bg-[#2D0281]"
                style={{ background: "#3E03B3" }}
              >
                <CreditCard size={15} />
                Kartu Pelajar
              </a>
              <UnduhLaporanDropdown kelasId={selectedKelasId || undefined} kelasNama={selectedKelas?.nama} />
            </div>
          }
        />
        <div className="border-t border-slate-100 dark:border-slate-700/50">
          <SiswaTable
            loading={loading}
            siswas={displayed}
            mobileNative
          />
        </div>
      </div>
    </div>
  );
}
