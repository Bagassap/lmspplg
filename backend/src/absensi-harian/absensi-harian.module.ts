import { Module } from '@nestjs/common';
import { AbsensiHarianController } from './absensi-harian.controller';
import { AbsensiHarianService } from './absensi-harian.service';
import { KelasModule } from '../kelas/kelas.module';

@Module({
  imports: [KelasModule],
  controllers: [AbsensiHarianController],
  providers: [AbsensiHarianService],
})
export class AbsensiHarianModule {}
