import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTempatMagangDto } from './dto/create-tempat-magang.dto';
import { UpdateTempatMagangDto } from './dto/update-tempat-magang.dto';

const INCLUDE_COUNT = {
  _count: { select: { penempatan: { where: { status: { in: ['MENUNGGU', 'AKTIF'] as ('MENUNGGU' | 'AKTIF')[] } } } } },
} as const;

const KOLOM_ALAMAT = ['dukuh', 'rt', 'rw', 'desa', 'kecamatan', 'kabupaten'] as const;
type KolomAlamat = (typeof KOLOM_ALAMAT)[number];

function susunAlamat(src: Record<KolomAlamat, string>) {
  const b = Object.fromEntries(KOLOM_ALAMAT.map((k) => [k, (src[k] ?? '').trim()])) as Record<KolomAlamat, string>;
  return {
    bagian: b,
    teks: `Dukuh ${b.dukuh} RT ${b.rt}/RW ${b.rw}, Desa ${b.desa}, Kec. ${b.kecamatan}, Kab. ${b.kabupaten}`,
  };
}

function normalJK(v?: string | null) {
  return v === 'Laki-laki' || v === 'Perempuan' ? v : null;
}

@Injectable()
export class TempatMagangService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tempatMagang.findMany({
      include: INCLUDE_COUNT,
      orderBy: { namaTempat: 'asc' },
    });
  }

  async findPilihan() {
    const list = await this.prisma.tempatMagang.findMany({
      include: INCLUDE_COUNT,
      orderBy: { namaTempat: 'asc' },
    });
    return list.map((t) => ({
      id: t.id,
      namaTempat: t.namaTempat,
      alamat: t.alamat,
      jenisKelamin: t.jenisKelamin,
      kuota: t.kuota,
      terisi: t._count.penempatan,
      sisa: Math.max(0, t.kuota - t._count.penempatan),
    }));
  }

  async findInstansi() {
    const list = await this.prisma.tempatMagang.findMany({
      where: {
        OR: [
          { dibuatSiswa: false },
          { penempatan: { some: { status: { in: ['AKTIF', 'SELESAI'] } } } },
          { pendaftaran: { some: { status: { in: ['MENUNGGU', 'DITERIMA'] } } } },
        ],
      },
      include: {
        penempatan: {
          where: { status: { in: ['MENUNGGU', 'AKTIF'] } },
          select: {
            status: true,
            siswa: { select: { id: true, nama: true, kelas: { select: { nama: true } }, user: { select: { nama: true } } } },
          },
        },
        pendaftaran: {
          where: { status: { in: ['MENUNGGU', 'DITERIMA'] } },
          select: {
            siswa: { select: { id: true, nama: true, kelas: { select: { nama: true } }, user: { select: { nama: true } } } },
          },
        },
      },
      orderBy: { namaTempat: 'asc' },
    });
    return list.map((t) => {
      const terisi = new Set([...t.pendaftaran, ...t.penempatan].map((r) => r.siswa.id)).size;
      type SiswaRow = (typeof t.pendaftaran)[number]['siswa'];
      const susun = (rows: { siswa: SiswaRow }[]) => {
        const peta = new Map<string, { id: string; nama: string; kelas: string }>();
        rows.forEach(({ siswa: s }) => peta.set(s.id, { id: s.id, nama: s.user?.nama ?? s.nama ?? 'Siswa', kelas: s.kelas?.nama ?? '' }));
        return [...peta.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
      };
      const pendaftar = susun(t.pendaftaran);
      const ditempati = susun(t.penempatan.filter((p) => p.status === 'AKTIF'));
      return {
        id: t.id,
        namaTempat: t.namaTempat,
        namaPimpinan: t.namaPimpinan,
        dukuh: t.dukuh,
        rt: t.rt,
        rw: t.rw,
        desa: t.desa,
        kecamatan: t.kecamatan,
        kabupaten: t.kabupaten,
        alamat: t.alamat,
        noWaUsaha: t.noWaUsaha ?? t.kontak,
        jenisKelamin: t.jenisKelamin,
        dibuatSiswa: t.dibuatSiswa,
        kuota: t.kuota,
        terisi,
        sisa: t.dibuatSiswa ? null : Math.max(0, t.kuota - terisi),
        siswa: pendaftar,
        pendaftar,
        ditempati,
      };
    });
  }

  async findOne(id: string) {
    const tempat = await this.prisma.tempatMagang.findUnique({ where: { id }, include: INCLUDE_COUNT });
    if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');
    return tempat;
  }

  create(dto: CreateTempatMagangDto) {
    const adaAlamat = KOLOM_ALAMAT.every((k) => dto[k]?.trim());
    const alamat = adaAlamat ? susunAlamat(dto as Record<KolomAlamat, string>) : null;
    return this.prisma.tempatMagang.create({
      data: {
        namaTempat: dto.namaTempat.trim(),
        kuota: dto.kuota ?? 1,
        jenisKelamin: normalJK(dto.jenisKelamin),
        ...(alamat ? { ...alamat.bagian, alamat: alamat.teks } : {}),
      },
      include: INCLUDE_COUNT,
    });
  }

  async update(id: string, dto: UpdateTempatMagangDto) {
    const lama = await this.findOne(id);
    const adaAlamat = KOLOM_ALAMAT.some((k) => dto[k] !== undefined);
    const alamat = adaAlamat
      ? susunAlamat(Object.fromEntries(KOLOM_ALAMAT.map((k) => [k, dto[k] ?? lama[k] ?? ''])) as Record<KolomAlamat, string>)
      : null;
    return this.prisma.tempatMagang.update({
      where: { id },
      data: {
        ...(dto.namaTempat !== undefined ? { namaTempat: dto.namaTempat.trim() } : {}),
        ...(dto.kuota !== undefined ? { kuota: dto.kuota } : {}),
        ...(dto.jenisKelamin !== undefined ? { jenisKelamin: normalJK(dto.jenisKelamin) } : {}),
        ...(alamat ? { ...alamat.bagian, alamat: alamat.teks } : {}),
      },
      include: INCLUDE_COUNT,
    });
  }

  async remove(id: string, paksa = false) {
    const tempat = await this.prisma.tempatMagang.findUnique({
      where: { id },
      include: { _count: { select: { penempatan: true } } },
    });
    if (!tempat) throw new NotFoundException('Tempat magang tidak ditemukan');
    if (paksa && tempat._count.penempatan > 0) {
      const penempatan = await this.prisma.penempatanMagang.findMany({
        where: { tempatMagangId: id },
        select: { id: true, _count: { select: { absensi: true, izin: true, laporDiri: true } }, laporanAkhir: { select: { id: true } } },
      });
      const berriwayat = penempatan.filter((p) => p._count.absensi + p._count.izin + p._count.laporDiri > 0 || p.laporanAkhir);
      if (berriwayat.length > 0) {
        throw new BadRequestException(`${berriwayat.length} siswa di instansi ini sudah punya riwayat absensi/laporan PKL, ubah status penempatannya menjadi Selesai/Batal daripada menghapus`);
      }
      await this.prisma.$transaction([
        this.prisma.penempatanMagang.deleteMany({ where: { tempatMagangId: id } }),
        this.prisma.tempatMagang.delete({ where: { id } }),
      ]);
      return { id };
    }
    if (tempat._count.penempatan > 0) {
      throw new BadRequestException('Tempat ini masih memiliki riwayat penempatan siswa, tidak dapat dihapus');
    }
    return this.prisma.tempatMagang.delete({ where: { id } });
  }
}
