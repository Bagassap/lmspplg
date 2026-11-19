"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, LogIn, LogOut } from "lucide-react";
import { RiwayatAbsenSheet } from "@/components/absensi-harian/RiwayatAbsenSheet";
import { STATUS_CFG, formatTgl } from "@/components/absensi-harian/shared";
import type { StatusAbsensi } from "@/components/absensi-harian/types";
import { icon3dStyle } from "@/components/shared/Icon3D";

type Tab = "DATANG" | "PULANG";
type Row = {
  tanggal: string; status: StatusAbsensi | null;
  waktuAbsen: string | null; lokasi: string | null; foto: string | null; ttd: string | null; catatan: string | null;
  waktuPulang: string | null; lokasiPulang: string | null; fotoPulang: string | null; ttdPulang: string | null; catatanPulang: string | null;
};

export function RiwayatAbsenPkl() {
  const [tab, setTab] = useState<Tab>("DATANG");
  const [data, setData] = useState<Row[] | null>(null);
  const [detail, setDetail] = useState<{ tab: Tab; row: Row } | null>(null);

  useEffect(() => {
    let batal = false;
    fetch(`/api/magang/absensi/saya/riwayat?tipe=${tab === "DATANG" ? "HADIR" : "PULANG"}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!batal) setData(Array.isArray(d) ? d : []); })
      .catch(() => { if (!batal) setData([]); });
    return () => { batal = true; };
  }, [tab]);

  const gantiTab = (t: Tab) => { if (t !== tab) { setData(null); setTab(t); } };

  return (
    <section>
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Riwayat Absen</h2>
      <div className="mt-3 flex gap-7 border-b border-slate-200 dark:border-slate-700/60">
        {([["DATANG", "Datang"], ["PULANG", "Pulang"]] as const).map(([key, label]) => {
          const aktif = tab === key;
          return (
            <button key={key} type="button" onClick={() => gantiTab(key)}
              className="relative pb-3 text-[15px] font-semibold transition-colors" style={{ color: aktif ? "#3E03B3" : "#64748b" }}>
              {label}
              {aktif && <motion.span layoutId="riwayat-pkl-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-xl" style={{ background: "#3E03B3" }} />}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {data === null ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700" />)}</div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada riwayat absen {tab === "DATANG" ? "datang" : "pulang"}</p>
        ) : (
          <ul className="space-y-4">
            {data.map((row) => {
              const waktu = tab === "DATANG" ? row.waktuAbsen : row.waktuPulang;
              const label = tab === "DATANG" ? (row.status ? STATUS_CFG[row.status].label : "Hadir") : "Pulang";
              return (
                <li key={row.tanggal}>
                  <button type="button" onClick={() => setDetail({ tab, row })} className="flex w-full items-center gap-4 text-left active:opacity-70">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(tab === "DATANG" ? "emerald" : "violet")}>
                      {tab === "DATANG" ? <LogIn size={22} color="#fff" /> : <LogOut size={22} color="#fff" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Clock size={11} /> {waktu ?? "—"}</p>
                      <p className="mt-0.5 truncate text-[15px] font-bold text-slate-900 dark:text-white">{formatTgl(row.tanggal)} · {label}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {detail && (detail.tab === "DATANG" ? (
        <RiwayatAbsenSheet
          title={`${detail.row.status ? STATUS_CFG[detail.row.status].label : "Hadir"} Tercatat`}
          tanggalLabel={formatTgl(detail.row.tanggal)}
          statusLabel={detail.row.status ? STATUS_CFG[detail.row.status].label : "Hadir"}
          statusBg={detail.row.status ? STATUS_CFG[detail.row.status].bg : "#F1EDFA"}
          statusColor={detail.row.status ? STATUS_CFG[detail.row.status].clr : "#3E03B3"}
          waktu={detail.row.waktuAbsen}
          foto={detail.row.foto}
          fotoLabel={detail.row.status && detail.row.status !== "HADIR" ? "Foto Surat Izin/Sakit" : "Foto Selfie"}
          ttd={detail.row.ttd}
          lokasi={detail.row.lokasi}
          catatan={detail.row.catatan}
          onClose={() => setDetail(null)}
        />
      ) : (
        <RiwayatAbsenSheet
          title="Kepulangan Tercatat"
          tanggalLabel={formatTgl(detail.row.tanggal)}
          statusLabel="Pulang"
          statusBg="#F1EDFA"
          statusColor="#3E03B3"
          waktu={detail.row.waktuPulang}
          foto={detail.row.fotoPulang}
          ttd={detail.row.ttdPulang}
          lokasi={detail.row.lokasiPulang}
          catatan={detail.row.catatanPulang}
          onClose={() => setDetail(null)}
        />
      ))}
    </section>
  );
}
