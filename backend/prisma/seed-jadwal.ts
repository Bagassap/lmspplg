/**
 * Seed dummy data untuk jadwal kelas PPLG.
 * Jalankan dengan:
 *   npx ts-node --require tsconfig-paths/register prisma/seed-jadwal.ts
 *
 * Script ini aman dijalankan berulang kali (upsert).
 */

import 'dotenv/config';
import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PASS = 'password123';

// ─── Guru dummy ───────────────────────────────────────────────────────────────

const GURU_DATA = [
  {
    email: 'budi.santoso@lms-pplg.sch.id',
    nama: 'Budi Santoso, S.Kom',
    nip: '198501012010011001',
    noWa: '6281234567801',
  },
  {
    email: 'siti.rahayu@lms-pplg.sch.id',
    nama: 'Siti Rahayu, S.Pd',
    nip: '198702152012012002',
    noWa: '6281234567802',
  },
  {
    email: 'ahmad.fauzi@lms-pplg.sch.id',
    nama: 'Ahmad Fauzi, S.T',
    nip: '199003302013011003',
    noWa: '6281234567803',
  },
  {
    email: 'dewi.kurniasih@lms-pplg.sch.id',
    nama: 'Dewi Kurniasih, S.Kom',
    nip: '199105202014012004',
    noWa: '6281234567804',
  },
  {
    email: 'rudi.hartono@lms-pplg.sch.id',
    nama: 'Rudi Hartono, S.Pd',
    nip: '198808122015011005',
    noWa: '6281234567805',
  },
];

// ─── Siswa dummy ──────────────────────────────────────────────────────────────

const SISWA_DATA = [
  // XII RPL 1
  { email: 's.andi@siswa.lms-pplg.sch.id', nama: 'Andi Pratama', nis: '0001', kelas: 'XII RPL 1', angkatan: 2024 },
  { email: 's.bina@siswa.lms-pplg.sch.id', nama: 'Bina Sari', nis: '0002', kelas: 'XII RPL 1', angkatan: 2024 },
  { email: 's.candra@siswa.lms-pplg.sch.id', nama: 'Candra Wijaya', nis: '0003', kelas: 'XII RPL 1', angkatan: 2024 },
  { email: 's.dini@siswa.lms-pplg.sch.id', nama: 'Dini Ramadhani', nis: '0004', kelas: 'XII RPL 1', angkatan: 2024 },
  { email: 's.eka@siswa.lms-pplg.sch.id', nama: 'Eka Prasetya', nis: '0005', kelas: 'XII RPL 1', angkatan: 2024 },
  // XII RPL 2
  { email: 's.faiz@siswa.lms-pplg.sch.id', nama: 'Faiz Abimanyu', nis: '0006', kelas: 'XII RPL 2', angkatan: 2024 },
  { email: 's.gita@siswa.lms-pplg.sch.id', nama: 'Gita Novelia', nis: '0007', kelas: 'XII RPL 2', angkatan: 2024 },
  { email: 's.haris@siswa.lms-pplg.sch.id', nama: 'Haris Maulana', nis: '0008', kelas: 'XII RPL 2', angkatan: 2024 },
  // XI RPL 1
  { email: 's.indra@siswa.lms-pplg.sch.id', nama: 'Indra Kusuma', nis: '0009', kelas: 'XI RPL 1', angkatan: 2025 },
  { email: 's.julia@siswa.lms-pplg.sch.id', nama: 'Julia Anggraeni', nis: '0010', kelas: 'XI RPL 1', angkatan: 2025 },
  { email: 's.kevin@siswa.lms-pplg.sch.id', nama: 'Kevin Ardianto', nis: '0011', kelas: 'XI RPL 1', angkatan: 2025 },
];

// ─── Jadwal dummy ─────────────────────────────────────────────────────────────

type JadwalDef = {
  hari: string;
  kelas: string;
  mataPelajaran: string;
  jamMulai: string;
  jamSelesai: string;
  ruangan?: string;
  guruEmail: string;
};

