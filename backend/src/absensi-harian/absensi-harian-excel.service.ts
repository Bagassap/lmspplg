import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

type SiswaRekap = {
  siswaId: string;
  nama: string | null;
  nis?: string | null;
  status: string | null;
  waktuAbsen?: string | null;
  lokasi?: string | null;
  foto?: string | null;
  ttd?: string | null;
  catatan?: string | null;
  waktuPulang?: string | null;
  lokasiPulang?: string | null;
  fotoPulang?: string | null;
  ttdPulang?: string | null;
  catatanPulang?: string | null;
};

type RekapKelasData = {
  kelas: { nama: string } | null;
  tanggal: string;
  siswa: SiswaRekap[];
};

const STATUS_LABEL: Record<string, string> = {
  HADIR: 'Hadir',
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  ALPA: 'Alpa',
};

const LINK_FONT = { color: { argb: 'FF2563EB' }, underline: true };
const NA_FONT = { color: { argb: 'FFCBD5E1' }, italic: true };

function publicBase(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

@Injectable()
export class AbsensiHarianExcelService {
  async build(rekap: RekapKelasData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LMS PPLG';
    wb.created = new Date();
    const ws = wb.addWorksheet('Absensi Harian', { views: [{ state: 'frozen', ySplit: 1 }] });

    ws.columns = [
      { header: 'Nama', key: 'nama', width: 26 },
      { header: 'NIS', key: 'nis', width: 14 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Waktu Hadir', key: 'waktuAbsen', width: 12 },
      { header: 'Waktu Pulang', key: 'waktuPulang', width: 12 },
      { header: 'Lokasi Hadir', key: 'lokasi', width: 32 },
      { header: 'Lokasi Pulang', key: 'lokasiPulang', width: 32 },
      { header: 'Catatan', key: 'catatan', width: 30 },
      { header: 'Foto Hadir', key: 'foto', width: 14 },
      { header: 'Foto Pulang', key: 'fotoPulang', width: 14 },
      { header: 'TTD Hadir', key: 'ttd', width: 14 },
      { header: 'TTD Pulang', key: 'ttdPulang', width: 14 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6334F4' } };
    headerRow.alignment = { vertical: 'middle' };
    headerRow.height = 20;

    const base = publicBase();
    const tanggal = rekap.tanggal;

    for (const s of rekap.siswa) {
      const row = ws.addRow({
        nama: s.nama || '-',
        nis: s.nis || '-',
        status: s.status ? (STATUS_LABEL[s.status] ?? s.status) : '-',
        waktuAbsen: s.waktuAbsen || '-',
        waktuPulang: s.waktuPulang || '-',
        lokasi: s.lokasi || '-',
        lokasiPulang: s.lokasiPulang || '-',
        catatan: [s.catatan, s.catatanPulang].filter(Boolean).join(' | ') || '-',
      });
      row.alignment = { vertical: 'middle', wrapText: false };

      this.setLink(row.getCell('foto'), s.foto ? `${base}/api${s.foto}` : null, 'Lihat Foto');
      this.setLink(row.getCell('fotoPulang'), s.fotoPulang ? `${base}/api${s.fotoPulang}` : null, 'Lihat Foto');
      this.setLink(
        row.getCell('ttd'),
        s.ttd ? `${base}/api/absensi-harian/ttd-image?siswaId=${s.siswaId}&tanggal=${tanggal}&tipe=hadir` : null,
        'Lihat TTD',
      );
      this.setLink(
        row.getCell('ttdPulang'),
        s.ttdPulang ? `${base}/api/absensi-harian/ttd-image?siswaId=${s.siswaId}&tanggal=${tanggal}&tipe=pulang` : null,
        'Lihat TTD',
      );
    }

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  private setLink(cell: ExcelJS.Cell, url: string | null, label: string) {
    if (url) {
      cell.value = { text: label, hyperlink: url };
      cell.font = LINK_FONT;
    } else {
      cell.value = 'Tidak tersedia';
      cell.font = NA_FONT;
    }
  }
}
