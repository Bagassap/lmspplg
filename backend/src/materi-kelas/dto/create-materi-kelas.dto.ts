import { IsString, IsOptional } from 'class-validator';

export class CreateMateriKelasDto {
  @IsString()
  jadwalKelasId: string;

  @IsString()
  judul: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;
}
