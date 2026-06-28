import { IsOptional, IsString } from 'class-validator';

export class UpdateJadwalKelasDto {
  @IsString()
  @IsOptional()
  hari?: string;

  @IsString()
  @IsOptional()
  jamMulai?: string;

  @IsString()
  @IsOptional()
  jamSelesai?: string;

  @IsString()
  @IsOptional()
  mataPelajaran?: string;

  @IsString()
  @IsOptional()
  kelas?: string;

  @IsString()
  @IsOptional()
  guruId?: string;

  @IsString()
  @IsOptional()
  ruangan?: string;
}
