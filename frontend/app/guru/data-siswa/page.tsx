"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, User, School } from "lucide-react";
import SiswaDetailModal from "@/components/data-siswa/SiswaDetailModal";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";
import { FilterBar } from "@/components/data-siswa/FilterBar";
import { SiswaTable } from "@/components/data-siswa/SiswaTable";
import { type SiswaCardData, type KelasRef, getNama, hasGenderData } from "@/components/data-siswa/shared";

type KelasAc = { main: string; light: string; text: string; dark: string };

const KELAS_COLOR: Record<string, KelasAc> = {
  "X Pengembangan Perangkat Lunak dan Gim 1": { main: "#977DFF", light: "#F0EDFF", text: "#5B3FBD", dark: "#6334F4" },
  "X Pengembangan Perangkat Lunak dan Gim 2": { main: "#0033FF", light: "#EBF0FF", text: "#002BD4", dark: "#0022CC" },
  "X Pengembangan Perangkat Lunak dan Gim 3": { main: "#6366F1", light: "#EDEFFF", text: "#4338CA", dark: "#4F46E5" },
  "XI Pengembangan Gim 1":                    { main: "#14B8A6", light: "#F0FDFA", text: "#0F766E", dark: "#0D9488" },
  "XI Rekayasa Perangkat Lunak 1":            { main: "#8B5CF6", light: "#F5F0FF", text: "#6D28D9", dark: "#7C3AED" },
  "XI Rekayasa Perangkat Lunak 2":            { main: "#EC4899", light: "#FDF2F8", text: "#9D174D", dark: "#DB2777" },
};
const DEFAULT_AC: KelasAc = { main: "#4F8EF7", light: "#EEF4FF", text: "#2563EB", dark: "#3B7CE8" };

export default function GuruDataSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaCardData[]>([]);
  const [kelasList, setKelasList] = useState<KelasRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [detailSiswa, setDetailSiswa] = useState<SiswaCardData | null>(null);

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
        panelLabel="Guru Panel"
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
        onDetail={setDetailSiswa}
      />

      {detailSiswa && (
        <SiswaDetailModal
          siswa={detailSiswa}
          ac={KELAS_COLOR[detailSiswa.kelas.nama] ?? DEFAULT_AC}
          onClose={() => setDetailSiswa(null)}
        />
      )}
    </div>
  );
}
