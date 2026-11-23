import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

type Kolom = { header: string; key: string; width: number };
type Baris = Record<string, string | number>;
type Tahap = 'belum' | 'menunggu' | 'ditolak' | 'terverifikasi' | 'penempatan' | 'aktif' | 'selesai';

const WARNA_HEADER = 'FF3E03B3';
const LABEL_DAFTAR: Record<string, string> = { MENUNGGU: 'Menunggu Verifikasi', DITERIMA: 'Terverifikasi', DITOLAK: 'Ditolak' };
const LABEL_PENEMPATAN: Record<string, string> = { MENUNGGU: 'Menunggu Verifikasi', AKTIF: 'Aktif', SELESAI: 'Selesai', BATAL: 'Batal' };
const WARNA_STATUS: Record<string, string> = {
  'Menunggu Verifikasi': 'FFD97706',
  Terverifikasi: 'FF22A06B',
  Aktif: 'FF22A06B',
  Selesai: 'FF3E03B3',
  Ditolak: 'FFDC2626',
  Batal: 'FFDC2626',
};
const PRIORITAS: Record<string, number> = { AKTIF: 0, SELESAI: 1, MENUNGGU: 2, BATAL: 3 };

function tanggal(d: Date | null | undefined, zona = 'Asia/Jakarta') {
  return d ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: zona }) : '-';
}

function alamat(t: { alamat?: string | null; dukuh?: string | null; rt?: string | null; rw?: string | null; desa?: string | null; kecamatan?: string | null; kabupaten?: string | null }) {
  const bagian: string[] = [];
  if (t.dukuh) bagian.push(`Dukuh ${t.dukuh}`);
  if (t.rt || t.rw) bagian.push(`RT ${t.rt || '-'}/RW ${t.rw || '-'}`);
  if (t.desa) bagian.push(`Desa ${t.desa}`);
  if (t.kecamatan) bagian.push(`Kecamatan ${t.kecamatan}`);
  if (t.kabupaten) bagian.push(`Kabupaten ${t.kabupaten}`);
  return bagian.length > 0 ? bagian.join(', ') : t.alamat || '-';
}

function kunciInstansi(nama: unknown) {
  return String(nama ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function urutInstansi<T>(rows: T[], namaInstansi: (r: T) => string | null | undefined, waktu: (r: T) => Date) {
  return [...rows].sort((a, b) => {
    const ka = kunciInstansi(namaInstansi(a));
    const kb = kunciInstansi(namaInstansi(b));
    return Number(!ka) - Number(!kb) || ka.localeCompare(kb, 'id', { numeric: true }) || waktu(a).getTime() - waktu(b).getTime();
  });
}

function tambahSheet(wb: ExcelJS.Workbook, nama: string, kolom: Kolom[], baris: Baris[]) {
  const ws = wb.addWorksheet(nama, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = kolom;
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WARNA_HEADER } };
  header.alignment = { vertical: 'middle' };
  header.height = 22;
  let kunciAktif: string | null = null;
  let selang = true;
  baris.forEach((b) => {
    const row = ws.addRow(b);
    row.alignment = { vertical: 'middle', wrapText: true };
    if ('instansi' in b) {
      const kunci = kunciInstansi(b.instansi);
      if (kunci !== kunciAktif) {
        kunciAktif = kunci;
        selang = !selang;
      }
      if (selang) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1EDFA' } };
      row.getCell('instansi').font = { bold: true };
    }
    if ('status' in b) {
      const warna = WARNA_STATUS[String(b.status)];
      if (warna) row.getCell('status').font = { bold: true, color: { argb: warna } };
    }
  });
  if (baris.length > 0) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: kolom.length } };
  return ws;
}

@Injectable()
export class RekapPklExcelService {
  constructor(private readonly prisma: PrismaService) {}

