import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { todayJakarta as todayStr, effectiveWeekdaysInRange } from '../common/utils/jakarta-date.util';

// Ambang batas "perlu perhatian": kehadiran di bawah ini, atau tidak ada
// aktivitas absen sama sekali dalam N hari efektif terakhir.
const KEHADIRAN_MIN_PERSEN = 70;
const HARI_TANPA_AKTIVITAS_MAKS = 3;

export type MonitoringRow = {
  penempatanId: string;
  siswa: { id: string; nama: string | null; nis: string; fotoProfil: string | null };
  tempatMagang: { id: string; namaTempat: string };
  guruPembimbing: { id: string; nama: string | null };
  tanggalMulai: string;
  hariBerjalan: number;
  rekap: { HADIR: number; IZIN: number; SAKIT: number; ALPA: number };
  totalHariEfektif: number;
  persentaseKehadiran: number;
  lastAktivitas: string | null;
  hariSejakAktivitas: number | null;
  perluPerhatian: boolean;
};

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class MonitoringMagangService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonitoring(userId: string, role: string) {
    const today = todayStr();

    let guruId: string | undefined;
    if (role === 'GURU') {
      const guru = await this.prisma.guru.findUnique({ where: { userId } });
      guruId = guru?.id;
      if (!guruId) return { summary: this.emptySummary(), rows: [] };
    }

    const penempatanList = await this.prisma.penempatanMagang.findMany({
      where: { status: 'AKTIF', ...(guruId ? { guruPembimbingId: guruId } : {}) },
      include: {
        siswa: { include: { user: { select: { nama: true, fotoProfil: true } } } },
        tempatMagang: { select: { id: true, namaTempat: true } },
        guruPembimbing: { select: { id: true, user: { select: { nama: true } } } },
      },
      orderBy: { siswa: { nama: 'asc' } },
    });

    const rows: MonitoringRow[] = await Promise.all(
      penempatanList.map((p) => this.buildRow(p, today)),
    );

    return { summary: this.buildSummary(rows), rows };
  }

  private async buildRow(
    p: {
      id: string;
      tanggalMulai: Date;
      siswa: { id: string; nis: string; nama: string | null; user: { nama: string; fotoProfil: string | null } | null };
      tempatMagang: { id: string; namaTempat: string };
      guruPembimbing: { id: string; user: { nama: string } | null };
    },
    today: string,
  ): Promise<MonitoringRow> {
    const mulaiStr = fmtDate(p.tanggalMulai);
    const tanggalList = mulaiStr <= today ? effectiveWeekdaysInRange(mulaiStr, today) : [];

    const records = tanggalList.length
      ? await this.prisma.absensiMagang.findMany({
          where: { penempatanId: p.id, tanggal: { in: tanggalList } },
          orderBy: { tanggal: 'asc' },
        })
      : [];
    const recMap = new Map(records.map((r) => [r.tanggal, r]));

    const rekap = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    for (const tgl of tanggalList) {
      const status = recMap.get(tgl)?.status ?? null;
      const key = (status ?? 'ALPA') as keyof typeof rekap;
      if (key in rekap) rekap[key]++;
    }
    const totalHariEfektif = tanggalList.length;
    const persentaseKehadiran = totalHariEfektif > 0 ? Math.round((rekap.HADIR / totalHariEfektif) * 1000) / 10 : 0;

    const lastAktivitas = records.length ? records[records.length - 1].tanggal : null;
    const hariSejakAktivitas = lastAktivitas ? effectiveWeekdaysInRange(lastAktivitas, today).length - 1 : null;

    const belumPernahAbsenLama = !lastAktivitas && totalHariEfektif >= HARI_TANPA_AKTIVITAS_MAKS;
    const perluPerhatian =
      (totalHariEfektif > 0 && persentaseKehadiran < KEHADIRAN_MIN_PERSEN) ||
      (hariSejakAktivitas !== null && hariSejakAktivitas >= HARI_TANPA_AKTIVITAS_MAKS) ||
      belumPernahAbsenLama;

    return {
      penempatanId: p.id,
      siswa: {
        id: p.siswa.id,
        nama: p.siswa.user?.nama ?? p.siswa.nama,
        nis: p.siswa.nis,
        fotoProfil: p.siswa.user?.fotoProfil ?? null,
      },
      tempatMagang: p.tempatMagang,
      guruPembimbing: { id: p.guruPembimbing.id, nama: p.guruPembimbing.user?.nama ?? null },
      tanggalMulai: mulaiStr,
      hariBerjalan: totalHariEfektif,
      rekap,
      totalHariEfektif,
      persentaseKehadiran,
      lastAktivitas,
      hariSejakAktivitas,
      perluPerhatian,
    };
  }

  private emptySummary() {
    return { totalPenempatan: 0, totalTempat: 0, rataRataKehadiran: 0, perluPerhatianCount: 0 };
  }

  private buildSummary(rows: MonitoringRow[]) {
    if (rows.length === 0) return this.emptySummary();
    const totalTempat = new Set(rows.map((r) => r.tempatMagang.id)).size;
    const rataRataKehadiran = Math.round((rows.reduce((sum, r) => sum + r.persentaseKehadiran, 0) / rows.length) * 10) / 10;
    const perluPerhatianCount = rows.filter((r) => r.perluPerhatian).length;
    return { totalPenempatan: rows.length, totalTempat, rataRataKehadiran, perluPerhatianCount };
  }
}
