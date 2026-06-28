/**
 * Tambah materi "Pengenalan Internet dan WWW" ke jadwal Pemrograman Web.
 * Jalankan dengan: npx tsx prisma/add-materi-pengenalan-internet.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const jadwal = await prisma.jadwalKelas.findFirst({
    where: { mataPelajaran: 'Pemrograman Web', kelas: 'XII RPL 1' },
  });

  if (!jadwal) {
    console.error('❌ Jadwal "Pemrograman Web / XII RPL 1" tidak ditemukan');
    process.exit(1);
  }

  const existing = await prisma.materiKelas.findFirst({
    where: {
      jadwalKelasId: jadwal.id,
      judul: 'Pengenalan Internet dan WWW Materi Mata Kuliah Pemrograman Web - Sistem Informasi',
    },
  });

  if (existing) {
    const updated = await prisma.materiKelas.update({
      where: { id: existing.id },
      data: {
        deskripsi: 'Pemrograman adalah proses menulis, menguji, dan memelihara serangkaian instruksi yang memungkinkan komputer untuk melakukan tugas tertentu. Bidang ini mencakup berbagai topik mulai dari logika dasar, penulisan kode, hingga pengembangan perangkat lunak yang kompleks',
        fileUrl: '/uploads/materi/pengenalan-internet-www.pdf',
      },
    });
    console.log('✅ Materi diupdate:', updated.id);
    return;
  }

  const created = await prisma.materiKelas.create({
    data: {
      jadwalKelasId: jadwal.id,
      judul: 'Pengenalan Internet dan WWW Materi Mata Kuliah Pemrograman Web - Sistem Informasi',
      deskripsi: 'Pemrograman adalah proses menulis, menguji, dan memelihara serangkaian instruksi yang memungkinkan komputer untuk melakukan tugas tertentu. Bidang ini mencakup berbagai topik mulai dari logika dasar, penulisan kode, hingga pengembangan perangkat lunak yang kompleks',
      fileUrl: '/uploads/materi/pengenalan-internet-www.pdf',
    },
  });

  console.log('✅ Materi baru dibuat:', created.id, '→', created.judul);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
