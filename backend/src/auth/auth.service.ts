import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const profileInclude = {
      siswa: {
        select: {
          id: true,
          nis: true,
          kelas: { select: { id: true, nama: true } },
          angkatan: true,
        },
      },
      guru: { select: { id: true, nip: true } },
    };

    let user = await this.prisma.user.findUnique({
      where: { email: dto.login },
      include: profileInclude,
    });

    if (!user) {
      const siswa = await this.prisma.siswa.findUnique({
        where: { nis: dto.login },
        include: { user: { include: profileInclude } },
      });
      if (siswa) {
        user = siswa.user;
      }
    }

    if (!user) {
      const candidates = await this.prisma.user.findMany({
        where: { loginId: dto.login },
        include: profileInclude,
      });
      for (const candidate of candidates) {
        if (await bcrypt.compare(dto.password, candidate.password)) {
          user = candidate;
          break;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Akun tidak aktif, hubungi administrator',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    const payload = {
      sub: user.id,
      role: user.role,
      nama: user.nama,
      loginId: user.loginId,
      mustChangePassword: user.mustChangePassword,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        loginId: user.loginId,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        profil: this.getProfil(user),
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        email: true,
        loginId: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        siswa: {
          select: {
            id: true,
            nis: true,
            kelas: { select: { id: true, nama: true } },
            angkatan: true,
          },
        },
        guru: { select: { id: true, nip: true } },
      },
    });
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Akun tidak ditemukan');
    }

    if (!user.mustChangePassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Password saat ini wajib diisi');
      }
      const currentMatch = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );
      if (!currentMatch) {
        throw new BadRequestException('Password saat ini salah');
      }
      if (dto.newPassword === dto.currentPassword) {
        throw new BadRequestException(
          'Password baru tidak boleh sama dengan password lama',
        );
      }
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password baru tidak cocok');
    }

    const hashed = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, mustChangePassword: false },
    });

    const payload = {
      sub: updated.id,
      role: updated.role,
      nama: updated.nama,
      loginId: updated.loginId,
      mustChangePassword: updated.mustChangePassword,
    };
    const token = this.jwtService.sign(payload);

    return { access_token: token, message: 'Password berhasil diubah' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const loginId = dto.loginIdDiajukan.trim();

    const siswa = await this.prisma.siswa.findUnique({
      where: { nis: loginId },
      select: { userId: true },
    });
    const matchedUserId =
      siswa?.userId ??
      (await this.prisma.user.findFirst({ where: { loginId }, select: { id: true } }))?.id;

    await this.prisma.passwordResetRequest.create({
      data: {
        userId: matchedUserId,
        namaPengaju: dto.namaPengaju.trim(),
        loginIdDiajukan: loginId,
        keterangan: dto.keterangan?.trim() || undefined,
      },
    });

    return { message: 'Permintaan reset password telah dikirim ke admin' };
  }

  private getProfil(user: any) {
    if (user.role === Role.SISWA) return user.siswa;
    if (user.role === Role.GURU) return user.guru;
    return null;
  }
}
