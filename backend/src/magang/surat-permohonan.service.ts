import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  VerticalMergeType,
  WidthType,
} from 'docx';
import { PrismaService } from '../prisma/prisma.service';

const SURAT = {
  nomor: 'D.052/SMK.NU/XXIV.11/2026',
  tanggal: '23 November 2026',
  periode: 'tanggal 21 Desember 2026 sampai dengan tanggal 31 Maret 2027.',
  tahunPelajaran: '2026/ 2027',
  programKeahlian: 'PENGEMBANGAN PERANGKAT LUNAK DAN GIM',
  kepalaSekolah: 'Amin Zaenudin, SE',
  barisMinimal: 8,
};

const FONT = 'Times New Roman';
const SALAM_BUKA = 'السلام عليكم ورحمة الله وبركاته';
const SALAM_TUTUP = 'والسلام عليكم ورحمة الله وبركاته';
const TANPA_GARIS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

type Peserta = { nama: string; kelas: string };

function t(
  text: string,
  opt: {
    bold?: boolean;
    size?: number;
    italics?: boolean;
    underline?: boolean;
  } = {},
) {
  return new TextRun({
    text,
    font: FONT,
    bold: opt.bold,
    italics: opt.italics,
    size: (opt.size ?? 12) * 2,
    underline: opt.underline ? {} : undefined,
  });
}

function p(
  children: TextRun[] | string,
  opt: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    indent?: number;
    after?: number;
    before?: number;
    line?: number;
  } = {},
) {
  return new Paragraph({
    children: typeof children === 'string' ? [t(children)] : children,
    alignment: opt.align,
    indent: opt.indent ? { firstLine: opt.indent } : undefined,
    spacing: {
      after: opt.after ?? 0,
      before: opt.before ?? 0,
      line: opt.line ?? 276,
    },
  });
}

function garisGanda() {
  return new Paragraph({
    spacing: { after: 80 },
    border: {
      bottom: {
        style: BorderStyle.DOUBLE,
        size: 12,
        color: '000000',
        space: 1,
      },
    },
    children: [],
  });
}

function sel(
  children: Paragraph[],
  width: number,
  opt: { merge?: 'restart' | 'continue'; center?: boolean } = {},
) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: opt.center ? VerticalAlign.CENTER : VerticalAlign.TOP,
    verticalMerge:
      opt.merge === 'restart'
        ? VerticalMergeType.RESTART
        : opt.merge === 'continue'
          ? VerticalMergeType.CONTINUE
          : undefined,
    margins: { top: 20, bottom: 20, left: 100, right: 100 },
    children,
  });
}

