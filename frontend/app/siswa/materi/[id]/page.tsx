"use client";

import { useParams } from "next/navigation";
import { MateriViewerPage } from "@/components/materi/MateriViewerPage";

export default function SiswaMateriViewerRoute() {
  const params = useParams<{ id: string }>();
  return <MateriViewerPage materiId={params.id} backHref="/siswa/materi?tab=materi" />;
}
