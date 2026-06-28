import 'dotenv/config';
import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const SALT_ROUNDS = 10;
  const DEFAULT_PASSWORD = 'password123';
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lms-pplg.sch.id' },
    update: {},
    create: {
      nama: 'Administrator',
      email: 'admin@lms-pplg.sch.id',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log('✓ Admin:', adminUser.email);

  // Guru
  const guruUser = await prisma.user.upsert({
    where: { email: 'budi.santoso@lms-pplg.sch.id' },
    update: {},
    create: {
      nama: 'Budi Santoso, S.Kom',
      email: 'budi.santoso@lms-pplg.sch.id',
      password: hashedPassword,
      role: Role.GURU,
      guru: {
        create: {
          nip: '198501012010011001',
        },
      },
    },
  });
  console.log('✓ Guru:', guruUser.email);

  // Siswa (login pakai NIS)
  const siswaUser = await prisma.user.upsert({
    where: { email: 'andi.pratama@siswa.lms-pplg.sch.id' },
    update: {},
    create: {
      nama: 'Andi Pratama',
      email: 'andi.pratama@siswa.lms-pplg.sch.id',
      password: hashedPassword,
      role: Role.SISWA,
      siswa: {
        create: {
          nis: '0123456789',
          kelas: 'XII RPL 1',
          angkatan: 2024,
        },
      },
    },
  });
  console.log('✓ Siswa:', siswaUser.email, '| NIS: 0123456789');

  console.log('\n─────────────────────────────────────');
  console.log('Akun demo berhasil dibuat:');
  console.log('  Admin  → email: admin@lms-pplg.sch.id          | pass: password123');
  console.log('  Guru   → email: budi.santoso@lms-pplg.sch.id   | pass: password123');
  console.log('  Siswa  → NIS: 0123456789                        | pass: password123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
