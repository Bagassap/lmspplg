import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class DaftarMagangDto {
  @IsString()
  @Matches(/^[0-9+\s-]{8,20}$/, { message: 'Nomor WA tidak valid' })
  noWa!: string;

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

  @IsString()
  @IsOptional()
  tempatMagangId?: string | null;
}

export class TolakPendaftaranDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan penolakan wajib diisi' })
  alasan!: string;
}
