import { Module } from '@nestjs/common';
import { TugasKelasController } from './tugas-kelas.controller';
import { TugasKelasService } from './tugas-kelas.service';

@Module({
  controllers: [TugasKelasController],
  providers: [TugasKelasService],
})
export class TugasKelasModule {}
