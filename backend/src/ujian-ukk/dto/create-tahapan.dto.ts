import { IsString, IsInt, IsOptional, IsDateString, IsUrl, ValidateIf } from 'class-validator';

export class CreateTahapanDto {
  @IsInt()
  hariKe: number;

  @IsString()
  judul: string;

  @IsDateString()
  tanggal: string;

  @IsDateString()
  @IsOptional()
  tanggalSelesai?: string;

  @IsString()
  jamMulai: string;

  @IsString()
  jamSelesai: string;

  @IsString()
  lokasi: string;

  @IsString()
  @IsOptional()
  penguji?: string;

  @IsString()
  @IsOptional()
  keterangan?: string;

  @ValidateIf((o) => o.driveLink !== undefined && o.driveLink !== null && o.driveLink !== '')
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @IsOptional()
  driveLink?: string;
}
