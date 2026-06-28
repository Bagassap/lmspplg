import { Module } from '@nestjs/common';
import { PengumumanController } from './pengumuman.controller';
import { PengumumanService } from './pengumuman.service';

@Module({
  controllers: [PengumumanController],
  providers: [PengumumanService],
})
export class PengumumanModule {}
