import {
  Controller, Get, Post, Query, Body, UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { AbsensiMagangService } from './absensi-magang.service';
import { AbsenSendiriMagangDto, UpsertAbsensiMagangDto } from './dto/absensi-magang.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { imageUploadOptions } from '../common/upload/file-filters';
import { compressUploadedImageInPlace } from '../common/upload/compress-image.util';
import { Role } from '../../generated/prisma/client';
import { todayJakarta as todayStr } from '../common/utils/jakarta-date.util';

const absensiMagangStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'absensi-magang');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@UseGuards(JwtAuthGuard)
@Controller('magang/absensi')
export class AbsensiMagangController {
  constructor(private readonly service: AbsensiMagangService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get()
  getAbsensi(
    @Query('tanggal') tanggal: string,
    @Query('tempatMagangId') tempatMagangId: string,
    @Request() req: any,
  ) {
    return this.service.getForActor(req.user.id, req.user.role, tanggal || todayStr(), tempatMagangId || undefined);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('saya')
  getStatusSaya(@Query('tanggal') tanggal: string, @Request() req: any) {
    return this.service.getStatusSaya(req.user.id, tanggal);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Post('saya')
  @UseInterceptors(FileInterceptor('foto', { storage: absensiMagangStorage, ...imageUploadOptions }))
  async absenSendiri(
    @Body() dto: AbsenSendiriMagangDto,
    @Request() req: any,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    if (foto) await compressUploadedImageInPlace(foto.path);
    const fotoUrl = foto ? `/uploads/absensi-magang/${foto.filename}` : undefined;
    return this.service.absenSendiri(req.user.id, dto.tipe ?? 'HADIR', {
      lokasi: dto.lokasi,
      waktuAbsen: dto.waktuAbsen,
      ttd: dto.ttd,
      catatan: dto.catatan,
      fotoUrl,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Post()
  upsertAbsensi(@Body() dto: UpsertAbsensiMagangDto, @Request() req: any) {
    return this.service.upsertAbsensi(dto.tempatMagangId, dto.tanggal, dto.absensi, req.user.id, req.user.role);
  }
}
