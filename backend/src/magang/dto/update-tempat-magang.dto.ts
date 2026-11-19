import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
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
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  dukuh?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(5)
  rt?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(5)
  rw?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  desa?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  kecamatan?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  kabupaten?: string;
}
