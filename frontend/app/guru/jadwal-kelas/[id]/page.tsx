import { redirect } from "next/navigation";

export default async function GuruJadwalDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/guru/jadwal-kelas/${id}/materi`);
}
