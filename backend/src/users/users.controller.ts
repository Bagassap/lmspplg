import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('password-status')
  findPasswordStatus() {
    return this.service.findPasswordStatus();
  }

  @Get('manajemen-password/siswa')
  findSiswaPasswordStatus(
    @Query('kelasId') kelasId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findSiswaPasswordStatus(
      kelasId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Patch(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(id, dto);
  }

  @Get('password-reset-requests')
  findPasswordResetRequests() {
    return this.service.findPasswordResetRequests();
  }

  @Patch('password-reset-requests/:id/complete')
  completePasswordResetRequest(@Param('id') id: string, @Request() req: any) {
    return this.service.completePasswordResetRequest(id, req.user.id);
  }
}
