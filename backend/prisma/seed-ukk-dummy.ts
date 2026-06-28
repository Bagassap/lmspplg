import 'dotenv/config';
import { PrismaClient, Role, TipeUKK, StatusSubmisiUKK } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

const DRIVE_LINK = 'https://drive.google.com/drive/folders/1wyMQNai5lNFoCg8AA45bvzqLRZ3_b40z?usp=drive_link';

const LABS = [
  { lokasi: 'Lab RPS 1', penguji: 'Yano Arisandi'   },
  { lokasi: 'Lab RPS 2', penguji: 'Fathan Rofiki'   },
  { lokasi: 'Lab RPS 3', penguji: 'Bagas Saputra'   },
  { lokasi: 'Lab RPS 4', penguji: 'Adib Rofiudin'   },
];

// Dummy siswa per lab — 3 siswa masing-masing
const SISWA_PER_LAB: Record<string, { nama: string; nis: string; email: string }[]> = {
  'Lab RPS 1': [
    { nama: 'Rizky Firmansyah',  nis: '2400101', email: 'rizky.firmansyah@siswa.lms-pplg.sch.id'  },
    { nama: 'Dinda Ayu Lestari', nis: '2400102', email: 'dinda.ayu@siswa.lms-pplg.sch.id'          },
    { nama: 'Farhan Maulana',    nis: '2400103', email: 'farhan.maulana@siswa.lms-pplg.sch.id'     },
  ],
  'Lab RPS 2': [
    { nama: 'Siti Nurhaliza',    nis: '2400201', email: 'siti.nurhaliza@siswa.lms-pplg.sch.id'     },
    { nama: 'Bima Sakti',        nis: '2400202', email: 'bima.sakti@siswa.lms-pplg.sch.id'         },
    { nama: 'Nadia Putri',       nis: '2400203', email: 'nadia.putri@siswa.lms-pplg.sch.id'        },
  ],
  'Lab RPS 3': [
    { nama: 'Eko Prasetyo',      nis: '2400301', email: 'eko.prasetyo@siswa.lms-pplg.sch.id'       },
    { nama: 'Lina Marlina',      nis: '2400302', email: 'lina.marlina@siswa.lms-pplg.sch.id'       },
    { nama: 'Wahyu Hidayat',     nis: '2400303', email: 'wahyu.hidayat@siswa.lms-pplg.sch.id'      },
  ],
  'Lab RPS 4': [
    { nama: 'Anggi Septiani',    nis: '2400401', email: 'anggi.septiani@siswa.lms-pplg.sch.id'     },
    { nama: 'Rendi Saputra',     nis: '2400402', email: 'rendi.saputra@siswa.lms-pplg.sch.id'      },
    { nama: 'Mega Wulandari',    nis: '2400403', email: 'mega.wulandari@siswa.lms-pplg.sch.id'     },
  ],
};

async function main() {
  const hashedPw = await bcrypt.hash('password123', 10);

  console.log('── Membuat siswa dummy per lab...');
  const siswaIdMap: Record<string, string[]> = {};

  for (const [lab, daftarSiswa] of Object.entries(SISWA_PER_LAB)) {
    siswaIdMap[lab] = [];
    for (const s of daftarSiswa) {
      const user = await prisma.user.upsert({
        where:  { email: s.email },
        update: {},
        create: {
          nama:     s.nama,
          email:    s.email,
          password: hashedPw,
          role:     Role.SISWA,
          siswa:    { create: { nis: s.nis, kelas: 'XII PPLG 1', angkatan: 2025 } },
        },
        include: { siswa: true },
      });
      const siswaId = user.siswa!.id;
      siswaIdMap[lab].push(siswaId);
      console.log(`  ✓ Siswa: ${s.nama} (${lab})`);
    }
  }

  console.log('\n── Membuat 4 Tahapan UKK dummy...');

  for (let i = 0; i < LABS.length; i++) {
    const lab = LABS[i];

    // Hapus tahapan lama dengan nama & lokasi yang sama agar idempoten
    await prisma.tahapanUKK.deleteMany({
      where: { judul: 'UKK Internal Hari 1', lokasi: lab.lokasi },
    });

    const tahapan = await prisma.tahapanUKK.create({
      data: {
        tipe:      TipeUKK.INTERNAL,
        hariKe:    1,
        judul:     'UKK Internal Hari 1',
        tanggal:   new Date('2025-06-28'),
        jamMulai:  '08:00',
        jamSelesai: '11:00',
        lokasi:    lab.lokasi,
        penguji:   lab.penguji,
        keterangan: 'Ujian Kompetensi Keahlian Internal — pengerjaan project',
      },
    });
    console.log(`  ✓ Tahapan: ${lab.lokasi} — penguji: ${lab.penguji}`);

    // Buat 1 file jadwal per tahapan (prefix __jadwal__: agar masuk Jadwal card)
    await prisma.soalTahapanUKK.create({
      data: {
        tahapanId: tahapan.id,
        judul:     'Jadwal UKK Internal Hari 1',
        deskripsi: `__jadwal__:Jadwal pelaksanaan UKK Internal ${lab.lokasi}`,
        fileUrl:   '/uploads/ukk-soal/dummy-jadwal.pdf',
        fileName:  'Jadwal-UKK-Internal.pdf',
      },
    });

    // Buat 1 soal per tahapan
    const soal = await prisma.soalTahapanUKK.create({
      data: {
        tahapanId: tahapan.id,
        judul:     'Soal Project UKK Internal',
        deskripsi: 'Buat aplikasi berbasis web sesuai tema yang diberikan',
        fileUrl:   '/uploads/ukk-soal/dummy-soal.pdf',
        fileName:  'Soal-UKK-Internal.pdf',
      },
    });

    // Buat submisi dari semua siswa di lab ini
    const siswaIds = siswaIdMap[lab.lokasi];
    for (const siswaId of siswaIds) {
      await prisma.submisiProjectUKK.upsert({
        where: { soalId_siswaId: { soalId: soal.id, siswaId } },
        update: { fileUrl: DRIVE_LINK, fileName: 'Google Drive', status: StatusSubmisiUKK.TERKIRIM },
        create: {
          soalId:  soal.id,
          siswaId,
          fileUrl: DRIVE_LINK,
          fileName: 'Google Drive',
          status:  StatusSubmisiUKK.TERKIRIM,
        },
      });
    }
    console.log(`    → ${siswaIds.length} submisi dibuat untuk ${lab.lokasi}`);
  }

  console.log('\n── Selesai! Dummy data UKK berhasil ditambahkan.');
  console.log('   4 Tahapan × 1 Soal × 3 Siswa = 12 Submisi total');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
