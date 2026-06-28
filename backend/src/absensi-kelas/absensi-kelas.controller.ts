import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { AbsensiKelasService } from './absensi-kelas.service';
import { UpsertAbsensiDto } from './dto/upsert-absensi.dto';
import { AbsenSendiriDto } from './dto/absen-sendiri.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

const absensiStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'absensi');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@UseGuards(JwtAuthGuard)
@Controller('absensi-kelas')
export class AbsensiKelasController {
  constructor(private readonly service: AbsensiKelasService) {}

  // Static 'saya' routes must be declared before dynamic ':jadwalKelasId'
  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('saya/:jadwalKelasId')
  getStatusSaya(@Param('jadwalKelasId') jadwalKelasId: string, @Request() req: any) {
    return this.service.getStatusSaya(req.user.id, jadwalKelasId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Post('saya')
  @UseInterceptors(FileInterceptor('foto', { storage: absensiStorage }))
  absenSendiri(
    @Body() dto: AbsenSendiriDto,
    @Request() req: any,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    const fotoUrl = foto ? `/uploads/absensi/${foto.filename}` : undefined;
    return this.service.absenSendiri(req.user.id, dto.jadwalKelasId, {
      lokasi: dto.lokasi,
      waktuAbsen: dto.waktuAbsen,
      ttd: dto.ttd,
      fotoUrl,
    });
  }

  @Get(':jadwalKelasId')
  get(
    @Param('jadwalKelasId') jadwalKelasId: string,
    @Query('tanggal') tanggal: string,
  ) {
    return this.service.getByJadwalAndTanggal(jadwalKelasId, tanggal);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Post()
  upsert(@Body() dto: UpsertAbsensiDto) {
    return this.service.upsert(dto);
  }
}
