import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { join } from 'path';
import { ASPEK_NILAI } from './aspek-nilai';

export type NilaiPdfData = {
  nama: string;
  nis: string;
  kelas: string;
  rows: { judul: string; skor: Record<string, number>; rataRata: number }[];
};

const UNGU = '#3E03B3';
const UNGU_MUDA = '#EFE9FD';
const FONT_REGULAR = join(process.cwd(), 'src', 'assets', 'fonts', 'Satoshi-Regular.ttf');
const FONT_BOLD = join(process.cwd(), 'src', 'assets', 'fonts', 'Satoshi-Bold.ttf');

@Injectable()
export class UjianUkkPdfService {
  async buildNilai(data: NilaiPdfData): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    doc.registerFont('Satoshi', FONT_REGULAR);
    doc.registerFont('Satoshi-Bold', FONT_BOLD);
    doc.font('Satoshi');
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const margin = 40;
    const lebar = doc.page.width - margin * 2;
    const bawah = doc.page.height - margin;

    doc.font('Satoshi-Bold').fontSize(18).fillColor(UNGU).text('Nilai Ujian Kompetensi Keahlian', margin, margin, { width: lebar });
    doc.moveDown(0.4);
    doc.font('Satoshi').fontSize(10).fillColor('#334155');
    doc.text(`Nama   : ${data.nama}`);
    doc.text(`NIS      : ${data.nis}`);
    doc.text(`Kelas   : ${data.kelas}`);
    doc.moveDown(1);

    for (const row of data.rows) {
      if (doc.y + 24 * (ASPEK_NILAI.length + 3) > bawah) doc.addPage();
      const y0 = doc.y;
      doc.roundedRect(margin, y0, lebar, 24, 6).fill(UNGU);
      doc.font('Satoshi-Bold').fontSize(11).fillColor('#FFFFFF').text(row.judul, margin + 10, y0 + 7, { width: lebar - 20, lineBreak: false, ellipsis: true });
      let y = y0 + 28;
      const kolNilai = 60;
      ASPEK_NILAI.forEach((a, i) => {
        const tinggi = Math.max(22, doc.font('Satoshi').fontSize(9.5).heightOfString(a.label, { width: lebar - 40 - kolNilai - 20 }) + 10);
        if (i % 2 === 0) doc.rect(margin, y, lebar, tinggi).fill('#F8FAFC');
        doc.font('Satoshi').fontSize(9.5).fillColor('#0F172A');
        doc.text(String(i + 1), margin + 10, y + 6, { width: 20 });
        doc.text(a.label, margin + 40, y + 6, { width: lebar - 40 - kolNilai - 20 });
        doc.font('Satoshi-Bold').text(String(row.skor[a.key] ?? '-'), margin + lebar - kolNilai - 10, y + 6, { width: kolNilai, align: 'right' });
        y += tinggi;
      });
      const jumlah = ASPEK_NILAI.reduce((t, a) => t + (row.skor[a.key] ?? 0), 0);
      doc.roundedRect(margin, y + 4, lebar, 26, 6).fill(UNGU_MUDA);
      doc.font('Satoshi-Bold').fontSize(10).fillColor(UNGU);
      doc.text(`Jumlah: ${jumlah}`, margin + 10, y + 12, { width: lebar / 2 - 10 });
      doc.text(`Rata-rata (nilai): ${row.rataRata}`, margin + lebar / 2, y + 12, { width: lebar / 2 - 10, align: 'right' });
      doc.y = y + 44;
    }

    if (data.rows.length > 1) {
      const akhir = Math.round((data.rows.reduce((t, r) => t + r.rataRata, 0) / data.rows.length) * 100) / 100;
      if (doc.y + 40 > bawah) doc.addPage();
      doc.font('Satoshi-Bold').fontSize(12).fillColor(UNGU).text(`Rata-rata seluruh task: ${akhir}`, margin, doc.y, { width: lebar, align: 'right' });
    }

    const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
    const rentang = doc.bufferedPageRange();
    for (let i = rentang.start; i < rentang.start + rentang.count; i++) {
      doc.switchToPage(i);
      doc.font('Satoshi').fontSize(8).fillColor('#94A3B8').text(`Dicetak ${tanggal}  |  Halaman ${i + 1} dari ${rentang.count}`, margin, doc.page.height - 30, { width: lebar, align: 'center', lineBreak: false });
    }
    doc.end();
    return done;
  }
}
