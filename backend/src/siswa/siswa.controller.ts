import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SiswaService } from './siswa.service';
import { UpdateSiswaDto } from './dto/update-siswa.dto';
import { UpdateProfilSiswaDto } from './dto/update-profil-siswa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('siswa')
export class SiswaController {
  constructor(private readonly service: SiswaService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get('saya')
  findMine(@Request() req: any) {
    return this.service.findMine(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Put('saya')
  updateMine(@Request() req: any, @Body() dto: UpdateProfilSiswaDto) {
    return this.service.updateMine(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get()
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('kelasId') kelasId?: string,
    @Query('jurusan') jurusan?: string,
    @Query('jenisKelamin') jenisKelamin?: string,
  ) {
    return this.service.findAll({ search, kelasId, jurusan, jenisKelamin }, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSiswaDto) {
    return this.service.update(id, dto);
  }
}
