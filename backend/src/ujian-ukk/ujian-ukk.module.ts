import { Module } from '@nestjs/common';
import { UjianUkkController } from './ujian-ukk.controller';
import { UjianUkkService } from './ujian-ukk.service';
import { UjianUkkExcelService } from './ujian-ukk-excel.service';
import { UjianUkkPdfService } from './ujian-ukk-pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [UjianUkkController],
  providers: [UjianUkkService, UjianUkkExcelService, UjianUkkPdfService, GoogleDriveService],
})
export class UjianUkkModule {}
