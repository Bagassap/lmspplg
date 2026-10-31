"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

type Hasil = { nama: string; nis: string; password: string | null; masihAwal: boolean; pesan: string | null };

export function PasswordSiswaModal({ userId, nama, onClose, onReset }: { userId: string; nama: string; onClose: () => void; onReset?: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<Hasil | null>(null);
  const [galat, setGalat] = useState("");
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch(`/api/users/${userId}/password-siswa`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(typeof d?.message === "string" ? d.message : "Gagal mengambil password");
        return d as Hasil;
      })
      .then((d) => { if (!batal) setData(d); })
      .catch((e) => { if (!batal) setGalat(e.message); });
    return () => { batal = true; };
  }, [userId]);

  async function salin() {
    if (!data?.password) return;
    try { await navigator.clipboard.writeText(data.password); toast.success("Password disalin", ""); }
    catch { toast.error("Tidak bisa menyalin", ""); }
  }

  const isi = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-[28px] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password siswa</p>
            <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{nama}</h2>
            {data && <p className="text-xs text-slate-500">NIS {data.nis}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]"><X size={16} /></button>
        </div>

        <div className="mt-4">
          {galat ? (
            <p className="rounded-2xl bg-[#FFE9E2] px-4 py-3 text-sm font-semibold text-[#E8562B]">{galat}</p>
          ) : !data ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><Loader2 size={18} className="animate-spin text-[#3E03B3]" /> Memuat…</div>
          ) : data.password ? (
            <>
              <div className="flex items-center gap-2 rounded-2xl bg-[#F1EDFA] px-4 py-3">
                <span className="min-w-0 flex-1 break-all font-mono text-base font-bold text-[#3E03B3]">{tampil ? data.password : "•".repeat(Math.min(data.password.length, 14))}</span>
                <button type="button" onClick={() => setTampil((v) => !v)} aria-label={tampil ? "Sembunyikan" : "Tampilkan"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#3E03B3]">{tampil ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                <button type="button" onClick={salin} aria-label="Salin"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3E03B3] text-white"><Copy size={15} /></button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {data.masihAwal ? "Siswa belum mengganti password — ini password awal (NIS)." : "Password yang diatur siswa sendiri."} Jangan dibagikan ke pihak lain.
              </p>
            </>
          ) : (
            <div className="rounded-2xl bg-[#FFE9E2] px-4 py-3 text-sm font-semibold text-[#E8562B]">
              {data.pesan}
              {onReset && (
                <button type="button" onClick={onReset} className="mt-3 block rounded-xl bg-[#F26A3D] px-4 py-2 text-xs font-bold text-white">Reset password sekarang</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(isi, document.body);
}
