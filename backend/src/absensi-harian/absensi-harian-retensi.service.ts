import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { jakartaParts, monthToDateRange } from '../common/utils/jakarta-date.util';

@Injectable()
export class AbsensiHarianRetensiService {
  private readonly logger = new Logger(AbsensiHarianRetensiService.name);

  constructor(private readonly prisma: PrismaService) {}

  private cutoffTanggal(): string {
    const { year, month } = jakartaParts();
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return monthToDateRange(prevMonth, prevYear).start;
  }

  @Cron('0 3 * * *', { timeZone: 'Asia/Jakarta' })
  async bersihkanAbsensiLama() {
    const cutoff = this.cutoffTanggal();
    const rows = await this.prisma.absensiHarian.findMany({
      where: { tanggal: { lt: cutoff } },
      select: { id: true, foto: true, fotoPulang: true },
    });
    if (rows.length === 0) return;

    for (const row of rows) {
      await this.hapusFileFoto(row.foto);
      await this.hapusFileFoto(row.fotoPulang);
    }

    const { count } = await this.prisma.absensiHarian.deleteMany({
      where: { tanggal: { lt: cutoff } },
    });
    this.logger.log(`Retensi absensi harian: ${count} baris (tanggal < ${cutoff}) dihapus permanen beserta foto terkait.`);
  }

  private async hapusFileFoto(url: string | null) {
    if (!url || !url.startsWith('/uploads/')) return;
    const filePath = join(process.cwd(), url.replace(/^\//, ''));
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        this.logger.warn(`Gagal hapus file foto absensi ${filePath}: ${(err as Error)?.message ?? err}`);
      }
    }
  }
}
