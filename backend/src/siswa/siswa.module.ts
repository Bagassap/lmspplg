import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SiswaController } from './siswa.controller';
import { SiswaService } from './siswa.service';

@Module({
  imports: [AuthModule],
  controllers: [SiswaController],
  providers: [SiswaService],
})
export class SiswaModule {}
