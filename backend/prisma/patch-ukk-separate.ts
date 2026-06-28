import 'dotenv/config';
import { PrismaClient, TipeUKK } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

async function main() {
  // Real PDF files yang ada di disk
  const JADWAL_FILE = '1782545083546-777607868.pdf';
  const SOAL_FILE   = '1782546161805-773770192.pdf';
  const DRIVE_LINK  = 'https://drive.google.com/drive/folders/1wyMQNai5lNFoCg8AA45bvzqLRZ3_b40z?usp=drive_link';

  // 1. Hapus SEMUA soal dari 4 task dummy (beserta submisinya)
  const tasks = await prisma.tahapanUKK.findMany({ where: { judul: 'UKK Internal Hari 1' } });
  for (const t of tasks) {
    await prisma.soalTahapanUKK.deleteMany({ where: { tahapanId: t.id } });
  }
  console.log(`✓ Hapus semua soal dari ${tasks.length} task`);

  // 2. Hapus global container lama kalau ada
  await prisma.tahapanUKK.deleteMany({ where: { hariKe: 0 } });
  console.log('✓ Hapus global container lama (jika ada)');

  // 3. Buat 1 global container (hariKe: 0 = tidak tampil di task list)
  const global = await prisma.tahapanUKK.create({
    data: {
      tipe:      TipeUKK.INTERNAL,
      hariKe:    0,
      judul:     '__global__',
      tanggal:   new Date('2025-06-28'),
      jamMulai:  '08:00',
      jamSelesai: '11:00',
      lokasi:    '-',
      keterangan: 'Container global untuk file jadwal & soal (bukan task)',
    },
  });
  console.log('✓ Global container dibuat (hariKe: 0)');

  // 4. Tambah 1 jadwal file ke global container
  await prisma.soalTahapanUKK.create({
    data: {
      tahapanId: global.id,
      judul:     'Jadwal UKK Internal',
      deskripsi: '__jadwal__:Jadwal pelaksanaan UKK Internal',
      fileUrl:   `/uploads/ukk-soal/${JADWAL_FILE}`,
      fileName:  'Jadwal-UKK-Internal.pdf',
    },
  });

  // 5. Tambah 1 soal file ke global container + buat submisi 12 siswa
  const soal = await prisma.soalTahapanUKK.create({
    data: {
      tahapanId: global.id,
      judul:     'Soal Project UKK Internal',
      deskripsi: 'Buat aplikasi berbasis web sesuai tema yang diberikan',
      fileUrl:   `/uploads/ukk-soal/${SOAL_FILE}`,
      fileName:  'Soal-UKK-Internal.pdf',
    },
  });
  console.log('✓ 1 jadwal file + 1 soal file di global container');

  // 6. Re-create 12 submisi dummy (semua ke soal global)
  const emails = [
    'rizky.firmansyah@siswa.lms-pplg.sch.id','dinda.ayu@siswa.lms-pplg.sch.id','farhan.maulana@siswa.lms-pplg.sch.id',
    'siti.nurhaliza@siswa.lms-pplg.sch.id','bima.sakti@siswa.lms-pplg.sch.id','nadia.putri@siswa.lms-pplg.sch.id',
    'eko.prasetyo@siswa.lms-pplg.sch.id','lina.marlina@siswa.lms-pplg.sch.id','wahyu.hidayat@siswa.lms-pplg.sch.id',
    'anggi.septiani@siswa.lms-pplg.sch.id','rendi.saputra@siswa.lms-pplg.sch.id','mega.wulandari@siswa.lms-pplg.sch.id',
  ];
  let count = 0;
  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email }, include: { siswa: true } });
    if (!user?.siswa) continue;
    await prisma.submisiProjectUKK.upsert({
      where: { soalId_siswaId: { soalId: soal.id, siswaId: user.siswa.id } },
      update: { fileUrl: DRIVE_LINK, fileName: 'Google Drive' },
      create: { soalId: soal.id, siswaId: user.siswa.id, fileUrl: DRIVE_LINK, fileName: 'Google Drive' },
    });
    count++;
  }
  console.log(`✓ ${count} submisi siswa ke global soal`);

  console.log('\n── Selesai!');
  console.log('   Global container (hariKe:0): 1 jadwal + 1 soal');
  console.log('   4 Task (hariKe:1): hanya jadwal/lokasi/penguji, tanpa soal');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
