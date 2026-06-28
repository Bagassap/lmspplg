import { IsString, IsOptional } from 'class-validator';

export class CreateTugasKelasDto {
  @IsString()
  jadwalKelasId: string;

  @IsString()
  judul: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsString()
  deadline?: string;
}
