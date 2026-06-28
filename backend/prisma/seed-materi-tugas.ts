/**
 * Seed data demo untuk TugasKelas — semua jadwal XII RPL 1.
 * Jalankan dengan:
 *   npx tsx prisma/seed-materi-tugas.ts
 *
 * Aman dijalankan berulang kali (skip jika sudah ada data).
 *
 * Catatan: seeding MateriKelas dihapus dari sini — materi diupload manual
 * lewat halaman admin (atau script add-materi-*.ts) agar tidak ada
 * file PDF placeholder/corrupt yang ter-generate otomatis.
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 0, 0);
  return d;
}

// ─── Data seed per mata pelajaran ─────────────────────────────────────────────

const JADWAL_SEED: {
  mataPelajaran: string;
  kelas: string;
  tugas: { judul: string; deskripsi: string; deadlineDays: number }[];
}[] = [
  {
    mataPelajaran: 'Pemrograman Web',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Buat Landing Page Portofolio', deskripsi: 'Buat halaman portofolio pribadi menggunakan HTML5 semantik dan CSS Flexbox/Grid. Harus responsif (mobile-friendly) dan terdiri minimal 3 section.', deadlineDays: 5 },
      { judul: 'Implementasi Fetch API', deskripsi: 'Gunakan JavaScript Fetch API untuk mengambil data dari public API (misal JSONPlaceholder) dan tampilkan dalam tabel HTML yang dinamis.', deadlineDays: -3 },
    ],
  },
  {
    mataPelajaran: 'Basis Data',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Rancang ERD Sistem Perpustakaan', deskripsi: 'Rancang Entity Relationship Diagram (ERD) untuk sistem perpustakaan sekolah. Harus mencakup entitas Buku, Anggota, Peminjaman, dan Petugas.', deadlineDays: 7 },
      { judul: 'Query SQL — Laporan Nilai Siswa', deskripsi: 'Tulis query SQL untuk menghasilkan laporan nilai siswa: rata-rata per kelas, siswa nilai tertinggi, dan daftar siswa yang belum mengumpulkan tugas.', deadlineDays: -2 },
    ],
  },
  {
    mataPelajaran: 'Pemrograman Berorientasi Objek',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Implementasi Sistem Kasir OOP', deskripsi: 'Buat program kasir sederhana menggunakan prinsip OOP. Wajib menggunakan class Produk, Transaksi, Kasir. Terapkan inheritance dan enkapsulasi.', deadlineDays: 6 },
      { judul: 'Refactor Kode Prosedural ke OOP', deskripsi: 'Diberikan kode prosedural untuk manajemen kontak. Refactor menjadi OOP dengan class Contact, ContactBook, dan interface Searchable.', deadlineDays: -4 },
    ],
  },
  {
    mataPelajaran: 'Matematika',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Latihan Soal Limit', deskripsi: 'Kerjakan 15 soal limit fungsi aljabar dan trigonometri. Tuliskan langkah-langkah penyelesaian secara lengkap dan sistematis.', deadlineDays: 4 },
      { judul: 'Aplikasi Turunan dalam Kehidupan', deskripsi: 'Cari dan analisis 3 contoh nyata penggunaan konsep turunan dalam bidang fisika, ekonomi, atau teknologi. Buat laporan minimal 2 halaman.', deadlineDays: 10 },
    ],
  },
  {
    mataPelajaran: 'Bahasa Indonesia',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Menulis Teks Eksposisi', deskripsi: 'Tulis teks eksposisi bertema "Dampak Media Sosial terhadap Prestasi Belajar Siswa" minimal 500 kata. Sertakan fakta dan data pendukung.', deadlineDays: 5 },
      { judul: 'Analisis Artikel Ilmiah', deskripsi: 'Pilih satu artikel ilmiah dari jurnal nasional terakreditasi. Analisis struktur, isi, kekuatan argumen, dan kekurangan artikel tersebut.', deadlineDays: -1 },
    ],
  },
  {
    mataPelajaran: 'Pendidikan Agama Islam',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Refleksi Diri — Akhlak Digital', deskripsi: 'Tulis refleksi jujur tentang perilaku digitalmu selama sebulan terakhir. Apa yang sesuai dan tidak sesuai dengan nilai Islam? Apa rencanamu ke depan?', deadlineDays: 7 },
      { judul: 'Presentasi Fikih Muamalah', deskripsi: 'Buat presentasi (PowerPoint/Canva) tentang hukum salah satu transaksi digital dalam Islam. Minimal 10 slide dengan referensi yang valid.', deadlineDays: 14 },
    ],
  },
  {
    mataPelajaran: 'PKK',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Buat BMC Startup Impianmu', deskripsi: 'Rancang Business Model Canvas untuk ide startup teknologi yang ingin kamu bangun. Isi semua 9 blok dengan detail dan masuk akal. Presentasikan di kelas.', deadlineDays: 10 },
      { judul: 'Analisis Kompetitor', deskripsi: 'Pilih satu startup teknologi Indonesia. Analisis kekuatan, kelemahan, peluang, dan ancaman (SWOT). Buat laporan minimal 3 halaman.', deadlineDays: -5 },
    ],
  },
  {
    mataPelajaran: 'Algoritma & Pemrograman',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Implementasi Linked List Python', deskripsi: 'Implementasikan singly linked list dalam Python dengan operasi: insert (head/tail/index), delete, search, dan traversal. Sertakan unit test.', deadlineDays: 8 },
      { judul: 'Analisis Kompleksitas Sorting', deskripsi: 'Buat program yang membandingkan waktu eksekusi Bubble Sort vs Merge Sort untuk array berukuran 100, 1000, 10000 elemen. Visualisasikan hasilnya.', deadlineDays: 3 },
    ],
  },
  {
    mataPelajaran: 'Jaringan Komputer',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Latihan Subnetting 20 Soal', deskripsi: 'Kerjakan 20 soal subnetting dengan berbagai prefix length (/24, /25, /26, /27, /28). Sertakan perhitungan lengkap: network address, broadcast, range host.', deadlineDays: 5 },
      { judul: 'Konfigurasi VLAN di Cisco Packet Tracer', deskripsi: 'Buat topologi jaringan dengan minimal 3 VLAN menggunakan Cisco Packet Tracer. Konfigurasikan inter-VLAN routing dan pastikan semua VLAN bisa saling berkomunikasi.', deadlineDays: 12 },
    ],
  },
  {
    mataPelajaran: 'Desain Grafis Percetakan',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Desain Poster Kegiatan Sekolah', deskripsi: 'Buat poster digital untuk kegiatan sekolah pilihanmu (lomba, seminar, atau acara). Ukuran A3, resolusi minimal 150 dpi. Terapkan prinsip CRAP.', deadlineDays: 6 },
      { judul: 'Redesign Logo Brand Lokal', deskripsi: 'Pilih satu brand/UMKM lokal yang logonya kurang menarik. Redesign logonya dengan tetap mempertahankan identitas brand. Buat mockup penggunaan logo.', deadlineDays: -2 },
    ],
  },
  {
    mataPelajaran: 'Bahasa Inggris',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Write a README File', deskripsi: 'Write a complete README.md in English for one of your programming projects. Must include: project description, installation guide, usage examples, and contributing guidelines.', deadlineDays: 4 },
      { judul: 'Mock Job Interview Video', deskripsi: 'Record a 3-5 minute video of yourself answering 5 common IT job interview questions in English. Focus on clarity, confidence, and correct grammar.', deadlineDays: 9 },
    ],
  },
  {
    mataPelajaran: 'Informatika',
    kelas: 'XII RPL 1',
    tugas: [
      { judul: 'Eksplorasi AI Tools', deskripsi: 'Coba minimal 3 AI tools berbeda (ChatGPT, Midjourney, GitHub Copilot, dll). Tulis laporan: apa yang bisa dan tidak bisa dilakukan masing-masing tool, dan refleksi etisnya.', deadlineDays: 7 },
      { judul: 'Audit Keamanan Akun Digital', deskripsi: 'Lakukan audit keamanan pada minimal 5 akun digitalmu (email, media sosial, dll). Cek: kekuatan password, 2FA aktif, sesi yang masih login. Buat laporan hasilnya.', deadlineDays: 3 },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let totalTugas = 0, skippedTugas = 0;

  for (const item of JADWAL_SEED) {
    const jadwal = await prisma.jadwalKelas.findFirst({
      where: { mataPelajaran: item.mataPelajaran, kelas: item.kelas },
    });

    if (!jadwal) {
      console.warn(`⚠  Tidak ditemukan: ${item.mataPelajaran} / ${item.kelas}`);
      continue;
    }

    const existingTugas = await prisma.tugasKelas.count({ where: { jadwalKelasId: jadwal.id } });

    if (existingTugas === 0) {
      for (const t of item.tugas) {
        await prisma.tugasKelas.create({
          data: {
            jadwalKelasId: jadwal.id,
            judul: t.judul,
            deskripsi: t.deskripsi,
            deadline: daysFromNow(t.deadlineDays),
          },
        });
      }
      console.log(`✓ ${item.tugas.length} tugas → ${item.mataPelajaran}`);
      totalTugas += item.tugas.length;
    } else {
      console.log(`  (skip tugas, sudah ${existingTugas}) ${item.mataPelajaran}`);
      skippedTugas++;
    }
  }

  console.log(`\n✅ Selesai. Baru: ${totalTugas} tugas. Diskip: ${skippedTugas} mapel.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
