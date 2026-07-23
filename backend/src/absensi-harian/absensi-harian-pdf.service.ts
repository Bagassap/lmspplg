import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
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
const STATUS_COLOR: Record<string, string> = {
  HADIR: '#10B981',
  IZIN: '#6334F4',
  SAKIT: '#E6A800',
  ALPA: '#FF3644',
};
const STATUS_BG: Record<string, string> = {
  HADIR: '#E8F8F1',
  IZIN: '#F0ECFF',
  SAKIT: '#FFF5DC',
  ALPA: '#FFE9EA',
};

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

function formatTanggal(tanggal: string): string {
  try {
    return new Date(`${tanggal}T00:00:00`).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return tanggal;
  }
}

@Injectable()
export class AbsensiHarianPdfService {
  async build(rekap: RekapKelasData): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const tglFmt = formatTanggal(rekap.tanggal);
    const kelasNama = rekap.kelas?.nama ?? '-';
    const siswaList = rekap.siswa;

    if (siswaList.length === 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#64748b').text('Tidak ada siswa di kelas ini.', 40, 40);
    } else {
      for (let i = 0; i < siswaList.length; i++) {
        doc.addPage();
        await this.renderPage(doc, siswaList[i], kelasNama, tglFmt, i, siswaList.length);
      }
    }

