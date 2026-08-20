import { Module } from '@nestjs/common';
import { TempatMagangController } from './tempat-magang.controller';
import { TempatMagangService } from './tempat-magang.service';
import { PenempatanController } from './penempatan.controller';
import { PenempatanService } from './penempatan.service';

@Module({
  controllers: [TempatMagangController, PenempatanController],
  providers: [TempatMagangService, PenempatanService],
})
export class MagangModule {}
