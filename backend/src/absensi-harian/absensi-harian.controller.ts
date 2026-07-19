import {
  Controller, Get, Post, Param, Query, Body, UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { AbsensiHarianService } from './absensi-harian.service';
import { AbsenSendiriHarianDto, UpsertAbsensiHarianDto } from './dto/absensi-harian.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { imageUploadOptions } from '../common/upload/file-filters';
import { Role } from '../../generated/prisma/client';

const absensiHarianStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'absensi-harian');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

function todayStr() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

@UseGuards(JwtAuthGuard)
@Controller('absensi-harian')
export class AbsensiHarianController {
  constructor(private readonly service: AbsensiHarianService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get()
  getAbsensi(
    @Query('tanggal') tanggal: string,
    @Query('kelasId') kelasId: string,
    @Request() req: any,
  ) {
    return this.service.getForActor(req.user.id, req.user.role, tanggal || todayStr(), kelasId || undefined);
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
  @UseInterceptors(FileInterceptor('foto', { storage: absensiHarianStorage, ...imageUploadOptions }))
  absenSendiri(
    @Body() dto: AbsenSendiriHarianDto,
    @Request() req: any,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    const fotoUrl = foto ? `/uploads/absensi-harian/${foto.filename}` : undefined;
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
  upsertAbsensi(@Body() dto: UpsertAbsensiHarianDto, @Request() req: any) {
    return this.service.upsertAbsensi(dto.kelasId, dto.tanggal, dto.absensi, req.user.id, req.user.role);
  }
}
