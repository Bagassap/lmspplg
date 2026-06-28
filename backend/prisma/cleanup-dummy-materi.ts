/**
 * Hapus SEMUA record MateriKelas kecuali materi real "Pengenalan Internet dan WWW".
 * File-file PDF dummy di uploads/materi/ juga dihapus lewat script ini.
 * Jalankan SEKALI dengan: npx tsx prisma/cleanup-dummy-materi.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/materi');
const KEEP_JUDUL = 'Pengenalan Internet dan WWW Materi Mata Kuliah Pemrograman Web - Sistem Informasi';

async function main() {
  // 1. Ambil semua materi yang BUKAN yang real
  const toDelete = await prisma.materiKelas.findMany({
    where: { judul: { not: KEEP_JUDUL } },
    select: { id: true, judul: true, fileUrl: true },
  });

  console.log(`\n🗑  Akan hapus ${toDelete.length} record dummy dari database:`);
  for (const m of toDelete) {
    console.log(`   • [${m.id}] ${m.judul}`);
  }

  if (toDelete.length === 0) {
    console.log('   (tidak ada yang perlu dihapus)');
  } else {
    const { count } = await prisma.materiKelas.deleteMany({
      where: { judul: { not: KEEP_JUDUL } },
    });
    console.log(`\n✅ ${count} record dihapus dari database.`);
  }

  // 2. Verifikasi sisa
  const remaining = await prisma.materiKelas.findMany({
    select: { id: true, judul: true, fileUrl: true },
  });
  console.log(`\n📋 Sisa di database: ${remaining.length} materi`);
  for (const m of remaining) {
    console.log(`   ✓ ${m.judul} (fileUrl: ${m.fileUrl ?? 'null'})`);
  }

  // 3. Hapus file PDF dummy dari uploads/materi/ — sisakan hanya pengenalan-internet-www.pdf
  const KEEP_FILE = 'pengenalan-internet-www.pdf';
  let filesDeleted = 0;
  let filesKept = 0;

  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    console.log(`\n🗂  Folder ${UPLOADS_DIR}: ${files.length} file`);
    for (const file of files) {
      if (file === KEEP_FILE) {
        console.log(`   ✓ Sisakan: ${file}`);
        filesKept++;
      } else {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
        console.log(`   🗑 Hapus: ${file}`);
        filesDeleted++;
      }
    }
    console.log(`\n✅ File dihapus: ${filesDeleted}, disisakan: ${filesKept}`);
  } else {
    console.warn(`\n⚠  Folder tidak ditemukan: ${UPLOADS_DIR}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
