"use client";

import { useParams } from "next/navigation";
import { MateriViewerPage } from "@/components/materi/MateriViewerPage";

export default function GuruMateriViewerRoute() {
  const params = useParams<{ id: string }>();
  return <MateriViewerPage materiId={params.id} backHref="/guru/materi" />;
}
