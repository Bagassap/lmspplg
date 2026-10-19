"use client";

import { use } from "react";
import { TugasSubmisiPage } from "@/components/tugas/TugasSubmisiPage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TugasSubmisiPage tugasId={id} role="ADMIN" />;
}