const JADWAL_DATA: JadwalDef[] = [
  // ── XII RPL 1 ──────────────────────────────────────────────────
  { hari: 'Senin',  kelas: 'XII RPL 1', mataPelajaran: 'Pemrograman Web',            jamMulai: '07:00', jamSelesai: '08:30', ruangan: 'Lab Komputer 1', guruEmail: 'budi.santoso@lms-pplg.sch.id' },
  { hari: 'Senin',  kelas: 'XII RPL 1', mataPelajaran: 'Basis Data',                 jamMulai: '08:30', jamSelesai: '10:00', ruangan: 'Lab Komputer 1', guruEmail: 'ahmad.fauzi@lms-pplg.sch.id' },
  { hari: 'Senin',  kelas: 'XII RPL 1', mataPelajaran: 'Matematika',                 jamMulai: '10:15', jamSelesai: '11:45', ruangan: 'Kelas XII-A',    guruEmail: 'siti.rahayu@lms-pplg.sch.id' },
  { hari: 'Selasa', kelas: 'XII RPL 1', mataPelajaran: 'PKK',                        jamMulai: '07:00', jamSelesai: '08:30', ruangan: 'Kelas XII-A',    guruEmail: 'dewi.kurniasih@lms-pplg.sch.id' },
  { hari: 'Selasa', kelas: 'XII RPL 1', mataPelajaran: 'Bahasa Indonesia',           jamMulai: '08:30', jamSelesai: '10:00', ruangan: 'Kelas XII-A',    guruEmail: 'siti.rahayu@lms-pplg.sch.id' },
  { hari: 'Selasa', kelas: 'XII RPL 1', mataPelajaran: 'Pendidikan Agama Islam',     jamMulai: '10:15', jamSelesai: '11:45', ruangan: 'Kelas XII-A',    guruEmail: 'rudi.hartono@lms-pplg.sch.id' },
  { hari: 'Rabu',   kelas: 'XII RPL 1', mataPelajaran: 'Pemrograman Berorientasi Objek', jamMulai: '07:00', jamSelesai: '08:30', ruangan: 'Lab Komputer 1', guruEmail: 'budi.santoso@lms-pplg.sch.id' },
  { hari: 'Rabu',   kelas: 'XII RPL 1', mataPelajaran: 'Jaringan Komputer',          jamMulai: '08:30', jamSelesai: '10:00', ruangan: 'Lab Komputer 2', guruEmail: 'ahmad.fauzi@lms-pplg.sch.id' },
  { hari: 'Kamis',  kelas: 'XII RPL 1', mataPelajaran: 'Desain Grafis Percetakan',   jamMulai: '07:00', jamSelesai: '08:30', ruangan: 'Lab Multimedia', guruEmail: 'dewi.kurniasih@lms-pplg.sch.id' },
  { hari: 'Kamis',  kelas: 'XII RPL 1', mataPelajaran: 'Bahasa Inggris',             jamMulai: '08:30', jamSelesai: '10:00', ruangan: 'Kelas XII-A',    guruEmail: 'rudi.hartono@lms-pplg.sch.id' },
  { hari: 'Jumat',  kelas: 'XII RPL 1', mataPelajaran: 'Algoritma & Pemrograman',    jamMulai: '07:00', jamSelesai: '08:30', ruangan: 'Lab Komputer 1', guruEmail: 'budi.santoso@lms-pplg.sch.id' },
  { hari: 'Jumat',  kelas: 'XII RPL 1', mataPelajaran: 'Informatika',                jamMulai: '08:30', jamSelesai: '10:00', ruangan: 'Lab Komputer 2', guruEmail: 'ahmad.fauzi@lms-pplg.sch.id' },

  // ── XII RPL 2 ──────────────────────────────────────────────────
  { hari: 'Senin',  kelas: 'XII RPL 2', mataPelajaran: 'Basis Data',                 jamMulai: '12:30', jamSelesai: '14:00', ruangan: 'Lab Komputer 2', guruEmail: 'ahmad.fauzi@lms-pplg.sch.id' },
  { hari: 'Senin',  kelas: 'XII RPL 2', mataPelajaran: 'Desain Grafis Percetakan',   jamMulai: '14:00', jamSelesai: '15:30', ruangan: 'Lab Multimedia', guruEmail: 'dewi.kurniasih@lms-pplg.sch.id' },
  { hari: 'Selasa', kelas: 'XII RPL 2', mataPelajaran: 'Pemrograman Web',            jamMulai: '12:30', jamSelesai: '14:00', ruangan: 'Lab Komputer 1', guruEmail: 'budi.santoso@lms-pplg.sch.id' },
  { hari: 'Rabu',   kelas: 'XII RPL 2', mataPelajaran: 'PKK',                        jamMulai: '12:30', jamSelesai: '14:00', ruangan: 'Kelas XII-B',    guruEmail: 'dewi.kurniasih@lms-pplg.sch.id' },
  { hari: 'Rabu',   kelas: 'XII RPL 2', mataPelajaran: 'Matematika',                 jamMulai: '14:00', jamSelesai: '15:30', ruangan: 'Kelas XII-B',    guruEmail: 'siti.rahayu@lms-pplg.sch.id' },
  { hari: 'Kamis',  kelas: 'XII RPL 2', mataPelajaran: 'Pemrograman Berorientasi Objek', jamMulai: '12:30', jamSelesai: '14:00', ruangan: 'Lab Komputer 1', guruEmail: 'budi.santoso@lms-pplg.sch.id' },
  { hari: 'Jumat',  kelas: 'XII RPL 2', mataPelajaran: 'Bahasa Inggris',             jamMulai: '12:30', jamSelesai: '14:00', ruangan: 'Kelas XII-B',    guruEmail: 'rudi.hartono@lms-pplg.sch.id' },

  // ── XI RPL 1 ───────────────────────────────────────────────────
  { hari: 'Senin',  kelas: 'XI RPL 1',  mataPelajaran: 'Informatika',                jamMulai: '10:15', jamSelesai: '11:45', ruangan: 'Lab Komputer 2', guruEmail: 'ahmad.fauzi@lms-pplg.sch.id' },
  { hari: 'Selasa', kelas: 'XI RPL 1',  mataPelajaran: 'Algoritma & Pemrograman',    jamMulai: '10:15', jamSelesai: '11:45', ruangan: 'Lab Komputer 1', guruEmail: 'budi.santoso@lms-pplg.sch.id' },
  { hari: 'Selasa', kelas: 'XI RPL 1',  mataPelajaran: 'Jaringan Komputer',          jamMulai: '12:30', jamSelesai: '14:00', ruangan: 'Lab Komputer 2', guruEmail: 'ahmad.fauzi@lms-pplg.sch.id' },
  { hari: 'Rabu',   kelas: 'XI RPL 1',  mataPelajaran: 'Bahasa Indonesia',           jamMulai: '10:15', jamSelesai: '11:45', ruangan: 'Kelas XI-A',     guruEmail: 'siti.rahayu@lms-pplg.sch.id' },
  { hari: 'Kamis',  kelas: 'XI RPL 1',  mataPelajaran: 'Pendidikan Agama Islam',     jamMulai: '10:15', jamSelesai: '11:45', ruangan: 'Kelas XI-A',     guruEmail: 'rudi.hartono@lms-pplg.sch.id' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const hashedPass = await bcrypt.hash(PASS, 10);

  // ── Guru ────────────────────────────────────────────────────────
  const guruMap: Record<string, string> = {}; // email → Guru.id

  for (const g of GURU_DATA) {
    const user = await prisma.user.upsert({
      where: { email: g.email },
      update: {},
      create: {
        nama: g.nama,
        email: g.email,
        password: hashedPass,
        role: Role.GURU,
        guru: { create: { nip: g.nip, noWa: g.noWa } },
      },
      include: { guru: true },
    });

    // Update noWa if guru already exists but noWa is missing
    if (user.guru && !user.guru.noWa) {
      await prisma.guru.update({
        where: { id: user.guru.id },
        data: { noWa: g.noWa },
      });
    }

    guruMap[g.email] = user.guru!.id;
    console.log(`✓ Guru: ${g.nama}`);
  }

  // ── Siswa ───────────────────────────────────────────────────────
  for (const s of SISWA_DATA) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        nama: s.nama,
        email: s.email,
        password: hashedPass,
        role: Role.SISWA,
        siswa: { create: { nis: s.nis, kelas: s.kelas, angkatan: s.angkatan } },
      },
    });
    console.log(`✓ Siswa: ${s.nama} (${s.kelas})`);
  }

  // ── Jadwal kelas ────────────────────────────────────────────────
  let created = 0;
  for (const j of JADWAL_DATA) {
    const guruId = guruMap[j.guruEmail];
    if (!guruId) { console.warn(`Guru tidak ditemukan: ${j.guruEmail}`); continue; }

    // Upsert by jadwal unique identifier (guruId + hari + jamMulai + kelas)
    const existing = await prisma.jadwalKelas.findFirst({
      where: { guruId, hari: j.hari, jamMulai: j.jamMulai, kelas: j.kelas },
    });

    if (!existing) {
      await prisma.jadwalKelas.create({
        data: {
          guruId,
          hari: j.hari,
          kelas: j.kelas,
          mataPelajaran: j.mataPelajaran,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
          ruangan: j.ruangan,
        },
      });
      created++;
    }
  }

  console.log(`\n✓ ${created} jadwal baru dibuat (${JADWAL_DATA.length - created} sudah ada)`);
  console.log('\n─────────────────────────────────────────');
  console.log('Seed jadwal selesai. Akun guru (pass: password123):');
  for (const g of GURU_DATA) {
    console.log(`  ${g.nama.padEnd(30)} → ${g.email}`);
  }
  console.log('\nKelas tersedia: XII RPL 1 · XII RPL 2 · XI RPL 1');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
