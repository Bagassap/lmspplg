import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

const SISWA_PER_LAB: Record<string, string[]> = {
  'Lab RPS 1': ['rizky.firmansyah@siswa.lms-pplg.sch.id','dinda.ayu@siswa.lms-pplg.sch.id','farhan.maulana@siswa.lms-pplg.sch.id'],
  'Lab RPS 2': ['siti.nurhaliza@siswa.lms-pplg.sch.id','bima.sakti@siswa.lms-pplg.sch.id','nadia.putri@siswa.lms-pplg.sch.id'],
  'Lab RPS 3': ['eko.prasetyo@siswa.lms-pplg.sch.id','lina.marlina@siswa.lms-pplg.sch.id','wahyu.hidayat@siswa.lms-pplg.sch.id'],
  'Lab RPS 4': ['anggi.septiani@siswa.lms-pplg.sch.id','rendi.saputra@siswa.lms-pplg.sch.id','mega.wulandari@siswa.lms-pplg.sch.id'],
};

async function main() {
  // Ambil semua tahapan real (hariKe > 0)
  const tahapanList = await prisma.tahapanUKK.findMany({
    where: { hariKe: { gt: 0 } },
  });
  console.log(`✓ ${tahapanList.length} tahapan ditemukan`);

  // Hapus assignment lama
  await prisma.pesertaUKK.deleteMany({});
  console.log('✓ Assignment lama dihapus');

  let total = 0;
  for (const tahapan of tahapanList) {
    const emails = SISWA_PER_LAB[tahapan.lokasi];
    if (!emails) { console.log(`  ⚠ Tidak ada mapping untuk lokasi: ${tahapan.lokasi}`); continue; }

    for (const email of emails) {
      const user = await prisma.user.findUnique({ where: { email }, include: { siswa: true } });
      if (!user?.siswa) { console.log(`  ⚠ Siswa tidak ditemukan: ${email}`); continue; }

      await prisma.pesertaUKK.upsert({
        where: { siswaId_tahapanId: { siswaId: user.siswa.id, tahapanId: tahapan.id } },
        update: {},
        create: { siswaId: user.siswa.id, tahapanId: tahapan.id },
      });
      total++;
    }
    console.log(`  ✓ ${tahapan.lokasi} → ${emails.length} siswa di-assign`);
  }

  console.log(`\n✓ Selesai. Total ${total} assignment peserta UKK.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
