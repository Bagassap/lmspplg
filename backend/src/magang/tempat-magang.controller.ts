import { Body, Controller, Delete, Get, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SuratPermohonanService } from './surat-permohonan.service';
import { TempatMagangService } from './tempat-magang.service';
import { CreateTempatMagangDto } from './dto/create-tempat-magang.dto';
import { UpdateTempatMagangDto } from './dto/update-tempat-magang.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('magang/tempat')
export class TempatMagangController {
  constructor(
    private readonly service: TempatMagangService,
    private readonly surat: SuratPermohonanService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id/surat-permohonan')
  async suratPermohonan(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.surat.buat(id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('instansi')
  findInstansi() {
    return this.service.findInstansi();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('pilihan')
  findPilihan() {
    return this.service.findPilihan();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTempatMagangDto) {
    return this.service.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTempatMagangDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
