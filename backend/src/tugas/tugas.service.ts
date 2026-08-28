import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../generated/prisma/client';
import { CreateTugasDto } from './dto/create-tugas.dto';
import { UpdateTugasDto } from './dto/update-tugas.dto';
import { SubmitTugasDto } from './dto/submit-tugas.dto';
import { SubmitPercobaanDto } from './dto/percobaan-tugas.dto';

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

const INCLUDE_KELAS_LIST = { select: { id: true, nama: true }, orderBy: { nama: 'asc' as const } };
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
const LOCKDOWN_TIPE = new Set(['PRAKTIK', 'PILIHAN_GANDA', 'ESSAY']);
const MAKSIMAL_PERCOBAAN = 2;

// Durasi wajib diisi (menit, bilangan bulat positif) untuk PILIHAN_GANDA/
// ESSAY karena timer berjalan di lembar pengerjaan; opsional untuk PRAKTIK
// (lockdown tetap aktif tanpa timer bila tidak diisi); diabaikan untuk SUBMIT.
function parseDurasiMenit(tipe: string, raw: string | undefined): number | null {
  if (!NEEDS_SOAL.has(tipe) && tipe !== 'PRAKTIK') return null;
  if (raw === undefined || raw === '') {
    if (NEEDS_SOAL.has(tipe)) throw new BadRequestException('Durasi pengerjaan wajib diisi untuk tugas Pilihan Ganda/Essay');
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new BadRequestException('Durasi pengerjaan harus berupa bilangan menit positif');
  return n;
}

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

  // kelasIds kosong ([]) berarti tugas ini untuk "Semua Kelas" — notifikasi
  // dikirim ke seluruh siswa, bukan hanya kelas tertentu.
  private async notifySiswaBaru(kelasIds: string[], title: string, message: string) {
    const siswaUsers = await this.prisma.siswa.findMany({
      where: { userId: { not: null }, ...(kelasIds.length ? { kelasId: { in: kelasIds } } : {}) },
      select: { userId: true },
    });
    await this.notificationService.createMany(
      siswaUsers.map((s) => s.userId!),
      { title, message, type: NotificationType.TUGAS, link: '/materi?tab=tugas' },
    );
  }

  // Guru hanya boleh membuat/mengubah Tugas untuk mapel yang benar-benar ia
  // ampu (sumber: GuruMapel, diimpor dari mapel.xlsx) — ADMIN tidak dibatasi.
  private async assertGuruMapel(actor: Actor, mapel: string) {
    if (actor.role !== 'GURU') return;
    const guru = await this.prisma.guru.findUnique({ where: { userId: actor.id } });
    const allowed = guru
      ? await this.prisma.guruMapel.findMany({ where: { guruId: guru.id }, select: { nama: true } })
      : [];
    if (!allowed.some((a) => a.nama === mapel)) {
      throw new ForbiddenException('Anda tidak terdaftar sebagai pengampu mata pelajaran ini');
    }
  }

  private assertOwnerOrAdmin(actor: Actor, createdById: string) {
    if (actor.role === 'GURU' && createdById !== actor.id) {
      throw new ForbiddenException('Anda hanya bisa mengubah tugas buatan sendiri');
    }
  }

  // Update di tempat berdasarkan posisi (urutan), BUKAN delete-semua-lalu-
  // buat-ulang. TugasJawaban.soalId punya onDelete: Cascade ke TugasSoal —
  // delete+recreate berarti id soal lama hilang, jadi setiap guru edit tugas
  // (walau cuma benerin typo satu soal) diam-diam menghapus permanen jawaban
  // SEMUA siswa yang sudah submit untuk tugas itu, dan submisi yang sedang
  // "in-flight" (sudah buka lembar pengerjaan sebelum edit ini) akan gagal
  // submit dengan foreign key error karena soalId yang dikirim sudah tidak
  // ada. Dengan update di tempat, id soal yang masih ada tetap sama →
  // jawaban lama & submisi yang sedang berjalan tidak ikut rusak. Soal baru
  // (kalau nambah) ditambahkan di akhir; soal yang dihapus (kalau
  // mengurangi) baru di-cascade di baris paling akhir.
  private async replaceSoal(tugasId: string, tipe: string, soalJson: string | undefined) {
    if (!NEEDS_SOAL.has(tipe)) return;
    const soal = parseJsonArray<SoalInput>(soalJson, 'soal');
    const existing = await this.prisma.tugasSoal.findMany({ where: { tugasId }, orderBy: { urutan: 'asc' } });

    const updateCount = Math.min(existing.length, soal.length);
    for (let i = 0; i < updateCount; i++) {
      const s = soal[i];
      await this.prisma.tugasSoal.update({
        where: { id: existing[i].id },
        data: {
          urutan: i,
          pertanyaan: s.pertanyaan,
          pilihanA: s.pilihanA,
          pilihanB: s.pilihanB,
          pilihanC: s.pilihanC,
          pilihanD: s.pilihanD,
          jawabanBenar: s.jawabanBenar,
        },
      });
    }

    if (soal.length > existing.length) {
      await this.prisma.tugasSoal.createMany({
        data: soal.slice(existing.length).map((s, i) => ({
          tugasId,
          urutan: existing.length + i,
          pertanyaan: s.pertanyaan,
          pilihanA: s.pilihanA,
          pilihanB: s.pilihanB,
          pilihanC: s.pilihanC,
          pilihanD: s.pilihanD,
          jawabanBenar: s.jawabanBenar,
        })),
      });
    } else if (existing.length > soal.length) {
      await this.prisma.tugasSoal.deleteMany({
        where: { id: { in: existing.slice(soal.length).map((s) => s.id) } },
      });
    }
  }

  // Dipakai oleh submitTugas & submitPercobaan — disatukan supaya perbaikan
  // di sini otomatis berlaku untuk keduanya. Query ulang soal yang BENAR-
  // BENAR masih ada sekarang & saring jawaban ke soalId yang valid saja:
  // kalau guru mengedit tugas ini persis di antara siswa membuka lembar
  // pengerjaan dan submit, soalId yang dikirim klien bisa merujuk ke
  // TugasSoal yang sudah tidak ada lagi — tanpa penyaringan ini,
  // createMany gagal foreign key dan submisi siswa nyangkut TERKIRIM tanpa
  // nilai (lihat replaceSoal untuk perbaikan akar masalahnya).
  private async simpanJawabanSoal(tugasId: string, submisiId: string, tipe: string, jawabanJson: string | undefined) {
    const jawaban = parseJsonArray<JawabanInput>(jawabanJson, 'jawaban');
    const soalList = await this.prisma.tugasSoal.findMany({
      where: { tugasId },
      select: { id: true, jawabanBenar: true },
    });
    const soalIds = new Set(soalList.map((s) => s.id));
    const jawabanValid = jawaban.filter((j) => j.soalId && soalIds.has(j.soalId));

    await this.prisma.tugasJawaban.deleteMany({ where: { submisiId } });
    if (jawabanValid.length > 0) {
      await this.prisma.tugasJawaban.createMany({
        data: jawabanValid.map((j) => ({
          submisiId,
          soalId: j.soalId,
          jawabanPilihan: j.jawabanPilihan,
          jawabanEssay: j.jawabanEssay,
        })),
      });
    }

    // Pilihan ganda dinilai otomatis 0-100 (dibulatkan, tidak pernah koma) —
    // tipe soal-based lain (ESSAY) tetap butuh penilaian manual guru lewat
    // kunci jawaban, jadi nilai-nya dibiarkan null.
    if (tipe === 'PILIHAN_GANDA') {
      const totalSoal = soalList.length;
      const jumlahBenar = soalList.filter((s) => {
        const j = jawabanValid.find((x) => x.soalId === s.id);
        return !!s.jawabanBenar && j?.jawabanPilihan === s.jawabanBenar;
      }).length;
      const nilai = totalSoal > 0 ? Math.round((jumlahBenar / totalSoal) * 100) : 0;
      await this.prisma.tugasSubmisi.update({ where: { id: submisiId }, data: { nilai } });
    }
  }

  async findAll(actor: Actor) {
    if (actor.role === 'SISWA') {
      const kelasId = await this.siswaKelasId(actor.id);
      const siswa = await this.prisma.siswa.findUnique({ where: { userId: actor.id }, select: { id: true } });
      const list = await this.prisma.tugas.findMany({
        where: {
          OR: [
            { kelasList: { none: {} } },
            ...(kelasId ? [{ kelasList: { some: { id: kelasId } } }] : []),
          ],
        },
        orderBy: [{ deadline: 'asc' }],
        include: {
          kelasList: INCLUDE_KELAS_LIST,
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
    // Guru hanya melihat tugas buatan sendiri — meski kelasnya sama, tugas
    // guru lain tidak boleh terlihat. ADMIN tetap melihat semua.
    return this.prisma.tugas.findMany({
      where: actor.role === 'GURU' ? { createdById: actor.id } : undefined,
      orderBy: [{ deadline: 'asc' }],
      include: {
        kelasList: INCLUDE_KELAS_LIST,
        createdBy: INCLUDE_CREATED_BY,
        soal: SOAL_ORDER,
        _count: { select: { submisi: true } },
      },
    });
  }

  async findOne(id: string, actor: Actor) {
    const tugas = await this.prisma.tugas.findUnique({
      where: { id },
      include: { kelasList: INCLUDE_KELAS_LIST, createdBy: INCLUDE_CREATED_BY, soal: SOAL_ORDER },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');

    if (actor.role === 'GURU' && tugas.createdById !== actor.id) {
      throw new ForbiddenException('Tugas ini bukan buatan Anda');
    }
    if (actor.role === 'SISWA' && tugas.kelasList.length > 0) {
      const kelasId = await this.siswaKelasId(actor.id);
      if (!kelasId || !tugas.kelasList.some((k) => k.id === kelasId)) {
        throw new ForbiddenException('Tugas ini bukan untuk kelasmu');
      }
    }
    if (actor.role === 'SISWA') {
      const siswa = await this.prisma.siswa.findUnique({ where: { userId: actor.id }, select: { id: true } });
      const submisi = siswa
        ? await this.prisma.tugasSubmisi.findMany({
            where: { tugasId: id, siswaId: siswa.id },
            include: { jawaban: { include: { soal: true } } },
          })
        : [];
      return { ...tugas, submisi, soal: tugas.soal.map(({ jawabanBenar: _jawabanBenar, ...rest }) => rest) };
    }
    return tugas;
  }

  async create(dto: CreateTugasDto, fileUrl: string | undefined, fileName: string | undefined, actor: Actor) {
    await this.assertGuruMapel(actor, dto.mapel);
    const tipe = dto.tipe || 'SUBMIT';
    const durasiMenit = parseDurasiMenit(tipe, dto.durasiMenit);
    // dto.kelasId (tunggal) adalah fallback dari bundle frontend lama — lihat
    // catatan di CreateTugasDto.
    const kelasIds = dto.kelasIds ?? (dto.kelasId ? [dto.kelasId] : []);
    const tugas = await this.prisma.tugas.create({
      data: {
        mapel: dto.mapel,
        kelasList: kelasIds.length ? { connect: kelasIds.map((id) => ({ id })) } : undefined,
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        deadline: new Date(dto.deadline),
        tipe,
        fileUrl,
        fileName,
        starterHtml: dto.starterHtml,
        starterCss: dto.starterCss,
        starterJs: dto.starterJs,
        durasiMenit,
        createdById: actor.id,
      },
    });
    await this.replaceSoal(tugas.id, tipe, dto.soal);
    await this.notifySiswaBaru(kelasIds, 'Tugas baru', `${dto.mapel} — ${dto.judul}`);
    return this.prisma.tugas.findUnique({
      where: { id: tugas.id },
      include: { kelasList: INCLUDE_KELAS_LIST, createdBy: INCLUDE_CREATED_BY, soal: SOAL_ORDER },
    });
  }

  async update(id: string, dto: UpdateTugasDto, fileUrl: string | undefined, fileName: string | undefined, actor: Actor) {
    const existing = await this.prisma.tugas.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tugas tidak ditemukan');
    this.assertOwnerOrAdmin(actor, existing.createdById);
    if (dto.mapel !== undefined) await this.assertGuruMapel(actor, dto.mapel);

    const effectiveTipe = dto.tipe ?? existing.tipe;
    const durasiMenit = dto.durasiMenit !== undefined || dto.tipe !== undefined
      ? parseDurasiMenit(effectiveTipe, dto.durasiMenit ?? (existing.durasiMenit != null ? String(existing.durasiMenit) : undefined))
      : undefined;

    const tugas = await this.prisma.tugas.update({
      where: { id },
      data: {
        ...(dto.mapel !== undefined ? { mapel: dto.mapel } : {}),
        // dto.kelasId (tunggal) adalah fallback dari bundle frontend lama —
        // lihat catatan di UpdateTugasDto — hanya dipakai kalau kelasIds
        // (field baru) tidak dikirim sama sekali.
        ...(dto.kelasIds !== undefined
          ? { kelasList: { set: dto.kelasIds.map((id) => ({ id })) } }
          : dto.kelasId !== undefined
          ? { kelasList: { set: dto.kelasId ? [{ id: dto.kelasId }] : [] } }
          : {}),
        ...(dto.judul !== undefined ? { judul: dto.judul } : {}),
        ...(dto.deskripsi !== undefined ? { deskripsi: dto.deskripsi } : {}),
        ...(dto.deadline !== undefined ? { deadline: new Date(dto.deadline) } : {}),
        ...(dto.tipe !== undefined ? { tipe: dto.tipe } : {}),
        ...(dto.starterHtml !== undefined ? { starterHtml: dto.starterHtml } : {}),
        ...(dto.starterCss !== undefined ? { starterCss: dto.starterCss } : {}),
        ...(dto.starterJs !== undefined ? { starterJs: dto.starterJs } : {}),
        ...(durasiMenit !== undefined ? { durasiMenit } : {}),
        ...(fileUrl ? { fileUrl, fileName } : {}),
      },
    });
    if (dto.soal !== undefined) {
      await this.replaceSoal(tugas.id, dto.tipe ?? existing.tipe, dto.soal);
    }
    return this.prisma.tugas.findUnique({
      where: { id: tugas.id },
      include: { kelasList: INCLUDE_KELAS_LIST, createdBy: INCLUDE_CREATED_BY, soal: SOAL_ORDER },
    });
  }

  async remove(id: string, actor: Actor) {
    const existing = await this.prisma.tugas.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tugas tidak ditemukan');
    this.assertOwnerOrAdmin(actor, existing.createdById);
    return this.prisma.tugas.delete({ where: { id } });
  }

  async findBelumMengumpulkan(id: string, actor: Actor) {
    const tugas = await this.prisma.tugas.findUnique({ where: { id }, include: { kelasList: { select: { id: true } } } });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');
    if (actor.role === 'GURU' && tugas.createdById !== actor.id) {
      throw new ForbiddenException('Tugas ini bukan buatan Anda');
    }
    const kelasIds = tugas.kelasList.map((k) => k.id);

    const [target, submisi] = await Promise.all([
      this.prisma.siswa.findMany({
        where: kelasIds.length ? { kelasId: { in: kelasIds } } : {},
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

  // Guru hanya melihat submisi untuk tugas buatan sendiri — mencegah guru
  // lain membaca jawaban/menilai tugas yang bukan buatannya. ADMIN melihat semua.
  findAllSubmisi(actor: Actor) {
    return this.prisma.tugasSubmisi.findMany({
      where: actor.role === 'GURU' ? { tugas: { createdById: actor.id } } : undefined,
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
      await this.simpanJawabanSoal(tugas.id, submisi.id, tugas.tipe, dto.jawaban);
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

  async updateStatusSubmisi(id: string, status: 'TERKIRIM' | 'DITERIMA' | 'REVISI', actor: Actor, pesanRevisi?: string) {
    const submisi = await this.prisma.tugasSubmisi.findUnique({
      where: { id },
      include: { siswa: { select: { userId: true } }, tugas: { select: { judul: true, createdById: true } } },
    });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    this.assertOwnerOrAdmin(actor, submisi.tugas.createdById);
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
  async updateNilaiSubmisi(id: string, nilai: number, actor: Actor) {
    const submisi = await this.prisma.tugasSubmisi.findUnique({
      where: { id },
      include: { siswa: { select: { userId: true } }, tugas: { select: { judul: true, createdById: true } } },
    });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    this.assertOwnerOrAdmin(actor, submisi.tugas.createdById);
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

  // Membuka lembar pengerjaan (lockdown) — mengonsumsi 1 dari maksimal 2
  // percobaan SEKARANG (bukan saat submit), supaya membuka halaman lalu
  // langsung keluar tanpa menjawab apa pun tetap terhitung sebagai 1 upaya.
  // Jawaban/kode dari percobaan sebelumnya dibersihkan supaya siswa mulai
  // dari kosong, bukan melanjutkan percobaan yang sudah gagal/dipaksa keluar.
  async mulaiPercobaan(userId: string, tugasId: string) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const tugas = await this.prisma.tugas.findUnique({
      where: { id: tugasId },
      include: { soal: SOAL_ORDER, kelasList: { select: { id: true } } },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');
    if (!LOCKDOWN_TIPE.has(tugas.tipe)) {
      throw new BadRequestException('Tugas ini tidak menggunakan mode lembar pengerjaan');
    }
    if (tugas.kelasList.length > 0 && !tugas.kelasList.some((k) => k.id === siswa.kelasId)) {
      throw new ForbiddenException('Tugas ini bukan untuk kelasmu');
    }

    const existing = await this.prisma.tugasSubmisi.findUnique({
      where: { tugasId_siswaId: { tugasId, siswaId: siswa.id } },
    });
    if (existing?.status === 'DITERIMA') {
      throw new ForbiddenException('Tugas ini sudah diterima, tidak bisa dikerjakan lagi');
    }
    const maksimalEfektif = MAKSIMAL_PERCOBAAN + (existing?.bonusPercobaan ?? 0);
    const percobaanKe = (existing?.jumlahPercobaan ?? 0) + 1;
    if (existing?.terkunci || percobaanKe > maksimalEfektif) {
      throw new ForbiddenException(`Percobaan Anda untuk tugas ini sudah habis (maksimal ${maksimalEfektif}x). Hubungi guru untuk mengulang.`);
    }

    const now = new Date();
    const deadlineWaktu = tugas.durasiMenit ? new Date(now.getTime() + tugas.durasiMenit * 60_000) : null;

    const submisi = await this.prisma.tugasSubmisi.upsert({
      where: { tugasId_siswaId: { tugasId, siswaId: siswa.id } },
      create: {
        tugasId,
        siswaId: siswa.id,
        jumlahPercobaan: 1,
        waktuMulai: now,
        deadlineWaktu,
      },
      update: {
        jumlahPercobaan: percobaanKe,
        waktuMulai: now,
        deadlineWaktu,
        dipaksaKeluar: false,
        status: 'TERKIRIM',
        pesanRevisi: null,
        submittedHtml: null,
        submittedCss: null,
        submittedJs: null,
      },
    });
    await this.prisma.tugasJawaban.deleteMany({ where: { submisiId: submisi.id } });

    return {
      submisiId: submisi.id,
      percobaanKe,
      maksimalPercobaan: maksimalEfektif,
      waktuMulai: submisi.waktuMulai,
      deadlineWaktu: submisi.deadlineWaktu,
      tugas: {
        id: tugas.id,
        judul: tugas.judul,
        deskripsi: tugas.deskripsi,
        tipe: tugas.tipe,
        mapel: tugas.mapel,
        starterHtml: tugas.starterHtml,
        starterCss: tugas.starterCss,
        starterJs: tugas.starterJs,
        soal: tugas.soal.map(({ jawabanBenar: _jawabanBenar, ...rest }) => rest),
      },
    };
  }

  // Submit dari lembar pengerjaan — dipanggil baik saat siswa klik "Selesai"
  // (dipaksa=false) maupun otomatis saat sistem mendeteksi siswa meninggalkan
  // halaman (dipaksa=true, lihat POST /tugas/:id/paksa-keluar di controller).
  async submitPercobaan(userId: string, tugasId: string, dto: SubmitPercobaanDto) {
    const siswa = await this.prisma.siswa.findUnique({ where: { userId } });
    if (!siswa) throw new ForbiddenException('Profil siswa tidak ditemukan');
    const tugas = await this.prisma.tugas.findUnique({ where: { id: tugasId } });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');

    const submisi = await this.prisma.tugasSubmisi.findUnique({
      where: { tugasId_siswaId: { tugasId, siswaId: siswa.id } },
    });
    if (!submisi || !submisi.waktuMulai) {
      throw new BadRequestException('Anda belum memulai percobaan untuk tugas ini');
    }
    if (submisi.terkunci) {
      throw new ForbiddenException('Percobaan Anda untuk tugas ini sudah habis');
    }

    const isPraktik = tugas.tipe === 'PRAKTIK';
    const isSoalBased = NEEDS_SOAL.has(tugas.tipe);
    const terkunciBaru = submisi.jumlahPercobaan >= MAKSIMAL_PERCOBAAN + submisi.bonusPercobaan;

    const updated = await this.prisma.tugasSubmisi.update({
      where: { id: submisi.id },
      data: {
        ...(isPraktik
          ? { submittedHtml: dto.submittedHtml ?? '', submittedCss: dto.submittedCss ?? '', submittedJs: dto.submittedJs ?? '' }
          : {}),
        catatan: dto.catatan,
        status: 'TERKIRIM',
        dipaksaKeluar: !!dto.dipaksa,
        terkunci: terkunciBaru,
        waktuMulai: null,
        deadlineWaktu: null,
      },
    });

    if (isSoalBased) {
      await this.simpanJawabanSoal(tugas.id, updated.id, tugas.tipe, dto.jawaban);
    }

    await this.notificationService.create({
      userId: tugas.createdById,
      title: dto.dipaksa ? 'Tugas otomatis dikumpulkan' : 'Tugas dikumpulkan',
      message: dto.dipaksa
        ? `${siswa.nama ?? 'Siswa'} terdeteksi keluar dari lembar pengerjaan "${tugas.judul}", jawaban otomatis tersimpan`
        : `${siswa.nama ?? 'Siswa'} mengumpulkan tugas "${tugas.judul}"`,
      type: NotificationType.TUGAS,
      link: '/materi?tab=tugas',
    });

    return this.prisma.tugasSubmisi.findUnique({
      where: { id: updated.id },
      include: { tugas: { select: { id: true, judul: true } }, jawaban: { include: { soal: true } } },
    });
  }

  // Reset PENUH jatah percobaan siswa (admin/guru pengampu) — jumlahPercobaan
  // kembali ke 0 seolah belum pernah mencoba sama sekali. Dipakai untuk kasus
  // yang wajar diberi kesempatan ulang penuh dari awal.
  async resetPercobaan(id: string, actor: Actor) {
    const submisi = await this.prisma.tugasSubmisi.findUnique({ where: { id }, include: { tugas: true } });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    this.assertOwnerOrAdmin(actor, submisi.tugas.createdById);
    return this.prisma.tugasSubmisi.update({
      where: { id },
      data: { jumlahPercobaan: 0, bonusPercobaan: 0, terkunci: false, dipaksaKeluar: false, waktuMulai: null, deadlineWaktu: null },
    });
  }

  // Tambah 1x jatah percobaan TANPA menghapus riwayat percobaan sebelumnya —
  // beda dari resetPercobaan (reset penuh ke 0). Dipakai untuk kasus seperti
  // HP siswa mati 2x tanpa sengaja sampai kehabisan jatah normal: guru cukup
  // menambah 1 kesempatan lagi, bukan mengembalikan seolah belum mencoba.
  async tambahPercobaan(id: string, actor: Actor) {
    const submisi = await this.prisma.tugasSubmisi.findUnique({ where: { id }, include: { tugas: true } });
    if (!submisi) throw new NotFoundException('Submisi tidak ditemukan');
    this.assertOwnerOrAdmin(actor, submisi.tugas.createdById);
    return this.prisma.tugasSubmisi.update({
      where: { id },
      data: { bonusPercobaan: { increment: 1 }, terkunci: false },
    });
  }
}
