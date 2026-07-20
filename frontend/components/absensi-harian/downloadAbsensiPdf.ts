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

export async function downloadAbsensiPdf({
  kelasId, tanggal, kelasNama,
}: {
  kelasId: string; tanggal: string; kelasNama: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams({ kelasId, tanggal });
  return downloadFile(
    `/api/absensi-harian/export-pdf?${qs}`,
    `Absensi_${safeName(kelasNama)}_${tanggal}.pdf`,
    "Gagal membuat PDF",
  );
}

export async function downloadAbsensiPdfSiswa({
  siswaId, tanggal, siswaNama,
}: {
  siswaId: string; tanggal: string; siswaNama: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams({ siswaId, tanggal });
  return downloadFile(
    `/api/absensi-harian/export-pdf-siswa?${qs}`,
    `Absensi_${safeName(siswaNama)}_${tanggal}.pdf`,
    "Gagal membuat PDF",
  );
}

export async function downloadAbsensiExcel({
  kelasId, tanggal, kelasNama,
}: {
  kelasId: string; tanggal: string; kelasNama: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams({ kelasId, tanggal });
  return downloadFile(
    `/api/absensi-harian/export-excel?${qs}`,
    `Absensi_${safeName(kelasNama)}_${tanggal}.xlsx`,
    "Gagal membuat Excel",
  );
}

export async function downloadAbsensiExcelSiswa({
  siswaId, tanggal, siswaNama,
}: {
  siswaId: string; tanggal: string; siswaNama: string;
}): Promise<DownloadResult> {
  const qs = new URLSearchParams({ siswaId, tanggal });
  return downloadFile(
    `/api/absensi-harian/export-excel-siswa?${qs}`,
    `Absensi_${safeName(siswaNama)}_${tanggal}.xlsx`,
    "Gagal membuat Excel",
  );
}
