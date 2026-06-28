import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JadwalKelasModule } from './jadwal-kelas/jadwal-kelas.module';
import { MateriKelasModule } from './materi-kelas/materi-kelas.module';
import { TugasKelasModule } from './tugas-kelas/tugas-kelas.module';
import { AbsensiKelasModule } from './absensi-kelas/absensi-kelas.module';
import { PengumumanModule } from './pengumuman/pengumuman.module';
import { SiswaModule } from './siswa/siswa.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UjianUkkModule } from './ujian-ukk/ujian-ukk.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    JadwalKelasModule,
    MateriKelasModule,
    TugasKelasModule,
    AbsensiKelasModule,
    PengumumanModule,
    SiswaModule,
    DashboardModule,
    UjianUkkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
