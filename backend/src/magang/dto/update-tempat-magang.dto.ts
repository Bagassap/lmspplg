import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTempatMagangDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  namaTempat?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  kuota?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  dukuh?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  rt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  rw?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  desa?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  kecamatan?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  kabupaten?: string;

  @IsIn(['Laki-laki', 'Perempuan', 'Semua'])
  @IsOptional()
  jenisKelamin?: 'Laki-laki' | 'Perempuan' | 'Semua';
}
