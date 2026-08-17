import { IsOptional, IsString } from 'class-validator';

export class UpdateMateriDto {
  @IsString()
  @IsOptional()
  judul?: string;

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsString()
  @IsOptional()
  mapel?: string;

  @IsString()
  @IsOptional()
  kelasId?: string;
}
