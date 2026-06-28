import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { MateriKelasService } from './materi-kelas.service';
import { CreateMateriKelasDto } from './dto/create-materi-kelas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'materi');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@UseGuards(JwtAuthGuard)
@Controller('materi-kelas')
export class MateriKelasController {
  constructor(private readonly service: MateriKelasService) {}

  @Get(':jadwalKelasId')
  findByJadwal(@Param('jadwalKelasId') jadwalKelasId: string) {
    return this.service.findByJadwal(jadwalKelasId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage }))
  create(
    @Body() dto: CreateMateriKelasDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileUrl = file ? `/uploads/materi/${file.filename}` : undefined;
    return this.service.create(dto, fileUrl);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
