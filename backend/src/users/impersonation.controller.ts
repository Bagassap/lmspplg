import { Controller, Post, Param, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@Controller('users')
export class ImpersonationController {
  constructor(private readonly service: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
  @Roles(Role.ADMIN)
  @Post(':id/impersonate')
  impersonate(@Param('id') id: string, @Request() req: any) {
    return this.service.impersonate(req.user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stop-impersonate')
  stopImpersonate(@Request() req: any) {
    return this.service.stopImpersonate(req.user);
  }
}
