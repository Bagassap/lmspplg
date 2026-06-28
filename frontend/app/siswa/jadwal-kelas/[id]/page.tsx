import { redirect } from "next/navigation";

export default async function SiswaJadwalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/siswa/jadwal-kelas/${id}/materi`);
}
