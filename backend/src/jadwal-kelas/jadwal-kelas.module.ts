import { Module } from '@nestjs/common';
import { JadwalKelasController } from './jadwal-kelas.controller';
import { JadwalKelasService } from './jadwal-kelas.service';

@Module({
  controllers: [JadwalKelasController],
  providers: [JadwalKelasService],
})
export class JadwalKelasModule {}
