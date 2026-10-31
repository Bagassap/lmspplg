import { IsArray, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TempatBaruDto {
  @IsString()
  namaTempat!: string;

  @IsString()
  dukuh!: string;

  @IsString()
  desa!: string;

  @IsString()
  kecamatan!: string;

  @IsString()
  kabupaten!: string;

  @IsString()
  bidangUsaha!: string;

  @IsString()
  namaPimpinan!: string;

  @IsString()
  noWaUsaha!: string;
}

export class AjukanPenempatanDto {
  @IsString()
  @IsOptional()
  tempatMagangId?: string;

  @ValidateNested()
  @Type(() => TempatBaruDto)
  @IsOptional()
  tempatBaru?: TempatBaruDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rekanSiswaIds?: string[];
}

export class TolakPenempatanDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan penolakan wajib diisi' })
  alasan!: string;
}

export class TetapkanGuruDto {
  @IsString()
  guruPembimbingId!: string;

  @IsDateString()
  @IsOptional()
  tanggalMulai?: string;

  @IsDateString()
  @IsOptional()
  tanggalSelesai?: string;
}

export class UpdatePenempatanDto {
  @IsString()
  @IsOptional()
  tempatMagangId?: string;

  @IsString()
  @IsOptional()
  guruPembimbingId?: string;

  @IsDateString()
  @IsOptional()
  tanggalMulai?: string;

  @IsDateString()
  @IsOptional()
  tanggalSelesai?: string;

  @IsString()
  @IsIn(['MENUNGGU', 'AKTIF', 'SELESAI', 'BATAL'])
  @IsOptional()
  status?: 'MENUNGGU' | 'AKTIF' | 'SELESAI' | 'BATAL';
}