function tabelPeserta(peserta: Peserta[]) {
  const lebar = [600, 4200, 1300, 3000];
  const jumlah = Math.max(SURAT.barisMinimal, peserta.length);
  const header = new TableRow({
    tableHeader: true,
    children: ['NO', 'NAMA', 'KELAS', 'PROGRAM KEAHLIAN'].map((h, i) =>
      sel(
        [p([t(h, { bold: true })], { align: AlignmentType.CENTER })],
        lebar[i],
        { center: true },
      ),
    ),
  });
  const baris = Array.from({ length: jumlah }, (_, i) => {
    const s = peserta[i];
    return new TableRow({
      height: { value: 270, rule: 'atLeast' },
      children: [
        sel([p(`${i + 1}.`)], lebar[0]),
        sel([p(s ? [t(s.nama, { size: 11 })] : '')], lebar[1], {
          center: true,
        }),
        sel(
          [
            p(s ? [t(s.kelas, { size: 11 })] : '', {
              align: AlignmentType.CENTER,
            }),
          ],
          lebar[2],
          { center: true },
        ),
        i === 0
          ? sel(
              [
                p([t(SURAT.programKeahlian, { bold: true })], {
                  align: AlignmentType.CENTER,
                  line: 320,
                }),
              ],
              lebar[3],
              { merge: 'restart', center: true },
            )
          : sel([p('')], lebar[3], { merge: 'continue' }),
      ],
    });
  });
  return new Table({
    width: { size: lebar.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: lebar,
    rows: [header, ...baris],
  });
}

function aset(nama: string): Buffer | null {
  const path = join(process.cwd(), 'assets', nama);
  return existsSync(path) ? readFileSync(path) : null;
}

function gambar(
  data: Buffer | null,
  type: 'png' | 'jpg',
  width: number,
  height: number,
) {
  return data
    ? [new ImageRun({ type, data, transformation: { width, height } })]
    : [];
}

function kop() {
  const tengah = [
    p([t("LEMBAGA PENDIDIKAN MA'ARIF NU", { bold: true, size: 12 })], {
      align: AlignmentType.CENTER,
    }),
    p([t("SMK MA'ARIF NU 01 LIMPUNG", { bold: true, size: 16 })], {
      align: AlignmentType.CENTER,
    }),
    p([t('KABUPATEN BATANG', { bold: true, size: 12 })], {
      align: AlignmentType.CENTER,
    }),
    p([t('KOMPETENSI KEAHLIAN:', { bold: true, size: 8 })], {
      align: AlignmentType.CENTER,
    }),
    p(
      [
        t(
          'Akuntansi dan Keuangan Lembaga – Pemasaran – Teknik Otomotif - Pengembangan Perangkat Lunak dan Gim',
          { bold: true, size: 8 },
        ),
      ],
      { align: AlignmentType.CENTER },
    ),
    p(
      [
        t(
          'Alamat: Jl.KH.Wahid Hasyim No.1 Limpung 51271 Tlp. 0285 4468655 Web: smklimpung.sch.id',
          { size: 8 },
        ),
      ],
      { align: AlignmentType.CENTER },
    ),
  ];
  const selLogo = (
    children: ImageRun[],
    width: number,
    align: (typeof AlignmentType)[keyof typeof AlignmentType],
  ) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: TANPA_GARIS,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: align, children })],
    });
  return [
    new Table({
      width: { size: 9100, type: WidthType.DXA },
      columnWidths: [1250, 6600, 1250],
      borders: TANPA_GARIS,
      rows: [
        new TableRow({
          children: [
            selLogo(
              gambar(aset('logo-lp-maarif.jpg'), 'jpg', 78, 69),
              1250,
              AlignmentType.LEFT,
            ),
            new TableCell({
              width: { size: 6600, type: WidthType.DXA },
              borders: TANPA_GARIS,
              verticalAlign: VerticalAlign.CENTER,
              children: tengah,
            }),
            selLogo(
              gambar(aset('logo-smk.png'), 'png', 68, 73),
              1250,
              AlignmentType.RIGHT,
            ),
          ],
        }),
      ],
    }),
    garisGanda(),
  ];
}

function salam(nama: string, teks: string, w: number, h: number) {
  const img = aset(nama);
  return img
    ? new ImageRun({
        type: 'png',
        data: img,
        transformation: { width: w, height: h },
      })
    : new TextRun({
        text: teks,
        font: 'Traditional Arabic',
        size: 28,
        rightToLeft: true,
      });
}

function barisLabel(label: string, isi: TextRun[], kanan?: string) {
  return new Paragraph({
    spacing: { after: 0, line: 276 },
    tabStops: [
      { type: TabStopType.LEFT, position: 1000 },
      { type: TabStopType.RIGHT, position: 9100 },
    ],
    children: [
      t(label),
      new TextRun({ text: '\t', font: FONT }),
      t(': '),
      ...isi,
      ...(kanan ? [new TextRun({ text: '\t', font: FONT }), t(kanan)] : []),
    ],
  });
}

function blokTtdKepala(ttd: Buffer | null) {
  const KIRI_TTD = 5600;
  return [
    new Paragraph({
      spacing: { before: 60, after: 0 },
      tabStops: [{ type: TabStopType.LEFT, position: KIRI_TTD }],
      children: [
        salam('salam-penutup.png', SALAM_TUTUP, 175, 28),
        new TextRun({ text: '\t', font: FONT }),
        t('Kepala Sekolah,'),
      ],
    }),
    ttd
      ? new Paragraph({
          indent: { left: KIRI_TTD - 300 },
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: 'png',
              data: ttd,
              transformation: {
                width: 150,
                height: Math.round((150 * 413) / 642),
              },
            }),
          ],
        })
      : new Paragraph({ spacing: { after: 900 }, children: [] }),
    new Paragraph({
      indent: { left: KIRI_TTD },
      spacing: { after: 0 },
      children: [t(SURAT.kepalaSekolah, { bold: true, underline: true })],
    }),
  ];
}

