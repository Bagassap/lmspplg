import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { MapelService } from './mapel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('mapel')
export class MapelController {
  constructor(private readonly service: MapelService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get('saya')
  findMine(@Request() req: any) {
    return this.service.findMineByUserId(req.user.id);
  }
}
