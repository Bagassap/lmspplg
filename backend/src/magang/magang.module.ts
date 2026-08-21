import { Module } from '@nestjs/common';
import { TempatMagangController } from './tempat-magang.controller';
import { TempatMagangService } from './tempat-magang.service';
import { PenempatanController } from './penempatan.controller';
import { PenempatanService } from './penempatan.service';
import { AbsensiMagangController } from './absensi-magang.controller';
import { AbsensiMagangService } from './absensi-magang.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [TempatMagangController, PenempatanController, AbsensiMagangController],
  providers: [TempatMagangService, PenempatanService, AbsensiMagangService],
})
export class MagangModule {}
