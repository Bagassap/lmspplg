import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiswaDto } from './dto/update-siswa.dto';
import { UpdateProfilSiswaDto } from './dto/update-profil-siswa.dto';
import { LengkapiProfilSiswaDto } from './dto/lengkapi-profil-siswa.dto';

const INCLUDE_USER = {
  user: { select: { id: true, nama: true, email: true, mustChangePassword: true, fotoProfil: true } },
  kelas: {
    include: {
      waliKelasGuru: { include: { user: { select: { id: true, nama: true } } } },
    },
  },
} as const;

@Injectable()
export class SiswaService {
  private readonly logger = new Logger(SiswaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async kelasWaliIds(userId: string): Promise<string[]> {
    const guru = await this.prisma.guru.findUnique({ where: { userId } });
    if (!guru) return [];
    const kelasWali = await this.prisma.kelas.findMany({ where: { waliKelasGuruId: guru.id }, select: { id: true } });
    return kelasWali.map((k) => k.id);
  }

  async findAll(
    query: { search?: string; kelasId?: string; jurusan?: string; jenisKelamin?: string },
    actor: { id: string; role: string },
  ) {
    const { search, kelasId, jurusan, jenisKelamin } = query;

    let kelasIdFilter: string | { in: string[] } | undefined = kelasId;
    if (actor.role === 'GURU') {
      const waliIds = await this.kelasWaliIds(actor.id);
      kelasIdFilter = kelasId
        ? (waliIds.includes(kelasId) ? kelasId : { in: [] })
        : { in: waliIds };
    }

    return this.prisma.siswa.findMany({
      where: {
        status: 'AKTIF',
        ...(kelasIdFilter ? { kelasId: kelasIdFilter } : {}),
        ...(jurusan ? { jurusan } : {}),
        ...(jenisKelamin ? { jenisKelamin } : {}),
        ...(search
          ? {
              OR: [
                { nama: { contains: search, mode: 'insensitive' } },
                { nis: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: INCLUDE_USER,
      orderBy: [{ kelas: { nama: 'asc' } }, { nama: 'asc' }],
    });
  }

  async findOne(id: string, actor: { id: string; role: string }) {
    const siswa = await this.prisma.siswa.findUnique({ where: { id }, include: INCLUDE_USER });
    if (!siswa) throw new NotFoundException('Siswa tidak ditemukan');
    if (actor.role === 'GURU') {
      const waliIds = await this.kelasWaliIds(actor.id);
      if (!waliIds.includes(siswa.kelasId)) throw new NotFoundException('Siswa tidak ditemukan');
    }
    return siswa;
  }

  async findMine(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId }, include: INCLUDE_USER });
    if (!siswa) throw new NotFoundException('Profil siswa tidak ditemukan');
    return siswa;
  }

  async update(id: string, dto: UpdateSiswaDto) {
    const exists = await this.prisma.siswa.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Siswa tidak ditemukan');
    const data: Record<string, unknown> = { ...dto };
    if (dto.tanggalLahir) data.tanggalLahir = new Date(dto.tanggalLahir);
    return this.prisma.siswa.update({ where: { id }, data, include: INCLUDE_USER });
  }

  async updateMine(userId: string, dto: UpdateProfilSiswaDto) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const data: Record<string, unknown> = {
      jenisKelamin: dto.jenisKelamin,
      tempatLahir: dto.tempatLahir,
      namaOrtu: dto.namaOrtu,
      noHp: dto.noHp,
      dukuh: dto.dukuh,
      rt: dto.rt,
      rw: dto.rw,
      desa: dto.desa,
      kecamatan: dto.kecamatan,
      kabupaten: dto.kabupaten,
    };
    if (dto.tanggalLahir) data.tanggalLahir = new Date(dto.tanggalLahir);
    return this.prisma.siswa.update({
      where: { id: siswa.id },
      data,
      include: INCLUDE_USER,
    });
  }

  async lengkapiProfil(userId: string, dto: LengkapiProfilSiswaDto) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');

    await this.prisma.siswa.update({
      where: { id: siswa.id },
      data: {
        tempatLahir: dto.tempatLahir,
        tanggalLahir: new Date(dto.tanggalLahir),
        jenisKelamin: dto.jenisKelamin,
        noHp: dto.noHp,
        namaOrtu: dto.namaOrtu,
        dukuh: dto.dukuh,
        rt: dto.rt,
        rw: dto.rw,
        desa: dto.desa,
        kecamatan: dto.kecamatan,
        kabupaten: dto.kabupaten,
      },
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: true },
    });

    const payload = {
      sub: updatedUser.id,
      role: updatedUser.role,
      nama: updatedUser.nama,
      loginId: updatedUser.loginId,
      mustChangePassword: updatedUser.mustChangePassword,
      profileCompleted: updatedUser.profileCompleted,
      bypassIdentityVerification: updatedUser.bypassIdentityVerification,
      fotoProfil: updatedUser.fotoProfil,
      hasFotoProfil: !!updatedUser.fotoProfil,
    };
    const token = this.jwtService.sign(payload);

    return { access_token: token, message: 'Profil berhasil dilengkapi' };
  }

