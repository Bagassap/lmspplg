import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateProfilSiswaDto {
  @IsString()
  @IsOptional()
  jenisKelamin?: string;

  @IsString()
  @IsOptional()
  tempatLahir?: string;

  @IsDateString()
  @IsOptional()
  tanggalLahir?: string;

  @IsString()
  @IsOptional()
  namaOrtu?: string;

  @IsString()
  @IsOptional()
  noHp?: string;

  @IsString()
  @IsOptional()
  dukuh?: string;

  @IsString()
  @IsOptional()
  rt?: string;

  @IsString()
  @IsOptional()
  rw?: string;

  @IsString()
  @IsOptional()
  desa?: string;

  @IsString()
  @IsOptional()
  kecamatan?: string;

  @IsString()
  @IsOptional()
  kabupaten?: string;
}
