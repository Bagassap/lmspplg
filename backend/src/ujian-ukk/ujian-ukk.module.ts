import { Module } from '@nestjs/common';
import { UjianUkkController } from './ujian-ukk.controller';
import { UjianUkkService } from './ujian-ukk.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UjianUkkController],
  providers: [UjianUkkService],
})
export class UjianUkkModule {}
