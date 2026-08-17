import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { CreateTugasDto } from './dto/create-tugas.dto';
import { UpdateTugasDto } from './dto/update-tugas.dto';
import { SubmitTugasDto } from './dto/submit-tugas.dto';

type Actor = { id: string; role: string };

interface SoalInput {
  pertanyaan: string;
  pilihanA?: string;
  pilihanB?: string;
  pilihanC?: string;
  pilihanD?: string;
  jawabanBenar?: string;
}

interface JawabanInput {
  soalId: string;
  jawabanPilihan?: string;
  jawabanEssay?: string;
}

const INCLUDE_KELAS = { select: { id: true, nama: true } } as const;
const INCLUDE_CREATED_BY = { select: { id: true, nama: true, role: true } } as const;
const SOAL_ORDER = { orderBy: { urutan: 'asc' as const } };

function parseJsonArray<T>(raw: string | undefined, label: string): T[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BadRequestException(`Format ${label} tidak valid`);
  }
  if (!Array.isArray(parsed)) throw new BadRequestException(`Format ${label} tidak valid`);
  return parsed as T[];
}

const NEEDS_SOAL = new Set(['PILIHAN_GANDA', 'ESSAY']);

@Injectable()
export class TugasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private async siswaKelasId(userId: string): Promise<string | null> {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId }, select: { kelasId: true } });
    return siswa?.kelasId ?? null;
  }

  private async notifySiswaBaru(kelasId: string | null, title: string, message: string) {
    const siswaUsers = await this.prisma.siswa.findMany({
      where: { userId: { not: null }, ...(kelasId ? { kelasId } : {}) },
      select: { userId: true },
    });
    await this.notificationService.createMany(
      siswaUsers.map((s) => s.userId!),
      { title, message, type: NotificationType.TUGAS, link: '/materi?tab=tugas' },
    );
  }

  private async replaceSoal(tugasId: string, tipe: string, soalJson: string | undefined) {
    if (!NEEDS_SOAL.has(tipe)) return;
    const soal = parseJsonArray<SoalInput>(soalJson, 'soal');
    await this.prisma.tugasSoal.deleteMany({ where: { tugasId } });
    if (soal.length === 0) return;
    await this.prisma.tugasSoal.createMany({
      data: soal.map((s, i) => ({
        tugasId,
        urutan: i,
        pertanyaan: s.pertanyaan,
        pilihanA: s.pilihanA,
        pilihanB: s.pilihanB,
        pilihanC: s.pilihanC,
        pilihanD: s.pilihanD,
        jawabanBenar: s.jawabanBenar,
      })),
    });
  }

  async findAll(actor: Actor) {
    if (actor.role === 'SISWA') {
      const kelasId = await this.siswaKelasId(actor.id);
      const siswa = await this.prisma.siswa.findUnique({ where: { userId: actor.id }, select: { id: true } });
      const list = await this.prisma.tugas.findMany({
        where: kelasId ? { OR: [{ kelasId: null }, { kelasId }] } : { kelasId: null },
        orderBy: [{ deadline: 'asc' }],
        include: {
          kelas: INCLUDE_KELAS,
          createdBy: INCLUDE_CREATED_BY,
          submisi: siswa ? { where: { siswaId: siswa.id }, include: { jawaban: { include: { soal: true } } } } : false,
          soal: {
            ...SOAL_ORDER,
            select: { id: true, urutan: true, pertanyaan: true, pilihanA: true, pilihanB: true, pilihanC: true, pilihanD: true },
          },
          _count: { select: { submisi: true } },
        },
      });
      return list;
    }
    return this.prisma.tugas.findMany({
      orderBy: [{ deadline: 'asc' }],
      include: {
        kelas: INCLUDE_KELAS,
        createdBy: INCLUDE_CREATED_BY,
        soal: SOAL_ORDER,
        _count: { select: { submisi: true } },
      },
    });
  }

  async findOne(id: string, actor: Actor) {
    const tugas = await this.prisma.tugas.findUnique({
      where: { id },
      include: { kelas: INCLUDE_KELAS, createdBy: INCLUDE_CREATED_BY, soal: SOAL_ORDER },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');

    if (actor.role === 'SISWA' && tugas.kelasId) {
      const kelasId = await this.siswaKelasId(actor.id);
      if (kelasId !== tugas.kelasId) throw new ForbiddenException('Tugas ini bukan untuk kelasmu');
    }
    if (actor.role === 'SISWA') {
      return { ...tugas, soal: tugas.soal.map(({ jawabanBenar: _jawabanBenar, ...rest }) => rest) };
    }
    return tugas;
  }

  async create(dto: CreateTugasDto, fileUrl: string | undefined, fileName: string | undefined, actorId: string) {
    const tipe = dto.tipe || 'SUBMIT';
    const tugas = await this.prisma.tugas.create({
      data: {
        mapel: dto.mapel,
        kelasId: dto.kelasId || null,
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        deadline: new Date(dto.deadline),
        tipe,
        fileUrl,
        fileName,
        starterHtml: dto.starterHtml,
        starterCss: dto.starterCss,
        starterJs: dto.starterJs,
        createdById: actorId,
      },
    });
    await this.replaceSoal(tugas.id, tipe, dto.soal);
    await this.notifySiswaBaru(tugas.kelasId, 'Tugas baru', `${dto.mapel} — ${dto.judul}`);
    return this.prisma.tugas.findUnique({
      where: { id: tugas.id },
      include: { kelas: INCLUDE_KELAS, createdBy: INCLUDE_CREATED_BY, soal: SOAL_ORDER },
    });
  }

  async update(id: string, dto: UpdateTugasDto, fileUrl?: string, fileName?: string) {
    const existing = await this.prisma.tugas.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tugas tidak ditemukan');

    const tugas = await this.prisma.tugas.update({
      where: { id },
      data: {
        ...(dto.mapel !== undefined ? { mapel: dto.mapel } : {}),
        ...(dto.kelasId !== undefined ? { kelasId: dto.kelasId || null } : {}),
        ...(dto.judul !== undefined ? { judul: dto.judul } : {}),
        ...(dto.deskripsi !== undefined ? { deskripsi: dto.deskripsi } : {}),
        ...(dto.deadline !== undefined ? { deadline: new Date(dto.deadline) } : {}),
        ...(dto.tipe !== undefined ? { tipe: dto.tipe } : {}),
        ...(dto.starterHtml !== undefined ? { starterHtml: dto.starterHtml } : {}),
        ...(dto.starterCss !== undefined ? { starterCss: dto.starterCss } : {}),
        ...(dto.starterJs !== undefined ? { starterJs: dto.starterJs } : {}),
        ...(fileUrl ? { fileUrl, fileName } : {}),
      },
    });
    if (dto.soal !== undefined) {
      await this.replaceSoal(tugas.id, dto.tipe ?? existing.tipe, dto.soal);
    }
    return this.prisma.tugas.findUnique({
      where: { id: tugas.id },
      include: { kelas: INCLUDE_KELAS, createdBy: INCLUDE_CREATED_BY, soal: SOAL_ORDER },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.tugas.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tugas tidak ditemukan');
    return this.prisma.tugas.delete({ where: { id } });
  }

  async findBelumMengumpulkan(id: string) {
    const tugas = await this.prisma.tugas.findUnique({ where: { id } });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');

    const [target, submisi] = await Promise.all([
      this.prisma.siswa.findMany({
        where: tugas.kelasId ? { kelasId: tugas.kelasId } : {},
        select: {
          id: true,
          nama: true,
          kelas: { select: { id: true, nama: true } },
          user: { select: { id: true, nama: true } },
        },
        orderBy: [{ kelas: { nama: 'asc' } }, { nama: 'asc' }],
      }),
      this.prisma.tugasSubmisi.findMany({ where: { tugasId: id }, select: { siswaId: true } }),
    ]);
    const sudahMengumpulkan = new Set(submisi.map((s) => s.siswaId));
    return target.filter((s) => !sudahMengumpulkan.has(s.id));
  }

  findAllSubmisi() {
    return this.prisma.tugasSubmisi.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        tugas: { select: { id: true, judul: true, tipe: true, mapel: true } },
        siswa: { include: { user: { select: { id: true, nama: true } } } },
        jawaban: { include: { soal: true } },
      },
    });
  }

  async findMySubmisi(userId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) return [];
    return this.prisma.tugasSubmisi.findMany({
      where: { siswaId: siswa.id },
      orderBy: { submittedAt: 'desc' },
      include: {
        tugas: { select: { id: true, judul: true } },
        jawaban: { include: { soal: true } },
      },
    });
  }

  async submitTugas(userId: string, dto: SubmitTugasDto, fileUrl: string | undefined, fileName: string | undefined) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const tugas = await this.prisma.tugas.findUnique({ where: { id: dto.tugasId } });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');

    const isPraktik = tugas.tipe === 'PRAKTIK';
    const isSoalBased = NEEDS_SOAL.has(tugas.tipe);
    if (!isPraktik && !isSoalBased && !fileUrl) throw new BadRequestException('File jawaban wajib diunggah');

    const data = isPraktik
      ? {
          submittedHtml: dto.submittedHtml ?? '',
          submittedCss: dto.submittedCss ?? '',
          submittedJs: dto.submittedJs ?? '',
          fileUrl: null,
          fileName: null,
        }
      : isSoalBased
      ? { fileUrl: null, fileName: null, submittedHtml: null, submittedCss: null, submittedJs: null }
      : { fileUrl, fileName, submittedHtml: null, submittedCss: null, submittedJs: null };

    const submisi = await this.prisma.tugasSubmisi.upsert({
      where: { tugasId_siswaId: { tugasId: dto.tugasId, siswaId: siswa.id } },
      create: { tugasId: dto.tugasId, siswaId: siswa.id, catatan: dto.catatan, ...data },
      update: { catatan: dto.catatan, status: 'TERKIRIM', pesanRevisi: null, updatedAt: new Date(), ...data },
    });

    if (isSoalBased) {
      const jawaban = parseJsonArray<JawabanInput>(dto.jawaban, 'jawaban');
      await this.prisma.tugasJawaban.deleteMany({ where: { submisiId: submisi.id } });
      if (jawaban.length > 0) {
        await this.prisma.tugasJawaban.createMany({
          data: jawaban
            .filter((j) => j.soalId)
            .map((j) => ({
              submisiId: submisi.id,
              soalId: j.soalId,
              jawabanPilihan: j.jawabanPilihan,
              jawabanEssay: j.jawabanEssay,
            })),
        });
      }

      // Pilihan ganda dinilai otomatis 0-100 (dibulatkan, tidak pernah koma) —
      // tipe soal-based lain (ESSAY) tetap butuh penilaian manual guru lewat
      // kunci jawaban, jadi nilai-nya dibiarkan null.
      if (tugas.tipe === 'PILIHAN_GANDA') {
        const soalList = await this.prisma.tugasSoal.findMany({
          where: { tugasId: tugas.id },
          select: { id: true, jawabanBenar: true },
        });
        const totalSoal = soalList.length;
        const jumlahBenar = soalList.filter((s) => {
          const j = jawaban.find((x) => x.soalId === s.id);
          return !!s.jawabanBenar && j?.jawabanPilihan === s.jawabanBenar;
        }).length;
        const nilai = totalSoal > 0 ? Math.round((jumlahBenar / totalSoal) * 100) : 0;
        await this.prisma.tugasSubmisi.update({ where: { id: submisi.id }, data: { nilai } });
      }
    }

    await this.notificationService.create({
      userId: tugas.createdById,
      title: 'Tugas dikumpulkan',
      message: `${siswa.nama ?? 'Siswa'} mengumpulkan tugas "${tugas.judul}"`,
      type: NotificationType.TUGAS,
      link: '/materi?tab=tugas',
    });

    return this.prisma.tugasSubmisi.findUnique({
      where: { id: submisi.id },
      include: { tugas: { select: { id: true, judul: true } }, jawaban: { include: { soal: true } } },
    });
  }

  async updateStatusSubmisi(id: string, status: 'TERKIRIM' | 'DITERIMA' | 'REVISI', pesanRevisi?: string) {
    const submisi = await this.prisma.tugasSubmisi.findUnique({
      where: { id },
      include: { siswa: { select: { userId: true } }, tugas: { select: { judul: true } } },
    });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    const updated = await this.prisma.tugasSubmisi.update({
      where: { id },
      data: {
        status,
        pesanRevisi: status === 'REVISI' ? (pesanRevisi ?? null) : null,
      },
    });
    if (submisi.siswa.userId) {
      await this.notificationService.create({
        userId: submisi.siswa.userId,
        title: status === 'DITERIMA' ? 'Tugas diterima!' : 'Tugas perlu direvisi',
        message: `Tugas "${submisi.tugas.judul}" ${status === 'DITERIMA' ? 'telah diterima' : 'perlu kamu perbaiki dan kirim ulang'}`,
        type: NotificationType.TUGAS,
        link: '/materi?tab=tugas',
      });
    }
    return updated;
  }

  // Nilai manual (0-100, integer) untuk tugas essay — guru mengisi ini setelah
  // membaca jawaban siswa dan membandingkan dengan kunci jawaban. Pilihan ganda
  // tidak pernah lewat sini karena sudah dinilai otomatis saat submit.
  async updateNilaiSubmisi(id: string, nilai: number) {
    const submisi = await this.prisma.tugasSubmisi.findUnique({
      where: { id },
      include: { siswa: { select: { userId: true } }, tugas: { select: { judul: true } } },
    });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    // Memberi nilai = selesai menilai — otomatis DITERIMA, tidak perlu klik
    // tombol Terima terpisah lagi.
    const updated = await this.prisma.tugasSubmisi.update({
      where: { id },
      data: { nilai, status: 'DITERIMA', pesanRevisi: null },
    });
    if (submisi.siswa.userId) {
      await this.notificationService.create({
        userId: submisi.siswa.userId,
        title: 'Tugas dinilai',
        message: `Nilai kamu untuk tugas "${submisi.tugas.judul}" adalah ${nilai}`,
        type: NotificationType.TUGAS,
        link: '/materi?tab=tugas',
      });
    }
    return updated;
  }
}
