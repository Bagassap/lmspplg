import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { KelasModule } from './kelas/kelas.module';
import { AbsensiHarianModule } from './absensi-harian/absensi-harian.module';
import { PengumumanModule } from './pengumuman/pengumuman.module';
import { SiswaModule } from './siswa/siswa.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UjianUkkModule } from './ujian-ukk/ujian-ukk.module';
import { NotificationModule } from './notification/notification.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    KelasModule,
    AbsensiHarianModule,
    PengumumanModule,
    SiswaModule,
    DashboardModule,
    UjianUkkModule,
    NotificationModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
