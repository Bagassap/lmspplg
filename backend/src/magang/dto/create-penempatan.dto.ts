import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

const Rapikan = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class TempatBaruDto {
  @Rapikan()
  @IsString()
  @IsNotEmpty()
  namaTempat!: string;

  @Rapikan()
  @IsString()
  @IsNotEmpty()
  namaPimpinan!: string;

  @Rapikan()
  @IsString()
  @IsNotEmpty()
  dukuh!: string;

  @Rapikan()
  @IsString()
  @IsNotEmpty()
  rt!: string;

  @Rapikan()
  @IsString()
  @IsNotEmpty()
  rw!: string;

  @Rapikan()
  @IsString()
  @IsNotEmpty()
  desa!: string;

  @Rapikan()
  @IsString()
  @IsNotEmpty()
  kecamatan!: string;

  @Rapikan()
  @IsString()
  @IsNotEmpty()
  kabupaten!: string;

  @Rapikan()
  @IsString()
  @Matches(/^(?=(?:\D*\d){8})[0-9+\s-]{8,20}$/)
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