  /**
   * Groups siswa by kelas for the Data Siswa PDF/Excel export. With a
   * kelasId, returns just that one kelas (access-checked for GURU). Without
   * one, ADMIN gets every kelas and GURU is scoped to their own wali-kelas
   * classes automatically.
   */
  async getSiswaForExport(
    kelasId: string | undefined,
    jurusan: string | undefined,
    actor: { id: string; role: string },
  ) {
    if (kelasId && actor.role === 'GURU') {
      const waliIds = await this.kelasWaliIds(actor.id);
      if (!waliIds.includes(kelasId)) throw new ForbiddenException('Anda tidak memiliki akses ke kelas ini');
    }

    let kelasIds: string[] | undefined;
    if (kelasId) {
      kelasIds = [kelasId];
    } else if (actor.role === 'GURU') {
      kelasIds = await this.kelasWaliIds(actor.id);
    }

    const kelasList = await this.prisma.kelas.findMany({
      where: kelasIds ? { id: { in: kelasIds } } : undefined,
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true },
    });

    const groups: { kelas: { id: string; nama: string }; siswa: Awaited<ReturnType<typeof this.prisma.siswa.findMany>> }[] = [];
    for (const kelas of kelasList) {
      const siswa = await this.prisma.siswa.findMany({
        where: { kelasId: kelas.id, status: 'AKTIF', ...(jurusan ? { jurusan } : {}) },
        include: { user: { select: { mustChangePassword: true } } },
        orderBy: { nama: 'asc' },
      });
      if (siswa.length > 0) groups.push({ kelas, siswa });
    }
    return groups;
  }

  // Kenaikan kelas: pindahkan semua siswa AKTIF dari satu kelas ke kelas
  // lain sekaligus (mis. "X PPLG 1" -> "XI PPLG 1" di awal tahun ajaran
  // baru). Kelas tujuan harus sudah dibuat lebih dulu lewat Kelola Kelas.
  async naikkanKelas(dariKelasId: string, keKelasId: string) {
    if (dariKelasId === keKelasId) {
      throw new BadRequestException('Kelas asal dan tujuan tidak boleh sama');
    }
    const [dari, ke] = await Promise.all([
      this.prisma.kelas.findUnique({ where: { id: dariKelasId } }),
      this.prisma.kelas.findUnique({ where: { id: keKelasId } }),
    ]);
    if (!dari) throw new NotFoundException('Kelas asal tidak ditemukan');
    if (!ke) throw new NotFoundException('Kelas tujuan tidak ditemukan');

    const result = await this.prisma.siswa.updateMany({
      where: { kelasId: dariKelasId, status: 'AKTIF' },
      data: { kelasId: keKelasId },
    });
    return { jumlahSiswa: result.count, dariKelas: dari.nama, keKelas: ke.nama };
  }

  // Kumpulkan path file fisik (foto absensi/tugas/PKL/UKK) milik satu siswa
  // SEBELUM baris-baris riwayatnya dihapus, supaya file-nya bisa ikut
  // dibersihkan dari disk setelah transaksi database sukses. ttd/ttdPulang
  // sengaja tidak ikut — itu data URI base64 inline, bukan path file.
  private async collectFilePaths(siswaId: string): Promise<string[]> {
    const [absensiHarian, tugasSubmisi, absensiMagang, laporDiri, laporanAkhir, submisiUkk, absensiUjianUkk, berkasJawabanUkk] =
      await Promise.all([
        this.prisma.absensiHarian.findMany({ where: { siswaId }, select: { foto: true, fotoPulang: true } }),
        this.prisma.tugasSubmisi.findMany({ where: { siswaId }, select: { fileUrl: true } }),
        this.prisma.absensiMagang.findMany({ where: { siswaId }, select: { foto: true, fotoPulang: true } }),
        this.prisma.laporDiriMagang.findMany({ where: { siswaId }, select: { fileUrl: true } }),
        this.prisma.laporanAkhirMagang.findMany({ where: { siswaId }, select: { fileUrl: true } }),
        this.prisma.submisiProjectUKK.findMany({ where: { siswaId }, select: { fileUrl: true } }),
        this.prisma.absensiUjianUKK.findMany({ where: { siswaId }, select: { tandaTanganUrl: true } }),
        this.prisma.berkasJawabanUKK.findMany({ where: { siswaId }, select: { fileUrl: true } }),
      ]);
    return [
      ...absensiHarian.flatMap((a) => [a.foto, a.fotoPulang]),
      ...tugasSubmisi.map((t) => t.fileUrl),
      ...absensiMagang.flatMap((a) => [a.foto, a.fotoPulang]),
      ...laporDiri.map((l) => l.fileUrl),
      ...laporanAkhir.map((l) => l.fileUrl),
      ...submisiUkk.map((s) => s.fileUrl),
      ...absensiUjianUkk.map((a) => a.tandaTanganUrl),
      ...berkasJawabanUkk.map((b) => b.fileUrl),
    ].filter((p): p is string => !!p && p.startsWith('/uploads/'));
  }

  private async hapusFile(url: string) {
    const filePath = join(process.cwd(), url.replace(/^\//, ''));
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        this.logger.warn(`Gagal hapus file ${filePath}: ${(err as Error)?.message ?? err}`);
      }
    }
  }

  // Hapus PERMANEN satu siswa beserta SELURUH riwayatnya (absensi harian,
  // tugas, PKL, UKK) dan akun login-nya (kalau ada) — atas permintaan
  // eksplisit sekolah, BUKAN sekadar soft-delete/ubah status. TIDAK BISA
  // DIBATALKAN. Dipanggil oleh keluarkanSiswa() (satu siswa) maupun
  // luluskanKelas() (satu kelas sekaligus).
  //
  // Urutan penghapusan wajib begini karena FK Restrict (default Prisma/
  // Postgres untuk relasi wajib tanpa onDelete eksplisit) menolak hapus
  // parent selama masih ada child yang menunjuknya:
  //   1. Anak-anak PenempatanMagang (AbsensiMagang/IzinMagang/LaporDiri/
  //      LaporanAkhir) dulu — mereka punya FK penempatanId ke
  //      PenempatanMagang, baru PenempatanMagang sendiri.
  //   2. AbsensiHarian, TugasSubmisi (TugasJawaban ikut cascade otomatis),
  //      SubmisiProjectUKK, AbsensiUjianUKK, BerkasJawabanUKK, NilaiUKK.
  //   3. Kalau siswa punya akun (userId): KomentarPengumuman & DiskusiUKK
  //      Restrict ke User (bukan ke Siswa) — wajib dihapus dulu sebelum User
  //      dihapus. Ini otomatis ikut menghapus balasan siswa/guru LAIN pada
  //      komentar/diskusi milik siswa ini (parentId-nya onDelete: Cascade)
  //      — konsekuensi yang diterima demi penghapusan total.
  //   4. Baris Siswa (CatatanSiswa & PesertaUKK sudah onDelete: Cascade di
  //      skema, otomatis ikut terhapus di sini tanpa langkah manual).
  //   5. Baris User (kalau ada) — Notification ikut cascade otomatis,
  //      PasswordResetRequest otomatis di-SetNull.
  private async hardDeleteSatuSiswa(siswaId: string): Promise<{ id: string; nama: string | null } | null> {
    const siswa = await this.prisma.siswa.findUnique({ where: { id: siswaId } });
    if (!siswa) return null;

    const filePaths = await this.collectFilePaths(siswaId);
    const userId = siswa.userId;

    await this.prisma.$transaction([
      this.prisma.absensiMagang.deleteMany({ where: { siswaId } }),
      this.prisma.izinMagang.deleteMany({ where: { siswaId } }),
      this.prisma.laporDiriMagang.deleteMany({ where: { siswaId } }),
      this.prisma.laporanAkhirMagang.deleteMany({ where: { siswaId } }),
      this.prisma.penempatanMagang.deleteMany({ where: { siswaId } }),

      this.prisma.absensiHarian.deleteMany({ where: { siswaId } }),
      this.prisma.tugasSubmisi.deleteMany({ where: { siswaId } }),

      this.prisma.submisiProjectUKK.deleteMany({ where: { siswaId } }),
      this.prisma.absensiUjianUKK.deleteMany({ where: { siswaId } }),
      this.prisma.berkasJawabanUKK.deleteMany({ where: { siswaId } }),
      this.prisma.nilaiUKK.deleteMany({ where: { siswaId } }),

      ...(userId
        ? [
            this.prisma.komentarPengumuman.deleteMany({ where: { authorId: userId } }),
            this.prisma.diskusiUKK.deleteMany({ where: { userId } }),
          ]
        : []),

      this.prisma.siswa.delete({ where: { id: siswaId } }),

      ...(userId ? [this.prisma.user.delete({ where: { id: userId } })] : []),
    ]);

    for (const p of filePaths) await this.hapusFile(p);

    return { id: siswaId, nama: siswa.nama };
  }

  // Siswa keluar/pindah sekolah: hapus permanen (lihat hardDeleteSatuSiswa).
  async keluarkanSiswa(id: string) {
    const result = await this.hardDeleteSatuSiswa(id);
    if (!result) throw new NotFoundException('Siswa tidak ditemukan');
    return result;
  }

  // Kelulusan: hapus permanen semua siswa AKTIF di satu kelas (biasanya
  // kelas XII) satu per satu (lihat hardDeleteSatuSiswa) — bukan lagi
  // ditandai status LULUS. Kalau satu siswa gagal dihapus (mis. state tak
  // terduga), siswa lain tetap lanjut diproses; nama yang gagal dilaporkan
  // balik di `gagal` supaya admin tahu siapa yang perlu ditangani manual.
  async luluskanKelas(kelasId: string) {
    const kelas = await this.prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');

    const siswaList = await this.prisma.siswa.findMany({
      where: { kelasId, status: 'AKTIF' },
      select: { id: true, nama: true },
    });

    const gagal: string[] = [];
    for (const s of siswaList) {
      try {
        await this.hardDeleteSatuSiswa(s.id);
      } catch (err) {
        this.logger.error(`Gagal hapus permanen siswa ${s.nama ?? s.id}: ${(err as Error)?.message ?? err}`);
        gagal.push(s.nama ?? s.id);
      }
    }

    return { jumlahSiswa: siswaList.length - gagal.length, kelas: kelas.nama, gagal };
  }
}
