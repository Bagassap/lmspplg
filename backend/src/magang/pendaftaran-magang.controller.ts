import { Body, Controller, Get, Param, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PendaftaranMagangService } from './pendaftaran-magang.service';
import { RekapPklExcelService } from './rekap-pkl-excel.service';
import { DaftarMagangDto, GantiInstansiDto, TolakPendaftaranDto } from './dto/pendaftaran-magang.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('magang/pendaftaran')
export class PendaftaranMagangController {
  constructor(
    private readonly service: PendaftaranMagangService,
    private readonly rekapExcel: RekapPklExcelService,
  ) {}

  @Roles(Role.SISWA)
  @Get('saya')
  findSaya(@Request() req: any) {
    return this.service.findSaya(req.user.id);
  }

  @Roles(Role.SISWA)
  @Post()
  daftar(@Request() req: any, @Body() dto: DaftarMagangDto) {
    return this.service.daftar(req.user.id, dto);
  }

  @Roles(Role.SISWA)
  @Post('ganti-instansi')
  gantiInstansi(@Request() req: any, @Body() dto: GantiInstansiDto) {
    return this.service.gantiInstansi(req.user.id, dto.tempatMagangId);
  }

  @Roles(Role.ADMIN)
  @Get('belum-daftar')
  belumDaftar() {
    return this.service.belumDaftar();
  }

  @Roles(Role.ADMIN)
  @Get('export-excel')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.rekapExcel.build();
    const tgl = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Rekap_PKL_${tgl}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Roles(Role.ADMIN)
  @Post(':id/terima')
  terima(@Param('id') id: string) {
    return this.service.terima(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/tolak')
  tolak(@Param('id') id: string, @Body() dto: TolakPendaftaranDto) {
    return this.service.tolak(id, dto.alasan);
  }

  @Roles(Role.ADMIN)
  @Post(':id/batal-verifikasi')
  batalkanVerifikasi(@Param('id') id: string) {
    return this.service.batalkanVerifikasi(id);
  }
}
