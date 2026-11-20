"use client";

import LockedFeature from "@/components/shared/LockedFeature";
import { PklHub } from "@/components/magang/PklHub";
import { useSiswaFitur } from "@/components/dashboard/useDashboardMenu";
import { LoadingState } from "@/components/shared/LoadingState";

export default function SiswaMagangPage() {
  const fitur = useSiswaFitur();
  if (!fitur.siap) return <LoadingState className="min-h-[60dvh]" />;
  if (fitur.kelasXII && fitur.magangAktif) return <PklHub role="siswa" />;
  return <LockedFeature role="siswa" type="magang" />;
}
