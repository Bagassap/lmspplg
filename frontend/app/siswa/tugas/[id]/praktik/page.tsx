"use client";

import { use } from "react";
import { TugasPraktikPage } from "@/components/tugas/TugasPraktikPage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TugasPraktikPage tugasId={id} />;
}
