import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PengumumanDetailPage } from "@/components/pengumuman/PengumumanDetailPage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <PengumumanDetailPage slug={slug} role="GURU" currentUserId={user.sub} />;
}
