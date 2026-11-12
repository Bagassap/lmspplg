import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ASPEK_NILAI } from './aspek-nilai';

export type NilaiExportGroup = {
  grup: string;
  lokasi: string;
  penguji: string;
  siswa: {
    kelas: string;
    nama: string;
    nis: string;
    nilai: { task: string; skor: Record<string, number>; rataRata: number | null; menungguRevisi: boolean }[];
  }[];
};

type SubmisiExportRow = {
  status: 'TERKIRIM' | 'DITERIMA' | 'REVISI';
  fileUrl: string;
  submittedAt: Date;
  soal: { judul: string } | null;
};

type SiswaExportRow = {
  nama: string | null;
  nis: string;
  submisiProjectUkk: SubmisiExportRow[];
};

type KelasGroup = {
  kelas: { nama: string };
  siswa: SiswaExportRow[];
};

const STATUS_LABEL: Record<SubmisiExportRow['status'], string> = {
  DITERIMA: 'Diterima',
  REVISI: 'Perlu Revisi',
  TERKIRIM: 'Menunggu Review',
};

const STATUS_COLOR: Record<SubmisiExportRow['status'], string> = {
  DITERIMA: 'FF00B368',
  REVISI: 'FFD97706',
  TERKIRIM: 'FF4F8EF7',
};

function safeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Kelas';
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 28)} (${n})`;
    n++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

const WARNA = {
  identitas: { header: 'FF16A34A', teks: 'FFFFFFFF' },
  aspek: { header: 'FFFACC15', teks: 'FF1F2937' },
  ringkasan: { header: 'FF2563EB', teks: 'FFFFFFFF' },
};

const ISI_ABU = 'FFE5E7EB';
const ISI_PUTIH = 'FFFFFFFF';

const ASPEK_SINGKAT: Record<string, string> = {
  struktur_data: 'Struktur Data',
  spesifikasi_program: 'Spesifikasi Program',
  perintah_eksekusi: 'Perintah Eksekusi',
  guidelines: 'Guidelines & Best Practices',
  terstruktur: 'Pemrograman Terstruktur',
  dokumen_kode: 'Dokumen Kode Program',
  debugging: 'Debugging',
  unit_test: 'Pengujian Unit',
};

@Injectable()
export class UjianUkkExcelService {
  async buildNilai(groups: NilaiExportGroup[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LMS PPLG';
    wb.created = new Date();
    const usedNames = new Set<string>();

    for (const group of groups) {
      const ws = wb.addWorksheet(safeSheetName(group.grup, usedNames), { views: [{ state: 'frozen', ySplit: 2 }] });
      const kolom = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Kelas', key: 'kelas', width: 12 },
        { header: 'Nama', key: 'nama', width: 26 },
        { header: 'NIS', key: 'nis', width: 13 },
        { header: 'Task', key: 'task', width: 28 },
        ...ASPEK_NILAI.map((a, i) => ({ header: `${i + 1}. ${ASPEK_SINGKAT[a.key] ?? a.label}`, key: a.key, width: 15 })),
        { header: 'Jumlah', key: 'jumlah', width: 9 },
        { header: 'Rata-rata', key: 'rata', width: 10 },
        { header: 'Status', key: 'status', width: 22 },
      ];
      ws.columns = kolom.map((k) => ({ key: k.key, width: k.width }));
      const jumlahKolom = kolom.length;
      const judul = group.penguji ? `${group.lokasi}   |   Guru pengawas: ${group.penguji}` : group.lokasi;
      const barisJudul = ws.addRow([judul]);
      ws.mergeCells(1, 1, 1, jumlahKolom);
      barisJudul.height = 24;
      barisJudul.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF1F2937' } };
      barisJudul.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      const header = ws.addRow(kolom.map((k) => k.header));
      header.height = 34;
      const warnaKolom = (c: number) => (c <= 5 ? WARNA.identitas : c <= 5 + ASPEK_NILAI.length ? WARNA.aspek : WARNA.ringkasan);
      for (let c = 1; c <= jumlahKolom; c++) {
        const cell = header.getCell(c);
        cell.font = { bold: true, size: 9, color: { argb: warnaKolom(c).teks } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: warnaKolom(c).header } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
      }
      const warnai = (row: ExcelJS.Row, abu: boolean) => {
        row.height = 18;
        for (let c = 1; c <= jumlahKolom; c++) {
          const cell = row.getCell(c);
          cell.font = { size: 10 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: abu ? ISI_ABU : ISI_PUTIH } };
          cell.alignment = { vertical: 'middle', horizontal: c === 3 || c === 5 ? 'left' : 'center', shrinkToFit: true };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
        }
      };

      let no = 1;
      for (const s of group.siswa) {
        const abu = no % 2 === 0;
        if (s.nilai.length === 0) {
          const row = ws.addRow({ no: no++, kelas: s.kelas, nama: s.nama, nis: s.nis, task: '-', status: 'Belum dinilai' });
          warnai(row, abu);
          row.getCell('status').font = { size: 10, color: { argb: 'FF6B7280' }, bold: true };
          continue;
        }
        s.nilai.forEach((n, i) => {
          const data: Record<string, string | number> = {
            no: i === 0 ? no : '',
            kelas: i === 0 ? s.kelas : '',
            nama: i === 0 ? s.nama : '',
            nis: i === 0 ? s.nis : '',
            task: n.task,
            jumlah: ASPEK_NILAI.reduce((t, a) => t + (n.skor[a.key] ?? 0), 0),
            rata: n.rataRata ?? '',
            status: n.menungguRevisi ? 'Menunggu revisi siswa' : n.rataRata === null ? 'Belum lengkap' : 'Nilai keluar',
          };
          for (const a of ASPEK_NILAI) data[a.key] = n.skor[a.key] ?? '';
          const row = ws.addRow(data);
          warnai(row, abu);
          row.getCell('status').font = { size: 10, color: { argb: n.menungguRevisi ? 'FFE8562B' : 'FF1D4ED8' }, bold: true };
          row.getCell('rata').font = { size: 10, bold: true };
        });
        no++;
      }
    }

    if (groups.length === 0) wb.addWorksheet('Nilai UKK');
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async build(groups: KelasGroup[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LMS PPLG';
    wb.created = new Date();

    const usedNames = new Set<string>();
    for (const group of groups) {
      const ws = wb.addWorksheet(safeSheetName(group.kelas.nama, usedNames), {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      ws.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama', key: 'nama', width: 26 },
        { header: 'NIS', key: 'nis', width: 14 },
        { header: 'Soal', key: 'soal', width: 26 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Link Google Drive', key: 'link', width: 45 },
        { header: 'Waktu Kumpul', key: 'waktu', width: 20 },
      ];

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0033FF' } };
      headerRow.alignment = { vertical: 'middle' };
      headerRow.height = 20;

      let no = 1;
      for (const s of group.siswa) {
        if (s.submisiProjectUkk.length === 0) {
          const row = ws.addRow({
            no: no++,
            nama: s.nama || '-',
            nis: s.nis,
            soal: '-',
            status: 'Belum Mengumpulkan',
            link: '-',
            waktu: '-',
          });
          row.alignment = { vertical: 'middle' };
          row.getCell('status').font = { color: { argb: 'FF94A3B8' }, bold: true };
          continue;
        }

        s.submisiProjectUkk.forEach((sub, i) => {
          const row = ws.addRow({
            no: i === 0 ? no : '',
            nama: i === 0 ? s.nama || '-' : '',
            nis: i === 0 ? s.nis : '',
            soal: sub.soal?.judul ?? '-',
            status: STATUS_LABEL[sub.status],
            link: sub.fileUrl,
            waktu: `${sub.submittedAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta', hourCycle: 'h23' })} WIB`,
          });
          row.alignment = { vertical: 'middle' };
          row.getCell('status').font = { color: { argb: STATUS_COLOR[sub.status] }, bold: true };
          if (sub.fileUrl.startsWith('http')) {
            row.getCell('link').value = { text: sub.fileUrl, hyperlink: sub.fileUrl };
            row.getCell('link').font = { color: { argb: 'FF0033FF' }, underline: true };
          }
        });
        no++;
      }
    }

    if (groups.length === 0) {
      wb.addWorksheet('Rekap Submisi');
    }

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
