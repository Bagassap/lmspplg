// Memindahkan satu siswa ke kelas lain.
//
//   npm run siswa:pindah-kelas -- "Bagas Demo" "12 PG 1"
//   npm run siswa:pindah-kelas -- "Bagas Demo" "12 PG 1" --dry-run
//   npm run siswa:pindah-kelas -- "Bagas Demo" "12 PG 1" --buat-kelas
//
// Argumen pertama bisa nama siswa, NIS, atau loginId. Kalau lebih dari satu
// siswa cocok, skrip berhenti dan menampilkan daftarnya (tidak menebak).
// Kelas tujuan harus sudah ada, kecuali diberi --buat-kelas.
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
  const [kunci, namaKelas] = args;
  const dryRun = flags.has('--dry-run');

  if (!kunci || !namaKelas) {
    console.error('Pemakaian: npm run siswa:pindah-kelas -- "<nama/NIS/loginId siswa>" "<nama kelas>" [--dry-run] [--buat-kelas]');
    process.exit(1);
  }

  const siswaList = await prisma.siswa.findMany({
    where: {
      OR: [
        { nama: { equals: kunci, mode: 'insensitive' } },
        { nis: kunci },
        { user: { nama: { equals: kunci, mode: 'insensitive' } } },
        { user: { loginId: kunci } },
      ],
    },
    include: { kelas: true, user: { select: { nama: true, loginId: true } } },
  });

  if (siswaList.length === 0) {
    console.error(`Tidak ada siswa yang cocok dengan "${kunci}".`);
    process.exit(1);
  }
  if (siswaList.length > 1) {
    console.error(`Ada ${siswaList.length} siswa yang cocok dengan "${kunci}", pakai NIS supaya tepat:`);
    for (const s of siswaList) console.error(`  - ${s.nama ?? s.user?.nama} | NIS ${s.nis} | kelas ${s.kelas.nama}`);
    process.exit(1);
  }
  const siswa = siswaList[0];

  let kelas = await prisma.kelas.findUnique({ where: { nama: namaKelas } });
  if (!kelas) {
    if (!flags.has('--buat-kelas')) {
      const semua = await prisma.kelas.findMany({ orderBy: { nama: 'asc' }, select: { nama: true } });
      console.error(`Kelas "${namaKelas}" belum ada. Kelas yang ada: ${semua.map((k) => k.nama).join(', ') || '(kosong)'}`);
      console.error('Tambahkan --buat-kelas untuk membuatnya.');
      process.exit(1);
    }
    if (!dryRun) kelas = await prisma.kelas.create({ data: { nama: namaKelas } });
    console.log(`${dryRun ? '[dry-run] akan membuat' : 'dibuat'} kelas "${namaKelas}"`);
  }

  const nama = siswa.nama ?? siswa.user?.nama ?? '(tanpa nama)';
  if (kelas && siswa.kelasId === kelas.id) {
    console.log(`${nama} sudah berada di kelas ${kelas.nama}. Tidak ada yang diubah.`);
    return;
  }

  console.log(`${nama} (NIS ${siswa.nis}): ${siswa.kelas.nama} -> ${namaKelas}`);
  if (dryRun || !kelas) {
    console.log('[dry-run] tidak ada perubahan yang disimpan.');
    return;
  }
  await prisma.siswa.update({ where: { id: siswa.id }, data: { kelasId: kelas.id } });
  console.log('Selesai. Siswa sudah dipindahkan.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
