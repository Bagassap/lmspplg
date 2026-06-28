import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

const DUMMY_ABSENSI: Record<string, { status: string; waktuAbsen: string; catatan?: string }[]> = {
  'Lab RPS 1': [
    { status: 'HADIR', waktuAbsen: '08:02', catatan: 'Hadir tepat waktu' },
    { status: 'HADIR', waktuAbsen: '08:05' },
    { status: 'HADIR', waktuAbsen: '07:58', catatan: 'Datang lebih awal' },
  ],
  'Lab RPS 2': [
    { status: 'HADIR', waktuAbsen: '08:10' },
    { status: 'ALPA',  waktuAbsen: '',      catatan: 'Tidak hadir tanpa keterangan' },
    { status: 'HADIR', waktuAbsen: '08:07', catatan: '' },
  ],
  'Lab RPS 3': [
    { status: 'HADIR', waktuAbsen: '08:01' },
    { status: 'SAKIT', waktuAbsen: '',      catatan: 'Surat sakit dari dokter sudah diberikan' },
    { status: 'HADIR', waktuAbsen: '08:03' },
  ],
  'Lab RPS 4': [
    { status: 'HADIR', waktuAbsen: '08:06', catatan: 'Peralatan sudah disiapkan' },
    { status: 'IZIN',  waktuAbsen: '',      catatan: 'Izin keperluan keluarga' },
    { status: 'HADIR', waktuAbsen: '08:04' },
  ],
};

// TTD dummy (base64 PNG 1x1 transparent — placeholder)
const DUMMY_TTD = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  // Hapus dummy absensi lama untuk hari ini
  await prisma.absensiUKK.deleteMany({ where: { tanggal: today } });
  console.log('✓ Absensi hari ini dihapus');

  // Ambil semua tahapan real
  const tahapanList = await prisma.tahapanUKK.findMany({
    where: { hariKe: { gt: 0 } },
    include: {
      peserta: { include: { siswa: true } },
    },
  });
  console.log(`✓ ${tahapanList.length} tahapan ditemukan`);

  let total = 0;
  for (const tahapan of tahapanList) {
    const dummyList = DUMMY_ABSENSI[tahapan.lokasi];
    if (!dummyList) { console.log(`  ⚠ Tidak ada dummy untuk: ${tahapan.lokasi}`); continue; }

    for (let i = 0; i < tahapan.peserta.length; i++) {
      const peserta = tahapan.peserta[i];
      const dummy   = dummyList[i] ?? { status: 'HADIR', waktuAbsen: '08:00' };

      await prisma.absensiUKK.upsert({
        where: { tahapanId_siswaId_tanggal: { tahapanId: tahapan.id, siswaId: peserta.siswaId, tanggal: today } },
        update: {
          status:     dummy.status,
          waktuAbsen: dummy.waktuAbsen || null,
          catatan:    dummy.catatan   || null,
          ttd:        dummy.status === 'HADIR' ? DUMMY_TTD : null,
        },
        create: {
          tahapanId:  tahapan.id,
          siswaId:    peserta.siswaId,
          tanggal:    today,
          status:     dummy.status,
          waktuAbsen: dummy.waktuAbsen || null,
          catatan:    dummy.catatan   || null,
          ttd:        dummy.status === 'HADIR' ? DUMMY_TTD : null,
        },
      });
      total++;
    }
    console.log(`  ✓ ${tahapan.lokasi} → ${tahapan.peserta.length} absensi dibuat`);
  }

  console.log(`\n✓ Selesai. Total ${total} dummy absensi dibuat untuk tanggal ${today}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
