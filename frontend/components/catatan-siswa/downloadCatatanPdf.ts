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

export async function downloadCatatanPdf({
  kelasId, kelasNama, siswaId, siswaNama,
}: {
  kelasId?: string; kelasNama?: string; siswaId?: string; siswaNama?: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams();
  if (siswaId) qs.set("siswaId", siswaId);
  if (kelasId) qs.set("kelasId", kelasId);
  const filename = siswaId && siswaNama
    ? `Catatan_Siswa_${safeName(siswaNama)}.pdf`
    : kelasId && kelasNama
      ? `Catatan_Siswa_${safeName(kelasNama)}.pdf`
      : "Catatan_Siswa.pdf";
  return downloadFile(`/api/catatan-siswa/export-pdf?${qs}`, filename, "Gagal membuat PDF");
}

export async function downloadCatatanExcel({
  kelasId, kelasNama, siswaId, siswaNama,
}: {
  kelasId?: string; kelasNama?: string; siswaId?: string; siswaNama?: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams();
  if (siswaId) qs.set("siswaId", siswaId);
  if (kelasId) qs.set("kelasId", kelasId);
  const filename = siswaId && siswaNama
    ? `Catatan_Siswa_${safeName(siswaNama)}.xlsx`
    : kelasId && kelasNama
      ? `Catatan_Siswa_${safeName(kelasNama)}.xlsx`
      : "Catatan_Siswa.xlsx";
  return downloadFile(`/api/catatan-siswa/export-excel?${qs}`, filename, "Gagal membuat Excel");
}
