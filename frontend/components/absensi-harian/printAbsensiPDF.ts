import type { SiswaAbsensi, StatusAbsensi } from "./types";
import { resolveMediaSrc } from "./shared";

export function printAbsensiPDF({ siswaList, kelasNama, tanggal, rekap, total }: {
  siswaList: SiswaAbsensi[]; kelasNama: string; tanggal: string;
  rekap: Record<StatusAbsensi, number>; total: number;
}) {
  const tglFmt = tanggal
    ? new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "-";
  const statusColor: Record<string, string> = { HADIR: "#10B981", IZIN: "#6334F4", SAKIT: "#E6A800", ALPA: "#FF3644" };
  const statusBg: Record<string, string> = { HADIR: "#E8F8F1", IZIN: "#F0ECFF", SAKIT: "#FFF5DC", ALPA: "#FFE9EA" };

  const pages = siswaList.map((s, i) => {
    const st = s.status ?? "—";
    const stClr = statusColor[st] ?? "#64748B";
    const stBg = statusBg[st] ?? "#F1F5F9";
    const fotoSrc = resolveMediaSrc(s.foto);
    const isLast = i === siswaList.length - 1;
    return `
      <div style="page-break-after:${isLast ? "avoid" : "always"};padding:32px;font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;box-sizing:border-box;">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #10B981;padding-bottom:14px;margin-bottom:16px;">
          <div>
            <h1 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">Laporan Absensi Harian</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${tglFmt}</p>
          </div>
          <div style="text-align:right;font-size:11px;color:#94a3b8;">
            <div style="font-weight:700;color:#10B981;font-size:16px;">${i + 1}/${siswaList.length}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:12px;">
              <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Identitas Siswa</p>
              <p style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">${s.nama}</p>
              <p style="margin:4px 0 0;font-size:12px;font-family:monospace;color:#64748b;">${s.nis ?? "—"}</p>
              <div style="margin-top:12px;display:inline-flex;padding:4px 10px;border-radius:999px;background:${stBg};color:${stClr};font-size:12px;font-weight:800;">${st}</div>
              <p style="margin:8px 0 0;font-size:18px;font-weight:900;font-family:monospace;color:#0f172a;">${s.waktuAbsen ?? "—"}</p>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Kelas</p>
              <p style="margin:0;font-size:13px;font-weight:700;color:#334155;">${kelasNama}</p>
            </div>
          </div>
          <div>
            ${fotoSrc ? `<div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:12px;"><p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Foto Selfie</p><img src="${fotoSrc}" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;" crossorigin="anonymous"/></div>` : ""}
            ${s.ttd ? `<div style="background:#f8fafc;border-radius:12px;padding:16px;"><p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Tanda Tangan</p><div style="background:white;border-radius:8px;border:1px solid #e2e8f0;padding:8px;text-align:center;"><img src="${s.ttd}" style="max-width:100%;max-height:100px;object-fit:contain;" crossorigin="anonymous"/></div></div>` : ""}
          </div>
        </div>
        <div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
          <span>Laporan Absensi Harian — ${new Date().toLocaleDateString("id-ID")}</span>
          <span>Hadir ${rekap.HADIR} | Izin ${rekap.IZIN} | Sakit ${rekap.SAKIT} | Alpa ${rekap.ALPA} dari ${total}</span>
        </div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Laporan Absensi Harian</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{background:white;}
    @media print{@page{size:A4 portrait;margin:0;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>
  </head><body>${pages}</body></html>`;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}
