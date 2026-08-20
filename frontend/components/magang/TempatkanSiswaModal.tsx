"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, X, Search } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { getNama, toTitleCase } from "@/components/data-siswa/shared";
import type { SiswaCardData } from "@/components/data-siswa/shared";
import type { TempatMagang, PenempatanMagang } from "./types";

type GuruOption = { id: string; user: { id: string; nama: string } };

const INPUT_CLS = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";

export function TempatkanSiswaModal({
  siswaList, tempatList, guruList, penempatanList, onClose, onSaved,
}: {
  siswaList: SiswaCardData[];
  tempatList: TempatMagang[];
  guruList: GuruOption[];
  penempatanList: PenempatanMagang[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [siswaId, setSiswaId] = useState("");
  const [tempatId, setTempatId] = useState("");
  const [guruId, setGuruId] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(() => new Date().toISOString().slice(0, 10));
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [saving, setSaving] = useState(false);

  const siswaAktifIds = useMemo(
    () => new Set(penempatanList.filter((p) => p.status === "AKTIF").map((p) => p.siswa.id)),
    [penempatanList],
  );
  const siswaTersedia = useMemo(
    () => siswaList
      .filter((s) => !siswaAktifIds.has(s.id))
      .filter((s) => (search ? getNama(s).toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search) : true)),
    [siswaList, siswaAktifIds, search],
  );

  async function save() {
    if (!siswaId || !tempatId || !guruId || !tanggalMulai) {
      toast.error("Siswa, tempat, guru pembimbing, dan tanggal mulai wajib diisi", "");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/magang/penempatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siswaId, tempatMagangId: tempatId, guruPembimbingId: guruId,
          tanggalMulai, tanggalSelesai: tanggalSelesai || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Siswa berhasil ditempatkan PKL", "");
        onSaved();
        onClose();
      } else {
        const d = await res.json().catch(() => null);
        toast.error(d?.message ?? "Gagal menempatkan siswa", "");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Briefcase size={16} className="text-violet-500" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">Tempatkan Siswa PKL</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Siswa</label>
            <div className="mb-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-600 dark:bg-slate-900">
              <Search size={13} className="text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/NIS…"
                className="w-full bg-transparent text-sm focus:outline-none dark:text-slate-200" />
            </div>
            <select value={siswaId} onChange={(e) => setSiswaId(e.target.value)} size={5} className={`${INPUT_CLS} h-auto`}>
              {siswaTersedia.length === 0 && <option value="" disabled>Tidak ada siswa tersedia</option>}
              {siswaTersedia.map((s) => (
                <option key={s.id} value={s.id}>{toTitleCase(getNama(s))} — {s.nis} · {s.kelas.nama}</option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-slate-400">Hanya menampilkan siswa yang belum punya penempatan PKL aktif.</p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Tempat Magang</label>
            <select value={tempatId} onChange={(e) => setTempatId(e.target.value)} className={INPUT_CLS}>
              <option value="">— Pilih tempat —</option>
              {tempatList.map((t) => {
                const terisi = t._count?.penempatan ?? 0;
                const penuh = terisi >= t.kuota;
                return (
                  <option key={t.id} value={t.id} disabled={penuh}>
                    {t.namaTempat} ({terisi}/{t.kuota}{penuh ? " · penuh" : ""})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Guru Pembimbing</label>
            <select value={guruId} onChange={(e) => setGuruId(e.target.value)} className={INPUT_CLS}>
              <option value="">— Pilih guru —</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>{toTitleCase(g.user.nama)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Tanggal Mulai</label>
              <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Tanggal Selesai <span className="font-normal normal-case text-slate-400">(opsional)</span></label>
              <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 p-5 pt-4 dark:border-slate-700/50">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
            Batal
          </button>
          <button onClick={save} disabled={saving}
            className="rounded-xl px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6334F4,#4F46E5)" }}>
            {saving ? "Menyimpan..." : "Tempatkan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
