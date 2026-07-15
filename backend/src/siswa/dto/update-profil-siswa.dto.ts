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
  alamat?: string;
}