    doc.end();
    return done;
  }

  private async renderPage(
    doc: PDFKit.PDFDocument,
    s: SiswaRekap,
    kelasNama: string,
    tglFmt: string,
    idx: number,
    total: number,
  ) {
    const margin = 40;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    doc.fontSize(9).fillColor('#94a3b8').text('LAPORAN ABSENSI HARIAN', margin, y, { characterSpacing: 0.6 });
    doc.fontSize(9).fillColor('#94a3b8').text(`${idx + 1} / ${total}`, margin, y, { width: contentWidth, align: 'right' });
    y += 20;

    doc.fontSize(20).fillColor('#0f172a').text(s.nama || '-', margin, y, { width: contentWidth });
    y = doc.y + 4;
    doc.fontSize(11).fillColor('#64748b').text(`NIS: ${s.nis ?? '-'}   ·   Kelas: ${kelasNama}`, margin, y, { width: contentWidth });
    y = doc.y + 2;
    doc.fontSize(11).fillColor('#64748b').text(`Tanggal: ${tglFmt}`, margin, y, { width: contentWidth });
    y = doc.y + 12;

    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 16;

    const status = s.status ?? 'ALPA';
    const label = STATUS_LABEL[status] ?? status;
    const clr = STATUS_COLOR[status] ?? '#64748b';
    const bg = STATUS_BG[status] ?? '#f1f5f9';
    doc.roundedRect(margin, y, 110, 26, 6).fill(bg);
    doc.fontSize(12).fillColor(clr).text(label, margin, y + 7, { width: 110, align: 'center' });
    y += 40;

    const hasAnyData = !!(
      s.status ||
      s.waktuAbsen ||
      s.waktuPulang ||
      s.foto ||
      s.fotoPulang ||
      s.ttd ||
      s.ttdPulang ||
      s.catatan ||
      s.catatanPulang
    );
    if (!hasAnyData) {
      doc.fontSize(11).fillColor('#94a3b8').text('Tidak ada data absensi untuk tanggal ini.', margin, y, { width: contentWidth });
      y = doc.y + 16;
    }

    const rowH = 34;
    const colW = contentWidth / 2;

    doc.fillColor('#94a3b8').fontSize(8).text('WAKTU HADIR', margin, y, { width: colW - 10 });
    doc.fillColor('#94a3b8').fontSize(8).text('WAKTU PULANG', margin + colW, y, { width: colW - 10 });
    doc.fillColor('#334155').fontSize(10).text(s.waktuAbsen || '-', margin, y + 11, { width: colW - 10 });
    doc.fillColor('#334155').fontSize(10).text(s.waktuPulang || '-', margin + colW, y + 11, { width: colW - 10 });
    y += rowH;

    const lokasiUrl = googleMapsUrl(s.lokasi);
    const lokasiPulangUrl = googleMapsUrl(s.lokasiPulang);
    // Map thumbnails are best-effort — getStaticMapImage() never throws and
    // resolves to null on any failure (invalid coords, network error,
    // timeout), so a slow/unreachable tile server can never block PDF
    // generation. The lokasi text + Google Maps link above always render
    // regardless of whether the thumbnail comes back.
    const [mapBuf, mapPulangBuf] = await Promise.all([
      getStaticMapImage(s.lokasi),
      getStaticMapImage(s.lokasiPulang),
    ]);
    doc.fillColor('#94a3b8').fontSize(8).text('LOKASI HADIR', margin, y, { width: colW - 10 });
    doc.fillColor('#94a3b8').fontSize(8).text('LOKASI PULANG', margin + colW, y, { width: colW - 10 });
    doc
      .fillColor(lokasiUrl ? '#2563eb' : '#334155')
      .fontSize(10)
      .text(s.lokasi || '-', margin, y + 11, {
        width: colW - 10,
        underline: !!lokasiUrl,
        link: lokasiUrl ?? undefined,
      });
    doc
      .fillColor(lokasiPulangUrl ? '#2563eb' : '#334155')
      .fontSize(10)
      .text(s.lokasiPulang || '-', margin + colW, y + 11, {
        width: colW - 10,
        underline: !!lokasiPulangUrl,
        link: lokasiPulangUrl ?? undefined,
      });

    const mapY = y + 27;
    const mapW = 110;
    const mapH = 82.5;
    if (mapBuf) {
      try { doc.image(mapBuf, margin, mapY, { width: mapW, height: mapH }); } catch { /* corrupt/unreadable — skip, text+link above already cover it */ }
    }
    if (mapPulangBuf) {
      try { doc.image(mapPulangBuf, margin + colW, mapY, { width: mapW, height: mapH }); } catch { /* same */ }
    }
    y = (mapBuf || mapPulangBuf) ? mapY + mapH + 10 : y + rowH;

    if (s.catatan || s.catatanPulang) {
      doc.fillColor('#94a3b8').fontSize(8).text('CATATAN', margin, y, { width: contentWidth });
      y += 11;
      const catatanText = [s.catatan, s.catatanPulang].filter(Boolean).join('  |  ');
      doc.fillColor('#334155').fontSize(10).text(catatanText, margin, y, {
        width: contentWidth,
        height: 40,
        ellipsis: true,
      });
      y += 40 + 14;
    }

    y += 6;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 16;

    doc.fontSize(11).fillColor('#0f172a').text('Dokumentasi', margin, y);
    y = doc.y + 10;

    const gap = 12;
    const boxW = (contentWidth - gap) / 2;
    const boxH = 170;

    const [fotoBuf, fotoPulangBuf] = await Promise.all([readFotoBuffer(s.foto), readFotoBuffer(s.fotoPulang)]);
    const ttdBuf = decodeTtdBuffer(s.ttd);
    const ttdPulangBuf = decodeTtdBuffer(s.ttdPulang);

    this.drawMediaBox(doc, margin, y, boxW, boxH, 'Foto Hadir', fotoBuf, 'Foto tidak tersedia');
    this.drawMediaBox(doc, margin + boxW + gap, y, boxW, boxH, 'Foto Pulang', fotoPulangBuf, 'Foto tidak tersedia');
    y += boxH + gap;

    const ttdBoxH = 120;
    this.drawMediaBox(doc, margin, y, boxW, ttdBoxH, 'Tanda Tangan Hadir', ttdBuf, 'TTD tidak tersedia', true);
    this.drawMediaBox(doc, margin + boxW + gap, y, boxW, ttdBoxH, 'Tanda Tangan Pulang', ttdPulangBuf, 'TTD tidak tersedia', true);

    doc
      .fontSize(7)
      .fillColor('#cbd5e1')
      .text(`Dicetak ${new Date().toLocaleString('id-ID')}`, margin, doc.page.maxY() - 14, {
        width: contentWidth,
        align: 'center',
        height: 14,
        lineBreak: false,
      });
  }

  private drawMediaBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    buffer: Buffer | null,
    placeholder: string,
    whiteBg = false,
  ) {
    doc.roundedRect(x, y, w, h, 8).fillAndStroke(whiteBg ? '#ffffff' : '#f8fafc', '#e2e8f0');
    doc.fontSize(8).fillColor('#94a3b8').text(label.toUpperCase(), x + 10, y + 8, { width: w - 20 });

    const imgTop = y + 22;
    const imgH = h - 30;
    if (buffer) {
      try {
        doc.image(buffer, x + 10, imgTop, { fit: [w - 20, imgH], align: 'center', valign: 'center' });
        return;
      } catch {
        // fall through to placeholder — unreadable/corrupt/unsupported image
      }
    }
    doc.fontSize(9).fillColor('#cbd5e1').text(placeholder, x + 10, y + h / 2 - 5, { width: w - 20, align: 'center' });
  }
}
