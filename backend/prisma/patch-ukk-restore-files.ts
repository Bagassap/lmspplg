import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

// File PDF nyata yang ada di disk (dari ls uploads/ukk-soal/)
const REAL_FILES = [
  '1782545083546-777607868.pdf',
  '1782546161805-773770192.pdf',
  '1782546279822-822325118.pdf',
  '1782546542716-402080010.pdf',
];

async function main() {
  // 1. Hapus semua soal dummy yang fileUrl-nya palsu
  const deleted = await prisma.soalTahapanUKK.deleteMany({
    where: {
      fileUrl: { in: ['/uploads/ukk-soal/dummy-soal.pdf', '/uploads/ukk-soal/dummy-jadwal.pdf'] },
    },
  });
  console.log(`✓ Hapus ${deleted.count} soal dummy (path palsu)`);

  // 2. Ambil semua tahapan dummy yang dibuat sebelumnya
  const tahapanList = await prisma.tahapanUKK.findMany({
    where: { judul: 'UKK Internal Hari 1' },
    orderBy: { lokasi: 'asc' },
  });
  console.log(`✓ Ditemukan ${tahapanList.length} tahapan dummy\n`);

  // Pakai 2 file pertama: [0] = jadwal, [1] = soal
  // (keduanya adalah file real yang diupload sebelumnya)
  const jadwalFile = REAL_FILES[0];
  const soalFile   = REAL_FILES[1];

  for (const tahapan of tahapanList) {
    // Buat 1 item jadwal (prefix __jadwal__:) per tahapan
    const jadwal = await prisma.soalTahapanUKK.create({
      data: {
        tahapanId: tahapan.id,
        judul:     'Jadwal UKK Internal',
        deskripsi: `__jadwal__:Jadwal ${tahapan.lokasi}`,
        fileUrl:   `/uploads/ukk-soal/${jadwalFile}`,
        fileName:  'Jadwal-UKK-Internal.pdf',
      },
    });

    // Buat 1 item soal (regular) per tahapan
    const soal = await prisma.soalTahapanUKK.create({
      data: {
        tahapanId: tahapan.id,
        judul:     'Soal Project UKK Internal',
        deskripsi: 'Buat aplikasi berbasis web sesuai tema yang diberikan',
        fileUrl:   `/uploads/ukk-soal/${soalFile}`,
        fileName:  'Soal-UKK-Internal.pdf',
      },
    });

    // Pindahkan submisi dari soal lama (sudah terhapus) ke soal baru
    // Cari siswa yang belum punya submisi di soal ini
    const siswaSubmisi = await prisma.submisiProjectUKK.findMany({
      where: { soal: { tahapanId: tahapan.id } },
    });

    // Buat ulang submisi yang sempat kehilangan soalId-nya
    // (ambil dari siswa dummy yang ada di lokasi ini)
    const DRIVE_LINK = 'https://drive.google.com/drive/folders/1wyMQNai5lNFoCg8AA45bvzqLRZ3_b40z?usp=drive_link';
    const SISWA_PER_LOKASI: Record<string, string[]> = {
      'Lab RPS 1': ['rizky.firmansyah@siswa.lms-pplg.sch.id','dinda.ayu@siswa.lms-pplg.sch.id','farhan.maulana@siswa.lms-pplg.sch.id'],
      'Lab RPS 2': ['siti.nurhaliza@siswa.lms-pplg.sch.id','bima.sakti@siswa.lms-pplg.sch.id','nadia.putri@siswa.lms-pplg.sch.id'],
      'Lab RPS 3': ['eko.prasetyo@siswa.lms-pplg.sch.id','lina.marlina@siswa.lms-pplg.sch.id','wahyu.hidayat@siswa.lms-pplg.sch.id'],
      'Lab RPS 4': ['anggi.septiani@siswa.lms-pplg.sch.id','rendi.saputra@siswa.lms-pplg.sch.id','mega.wulandari@siswa.lms-pplg.sch.id'],
    };

    const emails = SISWA_PER_LOKASI[tahapan.lokasi] ?? [];
    for (const email of emails) {
      const user = await prisma.user.findUnique({ where: { email }, include: { siswa: true } });
      if (!user?.siswa) continue;
      await prisma.submisiProjectUKK.upsert({
        where: { soalId_siswaId: { soalId: soal.id, siswaId: user.siswa.id } },
        update: {},
        create: { soalId: soal.id, siswaId: user.siswa.id, fileUrl: DRIVE_LINK, fileName: 'Google Drive' },
      });
    }

    console.log(`  ✓ ${tahapan.lokasi} — jadwal + soal dibuat ulang, ${emails.length} submisi dipulihkan`);
  }

  console.log('\n── Selesai. File real PDF terhubung kembali ke database.');
  console.log(`   File Jadwal : ${jadwalFile}`);
  console.log(`   File Soal   : ${soalFile}`);
  console.log('   (2 file lainnya masih ada di disk tapi belum dipakai — bisa dihapus manual jika tidak dibutuhkan)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
