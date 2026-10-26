import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  role: string;
  nama: string;
  impersonatedBy?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: { originalUrl?: string; url?: string }, payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, nama: true, role: true, isActive: true, loginId: true, fotoProfil: true, profileCompleted: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Akun tidak ditemukan atau tidak aktif');
    }

    // Siswa wajib melengkapi data dan foto profil: selama belum, seluruh API terkunci kecuali
    // yang dipakai untuk melengkapinya (middleware frontend hanya menjaga halaman, bukan API).
    if (user.role === 'SISWA' && !payload.impersonatedBy && (!user.fotoProfil || !user.profileCompleted)) {
      const path = (req.originalUrl ?? req.url ?? '').split('?')[0];
      const boleh = path.startsWith('/api/auth/') || path === '/api/siswa/lengkapi-profil';
      if (!boleh) {
        throw new ForbiddenException(
          !user.profileCompleted ? 'Lengkapi data diri terlebih dahulu' : 'Unggah foto profil terlebih dahulu untuk memakai LMS',
        );
      }
    }

    const { fotoProfil: _foto, profileCompleted: _pc, ...rest } = user;
    return { ...rest, impersonatedBy: payload.impersonatedBy ?? null };
  }
}
