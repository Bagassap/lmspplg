import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type SiswaExportRow = {
  nama: string | null;
  nis: string;
  jenisKelamin: string | null;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  noHp: string | null;
  namaOrtu: string | null;
  dukuh: string | null;
  rt: string | null;
  rw: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  user: { mustChangePassword: boolean } | null;
};

type KelasGroup = {
  kelas: { nama: string };
  siswa: SiswaExportRow[];
};

const BRAND = '#6334F4';

function formatTanggalLahir(tempatLahir: string | null, tanggalLahir: Date | null): string {
  const tgl = tanggalLahir
    ? tanggalLahir.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  if (tempatLahir && tgl) return `${tempatLahir}, ${tgl}`;
  return tempatLahir || tgl || '-';
}

function formatAlamat(s: SiswaExportRow): string {
  const parts: string[] = [];
  if (s.dukuh) parts.push(`Dukuh ${s.dukuh}`);
  if (s.rt || s.rw) parts.push(`RT ${s.rt || '-'}/RW ${s.rw || '-'}`);
  if (s.desa) parts.push(`Desa ${s.desa}`);
  if (s.kecamatan) parts.push(`Kec. ${s.kecamatan}`);
  if (s.kabupaten) parts.push(`Kab. ${s.kabupaten}`);
  return parts.length > 0 ? parts.join(', ') : '-';
}

const COLS: { key: string; label: string; width: number }[] = [
  { key: 'no', label: 'NO', width: 24 },
  { key: 'nama', label: 'NAMA', width: 110 },
  { key: 'nis', label: 'NIS', width: 62 },
  { key: 'jk', label: 'JK', width: 26 },
  { key: 'ttl', label: 'TEMPAT & TGL LAHIR', width: 100 },
  { key: 'nohp', label: 'NO. HP', width: 74 },
  { key: 'wali', label: 'NAMA WALI MURID', width: 104 },
  { key: 'alamat', label: 'ALAMAT LENGKAP', width: 170 },
  { key: 'status', label: 'STATUS AKUN', width: 62 },
];
const TABLE_WIDTH = COLS.reduce((sum, c) => sum + c.width, 0);

@Injectable()
export class SiswaPdfService {
  async build(groups: KelasGroup[]): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30, bufferPages: true, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const margin = 30;

    groups.forEach((group) => {
      doc.addPage();
      // doc.page only exists once a page has been added (autoFirstPage: false)
      this.renderKelasSection(doc, group, margin, doc.page.width);
    });

    if (groups.length === 0) {
      doc.addPage();
      doc.fontSize(12).fillColor('#64748b').text('Tidak ada data siswa.', margin, margin);
    }

    doc.end();
    return done;
  }

  private renderKelasSection(doc: PDFKit.PDFDocument, group: KelasGroup, margin: number, pageWidth: number) {
    let y = margin;

    doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 6).fill(BRAND);
    doc.fontSize(14).fillColor('#ffffff').text(`Data Siswa — ${group.kelas.nama}`, margin + 12, y + 9);
    doc
      .fontSize(8)
      .fillColor('#e5e0fb')
      .text(`${group.siswa.length} siswa · dicetak ${new Date().toLocaleDateString('id-ID')}`, margin, y + 12, {
        width: pageWidth - margin * 2 - 12,
        align: 'right',
      });
    y += 34 + 10;

    y = this.drawTableHeader(doc, margin, y);

    group.siswa.forEach((s, i) => {
      if (y + 20 > doc.page.height - margin) {
        doc.addPage();
        y = margin;
        y = this.drawTableHeader(doc, margin, y);
      }
      y = this.drawRow(doc, margin, y, i + 1, s);
    });
  }

  private drawTableHeader(doc: PDFKit.PDFDocument, margin: number, y: number): number {
    doc.rect(margin, y, TABLE_WIDTH, 18).fill('#f1f5f9');
    let x = margin;
    doc.fontSize(7).fillColor('#475569');
    for (const col of COLS) {
      doc.text(col.label, x + 3, y + 6, { width: col.width - 6, height: 12 });
      x += col.width;
    }
    return y + 18;
  }

  private drawRow(doc: PDFKit.PDFDocument, margin: number, y: number, no: number, s: SiswaExportRow): number {
    const rowH = 20;
    const jk = s.jenisKelamin === 'Perempuan' ? 'P' : s.jenisKelamin === 'Laki-laki' ? 'L' : '-';
    const status = s.user?.mustChangePassword === false ? 'Sudah ganti' : 'Belum ganti';
    const statusColor = s.user?.mustChangePassword === false ? '#059669' : '#d97706';

    const values: [string, string][] = [
      [String(no), '#334155'],
      [s.nama || '-', '#0f172a'],
      [s.nis, '#334155'],
      [jk, '#334155'],
      [formatTanggalLahir(s.tempatLahir, s.tanggalLahir), '#334155'],
      [s.noHp || '-', '#334155'],
      [s.namaOrtu || '-', '#334155'],
      [formatAlamat(s), '#334155'],
      [status, statusColor],
    ];

    doc.rect(margin, y, TABLE_WIDTH, rowH).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    let x = margin;
    doc.fontSize(7.5);
    values.forEach(([text, color], i) => {
      const col = COLS[i];
      doc.fillColor(color).text(text, x + 3, y + 6, { width: col.width - 6, height: 14, ellipsis: true });
      x += col.width;
    });
    return y + rowH;
  }
}
