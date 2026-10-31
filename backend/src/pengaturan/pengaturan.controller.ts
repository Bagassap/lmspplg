import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { PengaturanService } from './pengaturan.service';
import { UpdatePengaturanDto } from './dto/update-pengaturan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('pengaturan')
export class PengaturanController {
  constructor(private readonly service: PengaturanService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put()
  update(@Body() dto: UpdatePengaturanDto) {
    return this.service.update(dto);
  }
}
