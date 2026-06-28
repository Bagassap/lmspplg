/**
 * Generate proper PDF files (via pdfkit) for all materi, then update fileUrl in DB.
 * Run from backend/ directory:
 *   npx tsx prisma/seed-files.ts
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

/** Generate a real PDF using pdfkit. Returns a Buffer. */
function generatePDF(judul: string, deskripsi: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Header band ──────────────────────────────────────────────────────────
    doc
      .rect(0, 0, doc.page.width, 90)
      .fill('#1E3A8A');

    doc
      .fillColor('white')
      .fontSize(10)
      .font('Helvetica')
      .text('SMK PPLG — MATERI PEMBELAJARAN', 50, 28, { align: 'center', width: doc.page.width - 100 });

    doc
      .fillColor('white')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(judul, 50, 48, { align: 'center', width: doc.page.width - 100 });

    // ── Body ─────────────────────────────────────────────────────────────────
    const bodyTop = 110;

    if (deskripsi) {
      doc
        .fillColor('#1E293B')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Deskripsi Materi', 50, bodyTop);

      doc
        .fillColor('#334155')
        .fontSize(10)
        .font('Helvetica')
        .text(deskripsi, 50, bodyTop + 20, {
          width: doc.page.width - 100,
          align: 'justify',
        });
    }

    const contentTop = deskripsi ? bodyTop + 80 : bodyTop;

    doc
      .fillColor('#1E293B')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Tujuan Pembelajaran', 50, contentTop);

    const tujuan = [
      'Memahami konsep dan prinsip dasar materi yang dipelajari.',
      'Mampu menerapkan pengetahuan dalam konteks praktis.',
      'Mengembangkan kemampuan analitis dan pemecahan masalah.',
    ];

    let y = contentTop + 20;
    for (const item of tujuan) {
      doc
        .fillColor('#475569')
        .fontSize(10)
        .font('Helvetica')
        .text(`• ${item}`, 60, y, { width: doc.page.width - 120 });
      y += 20;
    }

    // ── Separator line ────────────────────────────────────────────────────────
    doc
      .moveTo(50, y + 10)
      .lineTo(doc.page.width - 50, y + 10)
      .strokeColor('#CBD5E1')
      .stroke();

    // ── Footer note ──────────────────────────────────────────────────────────
    doc
      .fillColor('#94A3B8')
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Dokumen ini merupakan materi pembelajaran yang digunakan di kelas XII PPLG.`,
        50,
        y + 18,
        { align: 'center', width: doc.page.width - 100 },
      );

    doc.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const uploadDir = path.join(process.cwd(), 'uploads', 'materi');
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Upload dir: ${uploadDir}\n`);

  const materiList = await prisma.materiKelas.findMany({
    select: { id: true, judul: true, deskripsi: true, fileUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${materiList.length} materi records\n`);

  let filesWritten = 0;
  let dbUpdated   = 0;

  for (const m of materiList) {
    const slug     = toSlug(m.judul);
    const filename = `${slug}.pdf`;
    const filepath = path.join(uploadDir, filename);
    const fileUrl  = `/uploads/materi/${filename}`;

    // Generate and overwrite with a proper pdfkit PDF
    const pdfBuffer = await generatePDF(m.judul, m.deskripsi ?? '');
    fs.writeFileSync(filepath, pdfBuffer);
    filesWritten++;

    // Update DB record if fileUrl path changed (slug same → no update needed)
    if (m.fileUrl !== fileUrl) {
      await prisma.materiKelas.update({ where: { id: m.id }, data: { fileUrl } });
      dbUpdated++;
    }

    const sizeKb = (pdfBuffer.length / 1024).toFixed(1);
    const label  = m.judul.length > 38 ? m.judul.slice(0, 38) + '…' : m.judul;
    console.log(`  ✓ ${label.padEnd(40)} ${sizeKb.padStart(5)} KB  →  ${filename}`);
  }

  console.log(`\n✅ Selesai. PDF dibuat: ${filesWritten}  |  DB diupdate: ${dbUpdated}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
