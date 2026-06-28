import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // Cari user: coba by email dulu, lalu by NIS (untuk siswa)
    let user = await this.prisma.user.findUnique({
      where: { email: dto.login },
      include: {
        siswa: { select: { id: true, nis: true, kelas: true, angkatan: true } },
        guru: { select: { id: true, nip: true } },
      },
    });

    // Jika tidak ketemu by email, coba cari siswa by NIS
    if (!user) {
      const siswa = await this.prisma.siswa.findUnique({
        where: { nis: dto.login },
        include: {
          user: {
            include: {
              siswa: { select: { id: true, nis: true, kelas: true, angkatan: true } },
              guru: { select: { id: true, nip: true } },
            },
          },
        },
      });
      if (siswa) {
        user = siswa.user;
      }
    }

    if (!user) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun tidak aktif, hubungi administrator');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    const payload = { sub: user.id, role: user.role, nama: user.nama };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
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
        role: true,
        isActive: true,
        siswa: { select: { id: true, nis: true, kelas: true, angkatan: true } },
        guru: { select: { id: true, nip: true } },
      },
    });
    return user;
  }

  private getProfil(user: any) {
    if (user.role === Role.SISWA) return user.siswa;
    if (user.role === Role.GURU) return user.guru;
    return null;
  }
}
