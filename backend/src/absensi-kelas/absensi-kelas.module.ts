import { Module } from '@nestjs/common';
import { AbsensiKelasController } from './absensi-kelas.controller';
import { AbsensiKelasService } from './absensi-kelas.service';

@Module({
  controllers: [AbsensiKelasController],
  providers: [AbsensiKelasService],
})
export class AbsensiKelasModule {}
