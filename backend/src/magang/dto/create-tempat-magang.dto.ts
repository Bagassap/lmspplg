import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Guru/admin cukup mengisi nama tempat dan kuota siswa. Detail lain (alamat,
// bidang usaha, pimpinan, WA) diisi siswa saat mengajukan tempat baru.
export class CreateTempatMagangDto {
  @IsString()
  namaTempat!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  kuota?: number;
}
