import { Module } from '@nestjs/common';
import { MateriKelasController } from './materi-kelas.controller';
import { MateriKelasService } from './materi-kelas.service';

@Module({
  controllers: [MateriKelasController],
  providers: [MateriKelasService],
})
export class MateriKelasModule {}
