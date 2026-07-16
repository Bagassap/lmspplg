import { Module } from '@nestjs/common';
import { AbsensiHarianController } from './absensi-harian.controller';
import { AbsensiHarianService } from './absensi-harian.service';
import { KelasModule } from '../kelas/kelas.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [KelasModule, NotificationModule],
  controllers: [AbsensiHarianController],
  providers: [AbsensiHarianService],
})
export class AbsensiHarianModule {}
