"use client";

import { CheckCircle2, MapPin, MessageSquareText, ExternalLink, Camera, FileSignature } from "lucide-react";
import { AppSheet } from "@/components/app/AppSheet";
import { parseLokasi, resolveMediaSrc } from "./shared";

/** Rincian absen (datang/pulang) yang sudah tercatat: sheet bersih bergaya aplikasi. */
export function RiwayatAbsenSheet({
  title, tanggalLabel, statusLabel, statusBg = "#E3F8EF", statusColor = "#059669", waktu, foto, fotoLabel = "Foto Selfie", ttd, lokasi, catatan, onClose,
}: {
  title: string;
  tanggalLabel: string;
  statusLabel: string;
  statusBg?: string;
  statusColor?: string;
  waktu?: string | null;
  foto?: string | null;
  fotoLabel?: string;
  ttd?: string | null;
  lokasi?: string | null;
  catatan?: string | null;
  onClose: () => void;
}) {
  const titik = parseLokasi(lokasi);
  const box = "rounded-2xl bg-[#F1EDFA] p-3";
  const cap = "mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800";
  return (
    <AppSheet open onClose={onClose} title={title} subtitle={tanggalLabel}
      footer={<button type="button" onClick={onClose} className="h-12 w-full rounded-xl bg-[#3E03B3] text-sm font-bold text-white">Tutup</button>}>
      <div className="flex items-center gap-3 rounded-2xl bg-[#F1EDFA] p-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white" style={{ color: statusColor }}>
          <CheckCircle2 size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-xl px-2.5 py-0.5 text-[11px] font-bold" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
        </div>
        <p className="font-digital text-xl font-bold tracking-wider text-[#3E03B3]">{waktu ?? "—"}</p>
      </div>

      <div className="mt-3 space-y-3">
        {foto && (
          <div className={box}>
            <p className={cap}><Camera size={13} className="text-[#3E03B3]" /> {fotoLabel}</p>
            <img src={resolveMediaSrc(foto) ?? undefined} alt={fotoLabel} className="h-44 w-full rounded-xl object-cover" />
          </div>
        )}
        {ttd && (
          <div className={box}>
            <p className={cap}><FileSignature size={13} className="text-[#3E03B3]" /> Tanda Tangan</p>
            <img src={resolveMediaSrc(ttd) ?? undefined} alt="Tanda tangan" className="h-28 w-full rounded-xl bg-white object-contain p-1" />
          </div>
        )}
        {lokasi && (
          <div className={box}>
            <p className={`${cap} justify-between`}>
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#3E03B3]" /> Lokasi</span>
              {titik && (
                <a href={`https://maps.google.com/maps?q=${titik.lat},${titik.lng}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-white px-3 py-1 text-[11px] font-bold text-[#3E03B3]"><ExternalLink size={11} /> Maps</a>
              )}
            </p>
            {titik && <iframe src={`https://maps.google.com/maps?q=${titik.lat},${titik.lng}&output=embed`} className="h-36 w-full rounded-xl border-0" loading="lazy" title="Lokasi absen" />}
            <p className="mt-2 truncate font-mono text-[11px] text-slate-600">{lokasi}</p>
          </div>
        )}
        {catatan && (
          <div className={box}>
            <p className={cap}><MessageSquareText size={13} className="text-[#3E03B3]" /> Keterangan</p>
            <p className="text-sm text-slate-800">{catatan}</p>
          </div>
        )}
      </div>
    </AppSheet>
  );
}
