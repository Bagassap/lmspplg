import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.join(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

type SiswaRow = {
  nis: string;
  nama: string;
  jenisKelamin: string;
  kelas: string;
  jurusan: string;
  angkatan: number;
  waliKelas: string | null;
};

function splitLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function kelasToJurusan(kelas: string): string {
  if (kelas.includes('Gim') && kelas.startsWith('XI')) return 'Pengembangan Gim';
  if (kelas.includes('Rekayasa')) return 'Rekayasa Perangkat Lunak';
  return 'Pengembangan Perangkat Lunak dan Gim';
}

function kelasToAngkatan(kelas: string): number {
  return kelas.startsWith('X ') ? 2025 : 2024;
}

function parseCSV(content: string): SiswaRow[] {
  const lines = content.split('\n').map((l) => l.trimEnd());
  const rows: SiswaRow[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith('Kelas')) { i++; continue; }

    // Extract 3 class names from the Kelas header row (cols 3, 9, 15)
    const cols = splitLine(line);
    const classNames: string[] = [
      cols[3] ?? '',
      cols[9] ?? '',
      cols[15] ?? '',
    ];

    // Extract wali kelas from the next row (same col positions: 3, 9, 15)
    const waliLine = lines[i + 1] ?? '';
    const waliCols = splitLine(waliLine);
    const waliKelasNames: (string | null)[] = [
      waliCols[3] ? waliCols[3].trim() : null,
      waliCols[9] ? waliCols[9].trim() : null,
      waliCols[15] ? waliCols[15].trim() : null,
    ];

    // Skip: wali, header row, blank row  → data starts at i+4
    let j = i + 4;

    while (j < lines.length) {
      const raw = lines[j];

      // Two consecutive empty lines or a new Kelas block → end of section
      if (!raw || raw.trim() === '') {
        j++;
        if (j < lines.length && (!lines[j] || lines[j].trim() === '')) break;
        continue;
      }
      if (raw.startsWith('Kelas')) break;

      const c = splitLine(raw);

      for (let g = 0; g < 3; g++) {
        const base = g * 6;
        const nis = c[base + 1] ?? '';
        const gender = c[base + 2] ?? '';
        const nama = c[base + 3] ?? '';

        if (nis && nama && /^\d+$/.test(nis)) {
          const kelas = classNames[g];
          rows.push({
            nis,
            nama: nama.trim(),
            jenisKelamin: gender === 'L' ? 'Laki-laki' : gender === 'P' ? 'Perempuan' : '',
            kelas,
            jurusan: kelasToJurusan(kelas),
            angkatan: kelasToAngkatan(kelas),
            waliKelas: waliKelasNames[g],
          });
        }
      }
      j++;
    }

    i = j;
  }

  return rows;
}

async function main() {
  const csvPath = path.join(__dirname, '../csv/data.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');

  const rows = parseCSV(content);
  console.log(`Parsed ${rows.length} siswa dari CSV`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      await prisma.siswa.upsert({
        where: { nis: row.nis },
        update: {
          nama: row.nama,
          kelas: row.kelas,
          jurusan: row.jurusan,
          angkatan: row.angkatan,
          jenisKelamin: row.jenisKelamin || null,
          waliKelas: row.waliKelas,
        },
        create: {
          nis: row.nis,
          nama: row.nama,
          kelas: row.kelas,
          jurusan: row.jurusan,
          angkatan: row.angkatan,
          jenisKelamin: row.jenisKelamin || null,
          waliKelas: row.waliKelas,
        },
      });
      imported++;
    } catch (err) {
      console.error(`Skip ${row.nis} (${row.nama}): ${String(err)}`);
      skipped++;
    }
  }

  console.log(`Selesai: ${imported} diimpor, ${skipped} dilewati`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
