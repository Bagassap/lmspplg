import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { TugasKelasService } from './tugas-kelas.service';
import { CreateTugasKelasDto } from './dto/create-tugas-kelas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

const submisiStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'submisi');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@UseGuards(JwtAuthGuard)
@Controller('tugas-kelas')
export class TugasKelasController {
  constructor(private readonly service: TugasKelasService) {}

  @Get(':jadwalKelasId')
  findByJadwal(@Param('jadwalKelasId') jadwalKelasId: string) {
    return this.service.findByJadwal(jadwalKelasId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Get(':id/submisi')
  getSubmisi(@Param('id') id: string) {
    return this.service.getSubmisi(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Get(':id/submisi-saya')
  getSubmisiSaya(@Param('id') id: string, @Request() req: any) {
    return this.service.getSubmisiSaya(id, req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Post(':id/submit')
  @UseInterceptors(FileInterceptor('file', { storage: submisiStorage }))
  submitTugas(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileUrl = file ? `/uploads/submisi/${file.filename}` : undefined;
    return this.service.submitTugas(id, req.user.id, fileUrl);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Post()
  create(@Body() dto: CreateTugasKelasDto) {
    return this.service.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GURU)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
