import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, Request, Res, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { tmpdir } from 'os';
import { pipeline } from 'stream/promises';
import * as fs from 'fs';
import type { Response } from 'express';
import archiver from 'archiver';
import { UjianUkkService } from './ujian-ukk.service';
import { jenisArsip, daftarArsip, bacaEntri, jenisTayang, ekstrakArsip } from './arsip.util';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { UjianUkkExcelService } from './ujian-ukk-excel.service';
import { CreateTahapanDto } from './dto/create-tahapan.dto';
import { CreateSoalDto } from './dto/create-soal.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { CreateDiskusiDto } from './dto/create-diskusi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { documentUploadOptions } from '../common/upload/file-filters';
import { Role } from '../../generated/prisma/client';

const soalStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'ukk-soal');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

const submitStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'ukk-submisi');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@UseGuards(JwtAuthGuard)
@Controller('ujian-ukk')
export class UjianUkkController {
  constructor(
    private readonly service: UjianUkkService,
    private readonly excelService: UjianUkkExcelService,
    private readonly drive: GoogleDriveService,
  ) {}

  @Get('tahapan')
  findAllTahapan() { return this.service.findAllTahapan(); }

  @Get('tahapan/saya')
  findTahapanSaya(@Request() req: any) { return this.service.findTahapanSaya(req.user.sub); }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('tahapan')
  createTahapan(@Body() dto: CreateTahapanDto) { return this.service.createTahapan(dto); }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('tahapan/:id')
  updateTahapan(@Param('id') id: string, @Body() dto: Partial<CreateTahapanDto>) {
    return this.service.updateTahapan(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('tahapan/:id')
  deleteTahapan(@Param('id') id: string) { return this.service.deleteTahapan(id); }

  @Get('soal')
  findAllSoal() { return this.service.findAllSoal(); }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Post('soal')
  @UseInterceptors(FileInterceptor('file', { storage: soalStorage, ...documentUploadOptions }))
  createSoal(@Body() dto: CreateSoalDto, @UploadedFile() file: Express.Multer.File) {
    const fileUrl  = `/uploads/ukk-soal/${file.filename}`;
    const fileName = file.originalname;
    return this.service.createSoal(dto, fileUrl, fileName);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Delete('soal/:id')
  deleteSoal(@Param('id') id: string) { return this.service.deleteSoal(id); }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('submisi')
  findAllSubmisi() { return this.service.findAllSubmisi(); }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('submisi/saya')
  findMySubmisi(@Request() req: any) { return this.service.findMySubmisi(req.user.id); }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Post('submisi')
  @UseInterceptors(FileInterceptor('file', { storage: submitStorage, ...documentUploadOptions }))
  submitProject(
    @Request() req: any,
    @Body() dto: SubmitProjectDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileUrl  = file ? `/uploads/ukk-submisi/${file.filename}` : (dto.driveUrl ?? '').trim();
    const fileName = file ? file.originalname : 'Google Drive';

    if (!file) {
      if (!fileUrl) throw new BadRequestException('Link Google Drive wajib diisi');
      if (!/^https:\/\/(drive|docs)\.google\.com\//.test(fileUrl)) {
        throw new BadRequestException('Link harus dari Google Drive (drive.google.com atau docs.google.com)');
      }
    }

    return this.service.submitProject(req.user.id, dto, fileUrl, fileName, file?.path);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('peserta-xii')
  pesertaKelasXII() { return this.service.pesertaKelasXII(); }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('submisi/unduh-semua')
  async unduhSemua(
    @Query('tahapanId') tahapanId: string | undefined,
    @Query('kelasId') kelasId: string | undefined,
    @Res() res: Response,
  ) {
    const rows = await this.service.submisiUntukZip({ tahapanId: tahapanId || undefined, kelasId: kelasId || undefined });
    const bersih = (s: string) => s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'tanpa-nama';
    const judul = rows[0]?.tahapan?.judul && tahapanId ? bersih(rows[0].tahapan.judul) : 'Semua Task';
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="Asset UKK - ${judul}.zip"`,
    });
    const arsip = archiver('zip', { zlib: { level: 5 } });
    const sementara = fs.mkdtempSync(join(tmpdir(), 'lms-ukk-zip-'));
    let putus = false;
    let batal = () => {};
    const hentikan = () => { putus = true; batal(); };
    res.on('close', hentikan);
    arsip.on('error', () => { hentikan(); res.end(); });
    arsip.pipe(res);

    const tunggu = () => new Promise<void>((ok, gagal) => {
      if (putus) return gagal(new Error('Unduhan dibatalkan'));
      const selesai = () => { batal = () => {}; ok(); };
      arsip.once('entry', selesai);
      batal = () => { arsip.off('entry', selesai); gagal(new Error('Unduhan dibatalkan')); };
    });
    let urut = 0;
    const masuk = async (data: string | Buffer | NodeJS.ReadableStream, name: string) => {
      if (putus) {
        if (typeof data === 'object' && 'destroy' in data && typeof data.destroy === 'function') data.destroy();
        throw new Error('Unduhan dibatalkan');
      }
      if (typeof data === 'string' || Buffer.isBuffer(data)) {
        const t = tunggu();
        arsip.append(data, { name });
        return t;
      }
      const tmp = join(sementara, String(urut++));
      try {
        await pipeline(data, fs.createWriteStream(tmp));
        const t = tunggu();
        arsip.file(tmp, { name });
        await t;
      } finally {
        await fs.promises.unlink(tmp).catch(() => undefined);
      }
    };
    const berkas = (path: string, name: string) => masuk(fs.createReadStream(path), name);

    try {
      const dipakai = new Set<string>();
      const tautan: string[] = [];
      for (const r of rows) {
        if (putus) break;
        const kelas = bersih(r.siswa?.kelas?.nama ?? 'Tanpa Kelas');
        const nama = bersih(r.siswa?.nama ?? 'Siswa');
        const task = bersih(r.tahapan?.judul ?? 'Task');
        let folder = `${kelas}/${nama} - ${task}`;
        for (let i = 2; dipakai.has(folder); i++) folder = `${kelas}/${nama} - ${task} (${i})`;
        dipakai.add(folder);
        if (r.fileUrl.startsWith('/uploads/')) {
          const path = join(process.cwd(), r.fileUrl);
          if (!fs.existsSync(path)) {
            tautan.push(`${kelas} | ${nama} | berkas tidak ditemukan di server`);
            await masuk('Berkas tidak ditemukan di server', `${folder}/Berkas tidak ditemukan.txt`);
            continue;
          }
          const ext = extname(r.fileName || r.fileUrl);
          const jenis = jenisArsip(r.fileName || r.fileUrl);
          let terekstrak = 0;
          if (jenis) {
            try {
              terekstrak = await ekstrakArsip(path, jenis, (e) => masuk(e.data, `${folder}/${e.path}`));
            } catch {
              terekstrak = 0;
            }
          }
          if (putus) break;
          if (!terekstrak) {
            await berkas(path, `${folder}/${bersih(r.fileName || `berkas${ext}`)}`);
            if (jenis) tautan.push(`${kelas} | ${nama} | ${task} | arsip tidak bisa dibuka, disertakan apa adanya`);
          }
        } else {
          tautan.push(`${kelas} | ${nama} | ${task} | ${r.fileUrl}`);
          let terunduh = 0;
          try {
            terunduh = await this.drive.unduhDariLink(
              r.fileUrl,
              (e) => masuk(e.data, `${folder}/${e.path}`),
              (pesan) => { tautan.push(`${kelas} | ${nama} | ${task} | gagal unduh ${pesan}`); },
            );
          } catch (e: any) {
            tautan.push(`${kelas} | ${nama} | ${task} | gagal unduh dari Drive (${e.message})`);
          }
          if (putus) break;
          if (!terunduh) {
            await masuk(`[InternetShortcut]\r\nURL=${r.fileUrl}\r\n`, `${folder}/Link Google Drive.url`);
            await masuk(r.fileUrl, `${folder}/Link Google Drive.txt`);
          }
        }
      }
      if (!putus) {
        if (tautan.length) await masuk(tautan.join('\n'), 'Link Google Drive & catatan.txt');
        await arsip.finalize();
      }
    } catch {
      if (!putus) arsip.abort();
    } finally {
      res.off('close', hentikan);
      fs.rmSync(sementara, { recursive: true, force: true });
      if (putus) arsip.abort();
    }
  }

  private async arsipSubmisi(id: string) {
    const row = await this.service.findSubmisiById(id);
    const jenis = jenisArsip(row.fileName || row.fileUrl);
    if (!row.fileUrl.startsWith('/uploads/') || !jenis) throw new BadRequestException('Pengumpulan ini bukan arsip ZIP/RAR yang diunggah');
    const abs = join(process.cwd(), row.fileUrl);
    if (!fs.existsSync(abs)) throw new BadRequestException('Berkas tidak ditemukan di server');
    return { abs, jenis, nama: row.fileName };
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('submisi/:id/isi')
  async isiArsip(@Param('id') id: string) {
    const { abs, jenis, nama } = await this.arsipSubmisi(id);
    return { nama, jenis, entri: (await daftarArsip(abs, jenis)).sort((a, b) => a.path.localeCompare(b.path)) };
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('submisi/:id/isi/berkas')
  async berkasArsip(@Param('id') id: string, @Query('path') path: string, @Res() res: Response) {
    if (!path) throw new BadRequestException('path wajib diisi');
    const { abs, jenis } = await this.arsipSubmisi(id);
    const tayang = jenisTayang(path);
    if (!tayang) throw new BadRequestException('Jenis berkas ini tidak bisa dilihat langsung');
    const data = await bacaEntri(abs, jenis, path);
    res.set({
      'Content-Type': tayang.tipe,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
      'Cache-Control': 'no-store',
      'Content-Length': data.length,
    });
    res.send(data);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('submisi/export-excel')
  async exportSubmisiExcel(@Res() res: Response) {
    const groups = await this.service.getSubmisiForExport();
    const buffer = await this.excelService.build(groups);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Rekap_Submisi_UKK.xlsx"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Put('submisi/:id/penilaian')
  nilaiSubmisi(@Request() req: any, @Param('id') id: string, @Body('skor') skor: Record<string, unknown>, @Body('pesanRevisi') pesanRevisi?: string) {
    return this.service.nilaiSubmisi(id, req.user.id, skor, pesanRevisi);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Put('submisi/:id/revisi-selesai')
  selesaikanRevisi(@Request() req: any, @Param('id') id: string) {
    return this.service.selesaikanRevisi(req.user.id, id);
  }

  @Get('diskusi')
  findAllDiskusi() { return this.service.findAllDiskusi(); }

  @Post('diskusi')
  createDiskusi(@Request() req: any, @Body() dto: CreateDiskusiDto) {
    return this.service.createDiskusi(req.user.id, dto);
  }

  @Delete('diskusi/:id')
  deleteDiskusi(@Request() req: any, @Param('id') id: string) {
    return this.service.deleteDiskusi(id, req.user.id, req.user.role);
  }
}
