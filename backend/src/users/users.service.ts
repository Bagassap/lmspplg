import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const hashed = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed, mustChangePassword: true },
    });

    return { message: `Password ${user.nama} berhasil direset` };
  }

  async findPendingPasswordChange() {
    return this.prisma.user.findMany({
      where: {
        mustChangePassword: true,
        role: { in: [Role.SISWA, Role.GURU] },
      },
      select: {
        id: true,
        nama: true,
        role: true,
        updatedAt: true,
        siswa: { select: { nis: true, kelas: { select: { nama: true } } } },
        guru: { select: { nip: true } },
      },
      orderBy: [{ role: 'asc' }, { nama: 'asc' }],
    });
  }
}
