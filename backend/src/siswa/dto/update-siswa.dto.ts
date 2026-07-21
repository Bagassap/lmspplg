import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateSiswaDto {
  @IsString()
  @IsOptional()
  nama?: string;

  @IsString()
  @IsOptional()
  kelasId?: string;

  @IsString()
  @IsOptional()
  jurusan?: string;

  @IsNumber()
  @IsOptional()
  angkatan?: number;

  @IsString()
  @IsOptional()
  jenisKelamin?: string;

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

  @IsString()
  @IsOptional()
  tempatLahir?: string;

  @IsDateString()
  @IsOptional()
  tanggalLahir?: string;

  @IsString()
  @IsOptional()
  namaOrtu?: string;
}
