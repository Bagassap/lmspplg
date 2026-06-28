/**
 * One-time script: generate slugs for all existing JadwalKelas records.
 * Run: npx ts-node -r tsconfig-paths/register prisma/backfill-slugs.ts
 */
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function toBaseSlug(mataPelajaran: string, kelas: string): string {
  return `${mataPelajaran}-${kelas}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function main() {
  const list = await prisma.jadwalKelas.findMany({
    orderBy: [{ mataPelajaran: 'asc' }, { kelas: 'asc' }, { hari: 'asc' }],
  });

  const used = new Set<string>();

  for (const jadwal of list) {
    if (jadwal.slug) {
      used.add(jadwal.slug);
      console.log(`SKIP  ${jadwal.id} — already has slug: ${jadwal.slug}`);
      continue;
    }

    const base = toBaseSlug(jadwal.mataPelajaran, jadwal.kelas);
    let slug = base;

    if (used.has(slug)) {
      slug = `${base}-${jadwal.hari.toLowerCase().replace(/\s+/g, '-')}`;
    }
    if (used.has(slug)) {
      let i = 2;
      while (used.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }

    used.add(slug);
    await prisma.jadwalKelas.update({ where: { id: jadwal.id }, data: { slug } });
    console.log(`SET   ${jadwal.id} → ${slug}  (${jadwal.mataPelajaran} · ${jadwal.kelas} · ${jadwal.hari})`);
  }

  console.log('\nDone. Total records processed:', list.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
