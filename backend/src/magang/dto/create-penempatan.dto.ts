import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TempatBaruDto {
  @IsString()
  @IsNotEmpty()
  namaTempat!: string;

  @IsString()
  @IsNotEmpty()
  namaPimpinan!: string;

  @IsString()
  @IsNotEmpty()
  dukuh!: string;

  @IsString()
  @IsNotEmpty()
  rt!: string;

  @IsString()
  @IsNotEmpty()
  rw!: string;

  @IsString()
  @IsNotEmpty()
  desa!: string;

  @IsString()
  @IsNotEmpty()
  kecamatan!: string;

  @IsString()
  @IsNotEmpty()
  kabupaten!: string;

  @IsString()
  @Matches(/^[0-9+\s-]{8,20}$/)
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
}

export class TolakPenempatanDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan penolakan wajib diisi' })
  alasan!: string;
}

export class TetapkanGuruDto {
  @IsString()
  @IsOptional()
  guruPembimbingId?: string;

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
