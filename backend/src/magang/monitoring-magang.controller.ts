import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { MonitoringMagangService } from './monitoring-magang.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.GURU)
@Controller('magang/monitoring')
export class MonitoringMagangController {
  constructor(private readonly service: MonitoringMagangService) {}

  @Get()
  getMonitoring(@Request() req: any) {
    return this.service.getMonitoring(req.user.id, req.user.role);
  }
}
