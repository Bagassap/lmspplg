import { IsString, IsOptional } from 'class-validator';

export class AbsenSendiriDto {
  @IsString()
  jadwalKelasId: string;

  @IsOptional()
  @IsString()
  lokasi?: string;

  @IsOptional()
  @IsString()
  waktuAbsen?: string;

  @IsOptional()
  @IsString()
  ttd?: string; // base64 PNG dataURL dari signature pad
}
