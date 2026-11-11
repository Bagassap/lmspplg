"use client";

import { useEffect, useState } from "react";
import { HardDrive, Pencil, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";

export function UkkDriveHeader({ admin }: { admin?: boolean }) {
  const toast = useToast();
  const [link, setLink] = useState("");
  const [buka, setBuka] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch("/api/pengaturan", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!batal && d?.ukkDriveLink) setLink(d.ukkDriveLink); })
      .catch(() => {});
    return () => { batal = true; };
  }, []);

  async function simpan() {
    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ukkDriveLink: draft.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast.error("Gagal menyimpan", Array.isArray(d?.message) ? d.message.join(", ") : d?.message ?? "Link tidak valid");
        return;
      }
      setLink(draft.trim());
      setBuka(false);
      toast.success("Link Drive disimpan");
    } finally {
      setSaving(false);
    }
  }

  if (!link && !admin) return null;

  return (
    <>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FFE9E2] px-3 py-2 text-xs font-bold text-[#E8562B] transition-all hover:brightness-95 active:scale-95">
          <HardDrive size={13} /> Drive
        </a>
      ) : (
        <button type="button" onClick={() => { setDraft(""); setBuka(true); }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FFE9E2] px-3 py-2 text-xs font-bold text-[#E8562B]">
          <HardDrive size={13} /> Atur Drive
        </button>
      )}
      {admin && link && (
        <button type="button" onClick={() => { setDraft(link); setBuka(true); }} aria-label="Ubah link Drive"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]">
          <Pencil size={13} />
        </button>
      )}
      {buka && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setBuka(false); }}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Link Drive UKK</h3>
              <button type="button" onClick={() => setBuka(false)} aria-label="Tutup"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]"><X size={16} /></button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Siswa, guru, dan admin membuka link ini dari tombol Drive di halaman UKK. Kosongkan untuk menghapus.</p>
            <input type="url" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://drive.google.com/..."
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#8F6DD3] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
            <button type="button" onClick={simpan} disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E03B3] py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />} Simpan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
