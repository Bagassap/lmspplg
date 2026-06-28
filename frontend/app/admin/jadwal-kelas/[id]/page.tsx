import { redirect } from "next/navigation";

export default async function AdminJadwalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/jadwal-kelas/${id}/materi`);
}
