import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AbsensiItemDto {
  @IsString()
  siswaId: string;

  @IsString()
  status: string;
}

export class UpsertAbsensiDto {
  @IsString()
  jadwalKelasId: string;

  @IsString()
  tanggal: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbsensiItemDto)
  absensi: AbsensiItemDto[];
}
