"use client";

import LockedFeature from "@/components/shared/LockedFeature";
import { PklHub } from "@/components/magang/PklHub";
import { useSiswaFitur } from "@/components/dashboard/useDashboardMenu";

export default function SiswaMagangPage() {
  const fitur = useSiswaFitur();
  if (fitur.kelasXII && fitur.magangAktif) return <PklHub role="siswa" />;
  return <LockedFeature role="siswa" type="magang" />;
}