function blokTtdInstansi() {
  const kanan = [
    p('........................., ................................... 2026', {
      before: 120,
    }),
    p('Mengetahui'),
    p('Pimpinan Instansi', { after: 900 }),
    p('( ........................................................... )'),
    p([
      t('*Tanda tangan, nama lengkap beserta gelar dan stempel instansi', {
        italics: true,
        size: 8,
      }),
    ]),
  ];
  return new Table({
    width: { size: 9100, type: WidthType.DXA },
    columnWidths: [4600, 4500],
    borders: TANPA_GARIS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4600, type: WidthType.DXA },
            borders: TANPA_GARIS,
            children: [p('')],
          }),
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            borders: TANPA_GARIS,
            children: kanan,
          }),
        ],
      }),
    ],
  });
}

function sanitize(s: string) {
  return (
    s
      .replace(/[^\w.-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60) || 'Instansi'
  );
}

@Injectable()
export class SuratPermohonanService {
  constructor(private readonly prisma: PrismaService) {}

  private async peserta(tempatId: string): Promise<Peserta[]> {
    const [daftar, tempat] = await Promise.all([
      this.prisma.pendaftaranMagang.findMany({
        where: { tempatMagangId: tempatId, status: 'DITERIMA' },
        select: {
          siswa: {
            select: {
              id: true,
              nama: true,
              kelas: { select: { nama: true } },
              user: { select: { nama: true } },
            },
          },
        },
      }),
      this.prisma.penempatanMagang.findMany({
        where: {
          tempatMagangId: tempatId,
          status: { in: ['MENUNGGU', 'AKTIF'] },
        },
        select: {
          siswa: {
            select: {
              id: true,
              nama: true,
              kelas: { select: { nama: true } },
              user: { select: { nama: true } },
            },
          },
        },
      }),
    ]);
    const map = new Map<string, Peserta>();
    [...daftar, ...tempat].forEach(({ siswa }) => {
      map.set(siswa.id, {
        nama: (siswa.user?.nama ?? siswa.nama ?? '-').trim().toUpperCase(),
        kelas: siswa.kelas?.nama ?? '-',
      });
    });
    return [...map.values()].sort((a, b) =>
      a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }),
    );
  }

  async buat(tempatId: string): Promise<{ buffer: Buffer; filename: string }> {
    const tempat = await this.prisma.tempatMagang.findUnique({
      where: { id: tempatId },
      select: { namaTempat: true },
    });
    if (!tempat) throw new NotFoundException('Instansi tidak ditemukan');
    const instansi = tempat.namaTempat.trim().toUpperCase();
    const peserta = await this.peserta(tempatId);
    const ttdPath = join(process.cwd(), 'assets', 'ttd-kepala-sekolah.png');
    const ttd = existsSync(ttdPath) ? readFileSync(ttdPath) : null;

    const halaman1 = [
      ...kop(),
      barisLabel('Nomor', [t(SURAT.nomor)], SURAT.tanggal),
      barisLabel('Lamp', [t('Satu Lembar')]),
      barisLabel('Perihal', [
        t('Permohonan Tempat Praktik Kerja Lapangan', { bold: true }),
      ]),
      p('', { after: 60 }),
      p('Kepada Yth :'),
      p('Bapak/ Ibu/ Kepala/ Pimpinan'),
      p([t(instansi, { bold: true })]),
      p('Di'),
      p([t('Tempat', { underline: true })], { indent: 720, after: 0 }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [salam('salam-pembuka.png', SALAM_BUKA, 170, 26)],
      }),
      p(
        `Berdasarkan Program Kerja Sekolah Menengah Kejuruan (SMK) Ma'arif NU 01 Limpung Tahun Pelajaran ${SURAT.tahunPelajaran} tentang pelaksanaan Praktik Kerja Lapangan (PKL) pada Institusi pasangan/ Instansi terkait sesuai dengan Program Keahlian masing-masing.`,
        { align: AlignmentType.JUSTIFIED, indent: 720, line: 320 },
      ),
      p(
        [
          t(
            'Sehubungan dengan hal tersebut, kami mohon kepada Bapak/ Ibu pimpinan berkenan menerima peserta didik kami untuk melaksanakan kegiatan Praktik Kerja Lapangan guna mendapatkan pengalaman kerja dan mengamalkan ilmu yang di dapatkan dari sekolah pada dunia kerja yang nyata mulai dari ',
          ),
          t(SURAT.periode, { bold: true }),
        ],
        { align: AlignmentType.JUSTIFIED, indent: 720, line: 320 },
      ),
      p('Adapun peserta didik kami sebagai berikut:', { after: 80, line: 320 }),
      tabelPeserta(peserta),
      p(
        'Demikian surat permohonan ini kami sampaikan, atas perhatian dan kerjasamanya kami haturkan terima kasih.',
        { align: AlignmentType.JUSTIFIED, before: 120, line: 320 },
      ),
      ...blokTtdKepala(ttd),
    ];

    const halaman2 = [
      new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: 276 },
        children: [t('SURAT KESANGGUPAN INSTANSI', { bold: true })],
      }),
      p([t(instansi, { bold: true })], { align: AlignmentType.CENTER }),
      garisGanda(),
      p('Nomor :….........................................', {
        align: AlignmentType.CENTER,
        before: 60,
        after: 120,
      }),
      p(
        [
          t(
            'Berdasarkan Surat Permohonan Tempat Praktik Kerja Lapangan (PKL) nomor: ',
          ),
          t(`${SURAT.nomor} tertanggal ${SURAT.tanggal}.`),
        ],
        { align: AlignmentType.JUSTIFIED, indent: 720, line: 320 },
      ),
      p('Yang bertanda tangan di bawah ini:', { line: 360, after: 120 }),
      ...['Nama Lengkap', 'Jabatan', 'Instansi', 'Nomor HP'].map(
        (l) =>
          new Paragraph({
            spacing: { after: 80, line: 276 },
            indent: { left: 120 },
            tabStops: [{ type: TabStopType.LEFT, position: 1700 }],
            children: [
              t(l),
              new TextRun({ text: '\t', font: FONT }),
              t(
                ':  ...............................................................................',
              ),
            ],
          }),
      ),
      p(
        [
          t(
            "Dengan ini menyatakan bersedia menerima permohonan tempat Praktik Kerja Lapangan (PKL) peserta didik SMK MA'ARIF NU 01 LIMPUNG untuk ditempatkan pada instansi kami terhitung mulai ",
          ),
          t(SURAT.periode, { bold: true }),
        ],
        { align: AlignmentType.JUSTIFIED, indent: 720, line: 320 },
      ),
      p('Adapun nama peserta Praktik Kerja Lapangan sebagai berikut:', {
        after: 80,
        line: 320,
      }),
      tabelPeserta(peserta),
      p(
        'Demikian surat kesanggupan ini kami buat, atas perhatian serta kerjasamanya kami haturkan terima kasih.',
        { align: AlignmentType.JUSTIFIED, indent: 720, before: 120, line: 320 },
      ),
      blokTtdInstansi(),
    ];

    const doc = new Document({
      creator: "SMK Ma'arif NU 01 Limpung",
      title: `Surat Permohonan PKL - ${tempat.namaTempat}`,
      styles: { default: { document: { run: { font: FONT, size: 24 } } } },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 480, bottom: 480, left: 1400, right: 1400 },
            },
          },
          children: [...halaman1, ...halaman2],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return {
      buffer,
      filename: `Surat_Permohonan_PKL_${sanitize(tempat.namaTempat)}.docx`,
    };
  }
}
