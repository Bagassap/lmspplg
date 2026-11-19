import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTempatMagangDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama tempat wajib diisi' })
  namaTempat!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  kuota?: number;

  @IsString()
  @IsNotEmpty({ message: 'Dukuh wajib diisi' })
  @MaxLength(100)
  dukuh!: string;

  @IsString()
  @IsNotEmpty({ message: 'RT wajib diisi' })
  @MaxLength(5)
  rt!: string;

  @IsString()
  @IsNotEmpty({ message: 'RW wajib diisi' })
  @MaxLength(5)
  rw!: string;

  @IsString()
  @IsNotEmpty({ message: 'Desa wajib diisi' })
  @MaxLength(100)
  desa!: string;

  @IsString()
  @IsNotEmpty({ message: 'Kecamatan wajib diisi' })
  @MaxLength(100)
  kecamatan!: string;

  @IsString()
  @IsNotEmpty({ message: 'Kabupaten wajib diisi' })
  @MaxLength(100)
  kabupaten!: string;
}
