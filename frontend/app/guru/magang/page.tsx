"use client";

import { useEffect, useState } from "react";
import LockedFeature from "@/components/shared/LockedFeature";
import { PklHub } from "@/components/magang/PklHub";

export default function GuruMagangPage() {
  const [adaBimbingan, setAdaBimbingan] = useState<boolean | null>(null);

  useEffect(() => {
    let batal = false;
    fetch("/api/magang/penempatan/bimbingan", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!batal) setAdaBimbingan(Array.isArray(d) && d.length > 0); })
      .catch(() => { if (!batal) setAdaBimbingan(false); });
    return () => { batal = true; };
  }, []);

  if (adaBimbingan === null) return null;
  if (adaBimbingan) return <PklHub role="guru" />;
  return <LockedFeature role="guru" type="magang" />;
}
