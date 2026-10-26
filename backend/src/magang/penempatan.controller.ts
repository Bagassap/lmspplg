import {
  BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PenempatanService } from './penempatan.service';
import { AjukanPenempatanDto, TetapkanGuruDto, TolakPenempatanDto, UpdatePenempatanDto } from './dto/create-penempatan.dto';
import { documentUploadOptions } from '../common/upload/file-filters';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

const suratStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'surat-pkl');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

// Surat keterangan boleh berupa PDF, dokumen Word, atau foto/scan surat.
const SURAT_EXT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
const suratUploadOptions = {
  fileFilter: ((_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!SURAT_EXT.includes(ext)) {
      cb(new BadRequestException('Surat keterangan harus berupa PDF, Word, atau gambar (JPG/PNG)'), false);
      return;
    }
    cb(null, true);
  }) as NonNullable<typeof documentUploadOptions.fileFilter>,
  limits: { fileSize: 10 * 1024 * 1024 },
};

@UseGuards(JwtAuthGuard)
@Controller('magang/penempatan')
export class PenempatanController {
  constructor(private readonly service: PenempatanService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('saya')
  findSaya(@Request() req: any) {
    return this.service.findSaya(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('rekan')
  cariRekan(@Request() req: any, @Query('q') q?: string) {
    return this.service.cariRekan(req.user.id, q);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Post('ajukan')
  @UseInterceptors(FileInterceptor('surat', { storage: suratStorage, ...suratUploadOptions }))
  async ajukan(@Body() body: Record<string, string>, @UploadedFile() file: Express.Multer.File | undefined, @Request() req: any) {
    if (!file) throw new BadRequestException('Bukti surat keterangan PKL wajib diunggah');
    // multipart hanya membawa string: field bersarang dikirim sebagai JSON.
    let raw: Record<string, unknown>;
    try {
      raw = {
        tempatMagangId: body.tempatMagangId || undefined,
        tempatBaru: body.tempatBaru ? JSON.parse(body.tempatBaru) : undefined,
        rekanSiswaIds: body.rekanSiswaIds ? JSON.parse(body.rekanSiswaIds) : undefined,
      };
    } catch {
      throw new BadRequestException('Data pengajuan tidak valid');
    }
    const dto = plainToInstance(AjukanPenempatanDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) throw new BadRequestException('Data pengajuan tidak lengkap');
    return this.service.ajukan(req.user.id, dto, { url: `/uploads/surat-pkl/${file.filename}`, nama: file.originalname });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.GURU)
  @Get('bimbingan')
  findBimbingan(@Request() req: any) {
    return this.service.findBimbingan(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('tempatMagangId') tempatMagangId?: string,
    @Query('kelasId') kelasId?: string,
  ) {
    return this.service.findAll({ status, tempatMagangId, kelasId });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/tetapkan-guru')
  tetapkanGuru(@Param('id') id: string, @Body() dto: TetapkanGuruDto) {
    return this.service.tetapkanGuru(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/tolak')
  tolak(@Param('id') id: string, @Body() dto: TolakPenempatanDto) {
    return this.service.tolak(id, dto.alasan);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePenempatanDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
