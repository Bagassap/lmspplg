import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import { join, normalize } from 'path';
import { getStaticMapImage } from '../common/utils/static-map.util';

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

const NA_FONT = { color: { argb: 'FFCBD5E1' }, italic: true };
const LINK_FONT = { color: { argb: 'FF2563EB' }, underline: true };

const UPLOADS_ROOT = join(process.cwd(), 'uploads');

// lokasi is stored as "lat,lng" (see parseLokasi in frontend/shared.ts) — but
// can also be the "GPS tidak tersedia" fallback string when geolocation was
// blocked, so validate both parts are actually numeric before linking.
function googleMapsUrl(lokasi?: string | null): string | null {
  if (!lokasi) return null;
  const parts = lokasi.split(',');
  if (parts.length < 2) return null;
  const lat = parts[0].trim();
  const lng = parts[1].trim();
  if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

const FOTO_SIZE = { width: 80, height: 80 };
const TTD_SIZE = { width: 100, height: 50 };
const MAP_SIZE = { width: 120, height: 90 };
// 90px-tall map images (the tallest embed) need ~68pt of row height (96dpi: 1pt = 1.333px); add padding so images aren't clipped.
const MEDIA_ROW_HEIGHT = 76;

async function readFotoBuffer(fotoUrl?: string | null): Promise<Buffer | null> {
  if (!fotoUrl || !fotoUrl.startsWith('/uploads/')) return null;
  const filePath = normalize(join(process.cwd(), fotoUrl));
  if (!filePath.startsWith(UPLOADS_ROOT)) return null;
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

function decodeTtdBuffer(ttd?: string | null): Buffer | null {
  if (!ttd) return null;
  const match = /^data:image\/(png|jpe?g);base64,([a-zA-Z0-9+/=]+)$/.exec(ttd.trim());
  if (!match) return null;
  try {
    return Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
}

// exceljs only embeds jpeg/png/gif, so sniff the real format instead of trusting the upload extension.
function detectImageExtension(buffer: Buffer): 'png' | 'jpeg' | 'gif' | null {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.length >= 6 && buffer.subarray(0, 3).toString('ascii') === 'GIF') return 'gif';
  return null;
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
      { header: 'Peta Hadir', key: 'petaLokasi', width: 18 },
      { header: 'Lokasi Pulang', key: 'lokasiPulang', width: 32 },
      { header: 'Peta Pulang', key: 'petaLokasiPulang', width: 18 },
      { header: 'Catatan', key: 'catatan', width: 30 },
      { header: 'Foto Hadir', key: 'foto', width: 13 },
      { header: 'Foto Pulang', key: 'fotoPulang', width: 13 },
      { header: 'TTD Hadir', key: 'ttd', width: 16 },
      { header: 'TTD Pulang', key: 'ttdPulang', width: 16 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6334F4' } };
    headerRow.alignment = { vertical: 'middle' };
    headerRow.height = 20;

    const colIndex: Record<string, number> = {};
    ws.columns.forEach((col, i) => {
      if (col.key) colIndex[col.key] = i;
    });

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

      const lokasiUrl = googleMapsUrl(s.lokasi);
      if (lokasiUrl) {
        const cell = row.getCell('lokasi');
        cell.value = { text: s.lokasi as string, hyperlink: lokasiUrl };
        cell.font = LINK_FONT;
      }
      const lokasiPulangUrl = googleMapsUrl(s.lokasiPulang);
      if (lokasiPulangUrl) {
        const cell = row.getCell('lokasiPulang');
        cell.value = { text: s.lokasiPulang as string, hyperlink: lokasiPulangUrl };
        cell.font = LINK_FONT;
      }

      // Map thumbnails are best-effort — getStaticMapImage() never throws and
      // resolves to null on any failure (invalid coords, network error,
      // timeout), so a slow/unreachable tile server can never block the
      // export. The Lokasi Hadir/Pulang hyperlink cells above always work
      // regardless of whether the thumbnail comes back.
      const [fotoBuf, fotoPulangBuf, mapBuf, mapPulangBuf] = await Promise.all([
        readFotoBuffer(s.foto),
        readFotoBuffer(s.fotoPulang),
        getStaticMapImage(s.lokasi),
        getStaticMapImage(s.lokasiPulang),
      ]);
      const ttdBuf = decodeTtdBuffer(s.ttd);
      const ttdPulangBuf = decodeTtdBuffer(s.ttdPulang);

      const hasImage = [
        this.embedOrClear(wb, ws, row, colIndex.foto, fotoBuf, FOTO_SIZE),
        this.embedOrClear(wb, ws, row, colIndex.fotoPulang, fotoPulangBuf, FOTO_SIZE),
        this.embedOrClear(wb, ws, row, colIndex.ttd, ttdBuf, TTD_SIZE),
        this.embedOrClear(wb, ws, row, colIndex.ttdPulang, ttdPulangBuf, TTD_SIZE),
        this.embedOrClear(wb, ws, row, colIndex.petaLokasi, mapBuf, MAP_SIZE),
        this.embedOrClear(wb, ws, row, colIndex.petaLokasiPulang, mapPulangBuf, MAP_SIZE),
      ].some(Boolean);

      if (hasImage) row.height = MEDIA_ROW_HEIGHT;
    }

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  /** Embeds the image into the cell at (row, col) if possible; otherwise writes a text placeholder. Returns whether an image was embedded. */
  private embedOrClear(
    wb: ExcelJS.Workbook,
    ws: ExcelJS.Worksheet,
    row: ExcelJS.Row,
    col: number,
    buffer: Buffer | null,
    size: { width: number; height: number },
  ): boolean {
    const cell = row.getCell(col + 1);
    const extension = buffer ? detectImageExtension(buffer) : null;
    if (!buffer || !extension) {
      cell.value = '-';
      cell.font = NA_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      return false;
    }
    cell.value = '';
    const imageId = wb.addImage({ buffer, extension } as unknown as ExcelJS.Image);
    ws.addImage(imageId, {
      tl: { col: col + 0.08, row: row.number - 1 + 0.08 },
      ext: size,
      editAs: 'oneCell',
    } as ExcelJS.ImagePosition & { editAs?: string });
    return true;
  }
}
