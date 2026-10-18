"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { ChangeFotoProfilModal } from "@/components/shared/ChangeFotoProfilModal";
import { kelasShort } from "@/components/data-siswa/shared";

type Me = {
  nama: string;
  role: "ADMIN" | "GURU" | "SISWA";
  loginId: string | null;
  fotoProfil: string | null;
  siswa: { nis: string; kelas: { nama: string } | null } | null;
  guru: { nip: string | null } | null;
};

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrator", GURU: "Guru", SISWA: "Siswa" };

/**
 * Kartu profil mode aplikasi: foto sebaris dengan keterangan.
 * Baris 1 nama; baris 2 NIS · kelas (siswa), NIP (guru), atau peran (admin).
 * Foto bisa diganti dari galeri atau kamera lewat tombol kamera kecil.
 */
export function AppProfileCard({ fallback }: { fallback?: { nama: string; fotoProfil?: string | null; role?: string } }) {
  const [me, setMe] = useState<Me | null>(null);
  const [foto, setFoto] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d))
      .catch(() => {});
  }, []);

  const nama = me?.nama ?? fallback?.nama ?? "";
  const role = me?.role ?? (fallback?.role as Me["role"] | undefined);
  const line2 = me?.siswa
    ? `NIS ${me.siswa.nis}${me.siswa.kelas ? ` · ${kelasShort(me.siswa.kelas.nama)}` : ""}`
    : me?.guru?.nip
      ? `NIP ${me.guru.nip}`
      : role
        ? `${ROLE_LABEL[role] ?? role}${me?.loginId ? ` · ${me.loginId}` : ""}`
        : "";

  return (
    <>
      <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
        <div className="relative shrink-0">
          <Avatar src={me?.fotoProfil ?? fallback?.fotoProfil} nama={nama || "?"} sizePx={64} fallbackBg="#3E03B3" textClassName="text-lg font-extrabold" />
          <button type="button" onClick={() => setFoto(true)} aria-label="Ganti foto profil"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#F26A3D] text-white">
            <Camera size={12} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-slate-900 dark:text-white">{nama}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-600 dark:text-slate-300">{line2 || "—"}</p>
        </div>
      </div>
      {foto && <ChangeFotoProfilModal onClose={() => setFoto(false)} gradient="#3E03B3" />}
    </>
  );
}
