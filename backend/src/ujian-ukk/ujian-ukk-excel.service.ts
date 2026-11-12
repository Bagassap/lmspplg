import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ASPEK_NILAI } from './aspek-nilai';

export type NilaiExportGroup = {
  kelas: string;
  siswa: {
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

@Injectable()
export class UjianUkkExcelService {
  async buildNilai(groups: NilaiExportGroup[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LMS PPLG';
    wb.created = new Date();
    const usedNames = new Set<string>();

    for (const group of groups) {
      const ws = wb.addWorksheet(safeSheetName(group.kelas, usedNames), { views: [{ state: 'frozen', ySplit: 1 }] });
      ws.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama', key: 'nama', width: 26 },
        { header: 'NIS', key: 'nis', width: 14 },
        { header: 'Task', key: 'task', width: 26 },
        ...ASPEK_NILAI.map((a, i) => ({ header: `${i + 1}. ${a.label}`, key: a.key, width: 18 })),
        { header: 'Jumlah', key: 'jumlah', width: 10 },
        { header: 'Rata-rata', key: 'rata', width: 11 },
        { header: 'Status', key: 'status', width: 22 },
      ];
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3E03B3' } };
      header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      header.height = 64;

      let no = 1;
      for (const s of group.siswa) {
        if (s.nilai.length === 0) {
          const row = ws.addRow({ no: no++, nama: s.nama, nis: s.nis, task: '-', status: 'Belum dinilai' });
          row.getCell('status').font = { color: { argb: 'FF94A3B8' }, bold: true };
          continue;
        }
        s.nilai.forEach((n, i) => {
          const data: Record<string, string | number> = {
            no: i === 0 ? no : '',
            nama: i === 0 ? s.nama : '',
            nis: i === 0 ? s.nis : '',
            task: n.task,
            jumlah: ASPEK_NILAI.reduce((t, a) => t + (n.skor[a.key] ?? 0), 0),
            rata: n.rataRata ?? '',
            status: n.menungguRevisi ? 'Menunggu revisi siswa' : n.rataRata === null ? 'Belum lengkap' : 'Nilai keluar',
          };
          for (const a of ASPEK_NILAI) data[a.key] = n.skor[a.key] ?? '';
          const row = ws.addRow(data);
          row.getCell('status').font = { color: { argb: n.menungguRevisi ? 'FFE8562B' : 'FF3E03B3' }, bold: true };
          row.getCell('rata').font = { bold: true };
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
