import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role, StatusPasswordReset } from '../../generated/prisma/client';
import { SUPER_ADMIN_LOGIN_ID } from '../auth/guards/super-admin.guard';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  GURU: '/guru/dashboard',
  SISWA: '/siswa/dashboard',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async resetPassword(
    admin: { loginId?: string | null },
    id: string,
    dto: ResetPasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { siswa: true },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // Regular admins may only reset student accounts (the only targets
    // admin/data-siswa ever exposes) — resetting guru/admin accounts,
    // including the super admin itself, stays super-admin-only.
    if (user.role !== Role.SISWA && admin.loginId !== SUPER_ADMIN_LOGIN_ID) {
      throw new ForbiddenException('Hanya super admin yang dapat mereset password akun ini');
    }

    let newPassword: string;
    if (user.role === Role.SISWA) {
      if (!user.siswa) throw new NotFoundException('Data siswa tidak ditemukan');
      newPassword = user.siswa.nis;
    } else {
      if (!dto.newPassword) {
        throw new BadRequestException('Password baru wajib diisi');
      }
      newPassword = dto.newPassword;
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashed,
        mustChangePassword: true,
        ...(dto.bypassIdentityVerification ? { bypassIdentityVerification: true } : {}),
      },
    });

    return {
      message: `Password ${user.nama} berhasil direset${user.role === Role.SISWA ? ' ke NIS' : ''}`,
    };
  }

  async findPasswordStatus() {
    return this.prisma.user.findMany({
      where: {
        role: { in: [Role.SISWA, Role.GURU] },
      },
      select: {
        id: true,
        nama: true,
        role: true,
        loginId: true,
        mustChangePassword: true,
        updatedAt: true,
        siswa: { select: { nis: true, kelas: { select: { nama: true } } } },
        guru: { select: { nip: true } },
      },
      orderBy: [{ role: 'asc' }, { nama: 'asc' }],
    });
  }

  async findSiswaPasswordStatus(kelasId: string, page = 1, limit = 10) {
    if (!kelasId) throw new BadRequestException('kelasId wajib diisi');
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(1000, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.siswa.findMany({
        where: { kelasId },
        select: {
          id: true,
          nis: true,
          nama: true,
          user: { select: { id: true, mustChangePassword: true, updatedAt: true } },
        },
        orderBy: { nama: 'asc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.siswa.count({ where: { kelasId } }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findPasswordResetRequests() {
    return this.prisma.passwordResetRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            role: true,
            siswa: { select: { nis: true, kelas: { select: { nama: true } } } },
            guru: { select: { nip: true } },
          },
        },
        processedBy: { select: { id: true, nama: true } },
      },
    });
  }

  async completePasswordResetRequest(id: string, adminId: string) {
    const reqRow = await this.prisma.passwordResetRequest.findUnique({ where: { id } });
    if (!reqRow) throw new NotFoundException('Permintaan tidak ditemukan');
    if (reqRow.status === StatusPasswordReset.SELESAI) {
      return reqRow;
    }
    return this.prisma.passwordResetRequest.update({
      where: { id },
      data: {
        status: StatusPasswordReset.SELESAI,
        processedAt: new Date(),
        processedById: adminId,
      },
    });
  }

  async impersonate(
    admin: { id: string; nama: string; role: string; loginId?: string | null },
    targetId: string,
  ) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User tidak ditemukan');
    // Blocks impersonating any admin account, which already covers the
    // super admin — no separate check needed to protect it specifically.
    if (target.role === Role.ADMIN) {
      throw new ForbiddenException('Tidak dapat memantau akun admin');
    }

    const payload = {
      sub: target.id,
      role: target.role,
      nama: target.nama,
      loginId: target.loginId,
      mustChangePassword: target.mustChangePassword,
      impersonatedBy: admin.id,
    };
    const token = this.jwtService.sign(payload);
    const redirectTo = ROLE_DASHBOARD[target.role] ?? '/siswa/dashboard';

    console.log(
      `[IMPERSONATE] Admin ${admin.nama} masuk sebagai ${target.nama} pada ${new Date().toISOString()}`,
    );

    return { success: true, redirectTo, access_token: token };
  }

  stopImpersonate(user: { nama: string; impersonatedBy?: string | null }) {
    if (user.impersonatedBy) {
      console.log(
        `[IMPERSONATE] Sesi pantau terhadap ${user.nama} diakhiri pada ${new Date().toISOString()}`,
      );
    }
    return { success: true, redirectTo: '/admin/dashboard' };
  }
}
