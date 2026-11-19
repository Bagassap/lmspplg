import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PendaftaranMagangService } from './pendaftaran-magang.service';
import { DaftarMagangDto, TolakPendaftaranDto } from './dto/pendaftaran-magang.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('magang/pendaftaran')
export class PendaftaranMagangController {
  constructor(private readonly service: PendaftaranMagangService) {}

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
