import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JadwalKelasService } from './jadwal-kelas.service';
import { CreateJadwalKelasDto } from './dto/create-jadwal-kelas.dto';
import { UpdateJadwalKelasDto } from './dto/update-jadwal-kelas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('jadwal-kelas')
export class JadwalKelasController {
  constructor(private readonly service: JadwalKelasService) {}

  // Static routes first to avoid conflict with :id param
  @Get('saya')
  findMine(@Request() req: any) {
    return this.service.findMine(req.user.id, req.user.role);
  }

  @Get('guru-list')
  getGuruList() {
    return this.service.getGuruList();
  }

  @Get()
  findAll(@Query('kelas') kelas?: string) {
    return this.service.findAll(kelas);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateJadwalKelasDto) {
    return this.service.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJadwalKelasDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
