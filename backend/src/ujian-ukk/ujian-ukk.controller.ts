import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { UjianUkkService } from './ujian-ukk.service';
import { CreateTahapanDto } from './dto/create-tahapan.dto';
import { CreateSoalDto } from './dto/create-soal.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { CreateDiskusiDto } from './dto/create-diskusi.dto';
import { AbsenSendiriUkkDto, UpsertAbsensiUkkDto } from './dto/absensi-ukk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { imageUploadOptions, documentUploadOptions } from '../common/upload/file-filters';
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
  constructor(private readonly service: UjianUkkService) {}

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
    const fileUrl  = file ? `/uploads/ukk-submisi/${file.filename}` : (dto.driveUrl ?? '');
    const fileName = file ? file.originalname : 'Google Drive';
    return this.service.submitProject(req.user.id, dto, fileUrl, fileName);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Put('submisi/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: 'TERKIRIM' | 'DITERIMA' | 'REVISI', @Body('pesanRevisi') pesanRevisi?: string) {
    return this.service.updateStatusSubmisi(id, status, pesanRevisi);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('absensi')
  getAbsensi(@Query('tahapanId') tahapanId: string, @Query('tanggal') tanggal: string) {
    if (tahapanId) return this.service.getAbsensiByTahapan(tahapanId, tanggal);
    return this.service.getAllAbsensi(tanggal);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('absensi/saya/:tahapanId')
  getAbsensiSaya(@Param('tahapanId') tahapanId: string, @Request() req: any) {
    return this.service.getStatusAbsensiSaya(req.user.sub, tahapanId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Post('absensi/saya')
  @UseInterceptors(FileInterceptor('foto', { storage: diskStorage({
    destination: (_req: any, _file: any, cb: any) => { const dir = require('path').join(process.cwd(), 'uploads', 'absensi-ukk'); require('fs').mkdirSync(dir, { recursive: true }); cb(null, dir); },
    filename: (_req: any, file: any, cb: any) => { cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + require('path').extname(file.originalname)); },
  }), ...imageUploadOptions }))
  absenSendiriUkk(@Body() dto: AbsenSendiriUkkDto, @Request() req: any, @UploadedFile() foto?: Express.Multer.File) {
    const fotoUrl = foto ? `/uploads/absensi-ukk/${foto.filename}` : undefined;
    return this.service.absenSendiriUkk(req.user.sub, dto.tahapanId, {
      lokasi: dto.lokasi, waktuAbsen: dto.waktuAbsen, ttd: dto.ttd, catatan: dto.catatan, fotoUrl,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Post('absensi')
  upsertAbsensi(@Body() dto: UpsertAbsensiUkkDto) {
    return this.service.upsertAbsensiUkk(dto.tahapanId, dto.tanggal, dto.absensi);
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
