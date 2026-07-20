export async function downloadAbsensiPdf({
  kelasId, tanggal, kelasNama,
}: {
  kelasId: string; tanggal: string; kelasNama: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const qs = new URLSearchParams({ kelasId, tanggal });

  let res: Response;
  try {
    res = await fetch(`/api/absensi-harian/export-pdf?${qs}`);
  } catch {
    return { ok: false, message: "Tidak dapat terhubung ke server" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, message: data?.message ?? "Gagal membuat PDF" };
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const safeKelas = kelasNama.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Kelas";
  const a = document.createElement("a");
  a.href = url;
  a.download = `Absensi_${safeKelas}_${tanggal}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { ok: true };
}
