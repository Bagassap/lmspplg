type DownloadResult = { ok: true } | { ok: false; message: string };

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Data";
}

async function downloadFile(url: string, filename: string, failMessage: string): Promise<DownloadResult> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, message: data?.message ?? failMessage };
  }

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);

  return { ok: true };
}

export async function downloadDataSiswaPdf({
  kelasId, kelasNama, jurusan, siswaId, siswaNama,
}: {
  kelasId?: string; kelasNama?: string; jurusan?: string; siswaId?: string; siswaNama?: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams();
  if (siswaId) qs.set("siswaId", siswaId);
  if (kelasId) qs.set("kelasId", kelasId);
  if (jurusan) qs.set("jurusan", jurusan);
  const filename = siswaId && siswaNama
    ? `Data_Siswa_${safeName(siswaNama)}.pdf`
    : kelasId && kelasNama
      ? `Data_Siswa_${safeName(kelasNama)}.pdf`
      : jurusan
        ? `Data_Siswa_${safeName(jurusan)}.pdf`
        : "Data_Siswa_Semua_Kelas.pdf";
  return downloadFile(`/api/siswa/export-pdf?${qs}`, filename, "Gagal membuat PDF");
}

export async function downloadDataSiswaExcel({
  kelasId, kelasNama, jurusan, siswaId, siswaNama,
}: {
  kelasId?: string; kelasNama?: string; jurusan?: string; siswaId?: string; siswaNama?: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams();
  if (siswaId) qs.set("siswaId", siswaId);
  if (kelasId) qs.set("kelasId", kelasId);
  if (jurusan) qs.set("jurusan", jurusan);
  const filename = siswaId && siswaNama
    ? `Data_Siswa_${safeName(siswaNama)}.xlsx`
    : kelasId && kelasNama
      ? `Data_Siswa_${safeName(kelasNama)}.xlsx`
      : jurusan
        ? `Data_Siswa_${safeName(jurusan)}.xlsx`
        : "Data_Siswa_Semua_Kelas.xlsx";
  return downloadFile(`/api/siswa/export-excel?${qs}`, filename, "Gagal membuat Excel");
}
