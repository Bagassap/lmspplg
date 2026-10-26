import { IsArray, IsDateString, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TempatBaruDto {
  @IsString()
  namaTempat!: string;

  @IsString()
  dukuh!: string;

  @IsString()
  desa!: string;

  @IsString()
  kecamatan!: string;

  @IsString()
  kabupaten!: string;

  @IsString()
  bidangUsaha!: string;

  @IsString()
  namaPimpinan!: string;

  @IsString()
  noWaUsaha!: string;
}

// Pengajuan PKL oleh siswa: pilih tempat yang tersedia ATAU isi tempat baru.
export class AjukanPenempatanDto {
  @IsString()
  @IsOptional()
  tempatMagangId?: string;

  @ValidateNested()
  @Type(() => TempatBaruDto)
  @IsOptional()
  tempatBaru?: TempatBaruDto;

  // siswa lain yang ikut ke tempat yang sama (hanya bila kuota lebih dari satu)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rekanSiswaIds?: string[];
}

// Admin menolak pengajuan PKL; alasan (opsional) diteruskan ke siswa lewat notifikasi.
export class TolakPenempatanDto {
  @IsString()
  @IsOptional()
  alasan?: string;
}

// Admin menetapkan guru pembimbing setelah siswa mengajukan.
export class TetapkanGuruDto {
  @IsString()
  guruPembimbingId!: string;

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