  async build(): Promise<Buffer> {
    const data = await this.prisma.siswa.findMany({
      where: {
        OR: [
          { status: 'AKTIF', kelas: { OR: [{ nama: { startsWith: 'XII', mode: 'insensitive' } }, { nama: { startsWith: '12' } }] } },
          { pendaftaranMagang: { isNot: null } },
          { penempatan: { some: {} } },
        ],
      },
      select: {
        nis: true,
        nama: true,
        status: true,
        jenisKelamin: true,
        noHp: true,
        kelas: { select: { nama: true } },
        user: { select: { nama: true } },
        pendaftaranMagang: {
          select: {
            noWa: true,
            status: true,
            alasanTolak: true,
            createdAt: true,
            diverifikasiAt: true,
            tempatMagang: { select: { namaTempat: true } },
          },
        },
        penempatan: {
          select: {
            status: true,
            createdAt: true,
            tanggalMulai: true,
            tanggalSelesai: true,
            tempatMagang: { select: { namaTempat: true, alamat: true, dukuh: true, rt: true, rw: true, desa: true, kecamatan: true, kabupaten: true } },
            guruPembimbing: { select: { user: { select: { nama: true } } } },
          },
        },
      },
    });

    const siswa = data
      .map((s) => {
        const penempatan = [...s.penempatan].sort((a, b) => PRIORITAS[a.status] - PRIORITAS[b.status]);
        const utama = penempatan.find((p) => p.status !== 'BATAL') ?? null;
        const daftar = s.pendaftaranMagang;
        const wajib = s.status === 'AKTIF' && /^(XII|12)(?![0-9A-Z])/i.test(s.kelas.nama.trim());
        let tahap: Tahap = 'belum';
        if (utama?.status === 'AKTIF') tahap = 'aktif';
        else if (utama?.status === 'SELESAI') tahap = 'selesai';
        else if (utama?.status === 'MENUNGGU') tahap = 'penempatan';
        else if (daftar?.status === 'DITERIMA') tahap = 'terverifikasi';
        else if (daftar?.status === 'MENUNGGU') tahap = 'menunggu';
        else if (daftar?.status === 'DITOLAK') tahap = 'ditolak';
        return { ...s, namaTampil: s.user?.nama ?? s.nama ?? '-', penempatan, utama, daftar, wajib, tahap };
      })
      .filter((s) => s.wajib || s.tahap !== 'belum')
      .sort((a, b) => a.kelas.nama.localeCompare(b.kelas.nama, 'id', { numeric: true }) || a.namaTampil.localeCompare(b.namaTampil, 'id', { sensitivity: 'base' }));

    const perKelas = new Map<string, Record<Tahap | 'total', number>>();
    siswa.forEach((s) => {
      const r = perKelas.get(s.kelas.nama) ?? { total: 0, belum: 0, menunggu: 0, ditolak: 0, terverifikasi: 0, penempatan: 0, aktif: 0, selesai: 0 };
      r.total += 1;
      r[s.tahap] += 1;
      perKelas.set(s.kelas.nama, r);
    });
    const jumlah: Record<Tahap | 'total', number> = { total: 0, belum: 0, menunggu: 0, ditolak: 0, terverifikasi: 0, penempatan: 0, aktif: 0, selesai: 0 };
    perKelas.forEach((r) => (Object.keys(jumlah) as (Tahap | 'total')[]).forEach((k) => { jumlah[k] += r[k]; }));
    const barisRingkas = (kelas: string, r: Record<Tahap | 'total', number>): Baris => ({
      kelas, ...r, tercapai: r.aktif + r.selesai, persen: r.total ? (r.aktif + r.selesai) / r.total : 0,
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'LMS PPLG';
    wb.created = new Date();

    const ringkasan = tambahSheet(wb, 'Ringkasan', [
      { header: 'Kelas', key: 'kelas', width: 16 },
      { header: 'Total Siswa', key: 'total', width: 12 },
      { header: 'Belum Daftar', key: 'belum', width: 13 },
      { header: 'Menunggu Verifikasi', key: 'menunggu', width: 20 },
      { header: 'Ditolak', key: 'ditolak', width: 10 },
      { header: 'Terverifikasi, Belum Isi Penempatan', key: 'terverifikasi', width: 22 },
      { header: 'Penempatan Menunggu', key: 'penempatan', width: 21 },
      { header: 'PKL Aktif', key: 'aktif', width: 10 },
      { header: 'PKL Selesai', key: 'selesai', width: 11 },
      { header: 'Tercapai', key: 'tercapai', width: 10 },
      { header: 'Persentase Tercapai', key: 'persen', width: 19 },
    ], [...[...perKelas.entries()].map(([k, r]) => barisRingkas(k, r)), barisRingkas('Total', jumlah)]);
    ringkasan.autoFilter = undefined;
    ringkasan.getRow(1).alignment = { vertical: 'middle', wrapText: true };
    ringkasan.getRow(1).height = 34;
    ringkasan.getColumn('persen').numFmt = '0%';
    const total = ringkasan.lastRow;
    if (total) {
      total.font = { bold: true };
      total.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1EDFA' } };
    }

    const kolomSiswa: Kolom[] = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama', key: 'nama', width: 30 },
      { header: 'NIS', key: 'nis', width: 14 },
      { header: 'Kelas', key: 'kelas', width: 14 },
      { header: 'Jenis Kelamin', key: 'jk', width: 14 },
    ];
    const kolomInstansi: Kolom[] = [kolomSiswa[0], { header: 'Instansi', key: 'instansi', width: 32 }, ...kolomSiswa.slice(1)];
    const dasar = (s: (typeof siswa)[number], i: number): Baris => ({
      no: i + 1, nama: s.namaTampil, nis: s.nis, kelas: s.kelas.nama, jk: s.jenisKelamin || '-',
    });

    tambahSheet(wb, 'Pendaftaran', [
      ...kolomInstansi,
      { header: 'No. WA', key: 'wa', width: 16 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Tanggal Daftar', key: 'tglDaftar', width: 15 },
      { header: 'Tanggal Verifikasi', key: 'tglVerifikasi', width: 17 },
      { header: 'Alasan Ditolak', key: 'alasan', width: 32 },
    ], urutInstansi(siswa.filter((s) => s.daftar), (s) => s.daftar!.tempatMagang?.namaTempat, (s) => s.daftar!.createdAt).map((s, i) => ({
      ...dasar(s, i),
      wa: s.daftar!.noWa || '-',
      instansi: s.daftar!.tempatMagang?.namaTempat ?? '-',
      status: LABEL_DAFTAR[s.daftar!.status] ?? s.daftar!.status,
      tglDaftar: tanggal(s.daftar!.createdAt),
      tglVerifikasi: tanggal(s.daftar!.diverifikasiAt),
      alasan: s.daftar!.alasanTolak || '-',
    })));

    const kolomPenempatan: Kolom[] = [
      ...kolomInstansi,
      { header: 'Alamat Instansi', key: 'alamat', width: 48 },
      { header: 'Guru Pembimbing', key: 'guru', width: 28 },
      { header: 'Tanggal Mulai', key: 'mulai', width: 14 },
      { header: 'Tanggal Selesai', key: 'akhir', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
    ];
    const isiPenempatan = (p: (typeof siswa)[number]['penempatan'][number]): Baris => ({
      instansi: p.tempatMagang.namaTempat,
      alamat: alamat(p.tempatMagang),
      guru: p.guruPembimbing?.user.nama ?? 'Belum ada pembimbing',
      mulai: tanggal(p.tanggalMulai, 'UTC'),
      akhir: tanggal(p.tanggalSelesai, 'UTC'),
      status: LABEL_PENEMPATAN[p.status] ?? p.status,
    });

    tambahSheet(wb, 'Penempatan', kolomPenempatan,
      urutInstansi(siswa.flatMap((s) => s.penempatan.map((p) => ({ s, p }))), (r) => r.p.tempatMagang.namaTempat, (r) => r.p.createdAt)
        .map(({ s, p }, i) => ({ ...dasar(s, i), ...isiPenempatan(p) })));

    tambahSheet(wb, 'Tercapai', kolomPenempatan,
      urutInstansi(siswa.filter((s) => s.tahap === 'aktif' || s.tahap === 'selesai'), (s) => s.utama!.tempatMagang.namaTempat, (s) => s.utama!.createdAt)
        .map((s, i) => ({ ...dasar(s, i), ...isiPenempatan(s.utama!) })));

    tambahSheet(wb, 'Belum Daftar', [...kolomSiswa, { header: 'No. HP', key: 'hp', width: 16 }],
      siswa.filter((s) => s.tahap === 'belum').map((s, i) => ({ ...dasar(s, i), hp: s.noHp || '-' })));

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
