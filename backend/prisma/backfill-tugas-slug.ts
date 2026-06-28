/**
 * Backfill slug untuk semua TugasKelas yang belum punya slug.
 * Jalankan SEKALI dengan: npx tsx prisma/backfill-tugas-slug.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function toSlug(judul: string): string {
  return judul
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
  const existing = await prisma.tugasKelas.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  const usedSlugs = new Set(existing.map((t) => t.slug!));

  const toBackfill = await prisma.tugasKelas.findMany({
    where: { slug: null },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n📋 ${toBackfill.length} tugas tanpa slug`);

  for (const t of toBackfill) {
    const base = toSlug(t.judul);
    let slug = base;
    let i = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${i++}`;
    }
    usedSlugs.add(slug);
    await prisma.tugasKelas.update({ where: { id: t.id }, data: { slug } });
    console.log(`   ✓ "${t.judul}" → ${slug}`);
  }

  console.log(`\n✅ Selesai. ${toBackfill.length} slug dibuat.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
