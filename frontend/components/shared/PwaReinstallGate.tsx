"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Download, Smartphone, Trash2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

// Naikkan PWA_VERSION bersama start_url di app/manifest.ts bila aplikasi terpasang wajib dipasang ulang lagi.
// Aplikasi lama terpasang dengan start_url "/" (tanpa penanda), aplikasi hasil pasang ulang "/?pwa=<versi>".
export const PWA_VERSION = "2";
const KEY = "lms_pwa_gate";

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

/** Aplikasi terpasang versi lama tidak bisa dibuka: pengguna diminta menghapus dan memasangnya ulang. */
export function PwaReinstallGate() {
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Diperiksa sekali per sesi pada pembukaan awal: ikon di layar utama selalu membuka start_url ("/" + penanda versi).
    // Pembukaan lewat notifikasi/tautan (alamat selain "/") tidak bisa dinilai, jadi tidak diblokir.
    let hasil: string | null = null;
    try { hasil = sessionStorage.getItem(KEY); } catch { /* sessionStorage bisa tidak tersedia */ }
    if (hasil === null) {
      const lama = isInstalledApp()
        && window.location.pathname === "/"
        && new URLSearchParams(window.location.search).get("pwa") !== PWA_VERSION;
      hasil = lama ? "old" : "ok";
      try { sessionStorage.setItem(KEY, hasil); } catch { /* abaikan */ }
    }
    if (hasil === "old") setBlocked(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (!blocked) return null;

  async function salin() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success("Alamat disalin", "Tempel di browser untuk memasang ulang aplikasi.");
    } catch {
      toast.error("Gagal menyalin alamat", window.location.origin);
    }
  }

  const langkah = [
    { icon: Trash2, teks: "Hapus aplikasi LMS PPLG dari layar utama HP (tekan lama ikonnya, lalu Hapus / Uninstall)." },
    { icon: Smartphone, teks: "Buka alamat LMS di browser Chrome HP Anda." },
    { icon: Download, teks: "Pasang kembali lewat menu Instal aplikasi / Tambahkan ke layar utama." },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#3E03B3] p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
        <Image src="/favicon.png" alt="LMS PPLG" width={80} height={80} priority className="mx-auto mb-4 h-20 w-20 rounded-2xl" />
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Aplikasi Perlu Dipasang Ulang</h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Versi aplikasi di HP Anda sudah usang dan tidak bisa dibuka lagi. Pasang ulang aplikasinya untuk melanjutkan.
        </p>
        <ol className="mt-4 space-y-2.5 text-left">
          {langkah.map((l, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-[#F1EDFA] p-3 dark:bg-slate-800">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3E03B3] text-white"><l.icon size={15} /></span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200"><b>{i + 1}.</b> {l.teks}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={salin}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3E03B3] text-sm font-bold text-white">
          <Copy size={16} /> Salin alamat LMS
        </button>
      </div>
    </div>
  );
}
