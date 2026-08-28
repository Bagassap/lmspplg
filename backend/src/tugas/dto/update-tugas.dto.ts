import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

function parseKelasIds(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export class UpdateTugasDto {
  @IsString()
  @IsOptional()
  mapel?: string;

  // undefined = field tidak dikirim (tidak diubah). Array kosong [] dikirim
  // eksplisit sebagai '[]' saat guru memang ingin mengosongkan jadi "Semua
  // Kelas" — sama seperti pola di UpdateMateriDto.
  @Transform(({ value }) => parseKelasIds(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  kelasIds?: string[];

  // Field lama (satu kelas) dari sebelum tugas mendukung multi-kelas — tetap
  // diterima (tapi diabaikan kalau kelasIds sudah ada) supaya tab browser
  // guru yang masih menjalankan bundle frontend lama saat deploy tidak
  // langsung gagal simpan gara-gara forbidNonWhitelisted. Lihat penanganannya
  // di TugasService.update.
  @IsString()
  @IsOptional()
  kelasId?: string;

  @IsString()
  @IsOptional()
  judul?: string;

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  @IsIn(['SUBMIT', 'PRAKTIK', 'PILIHAN_GANDA', 'ESSAY'])
  tipe?: string;

  @IsString()
  @IsOptional()
  starterHtml?: string;

  @IsString()
  @IsOptional()
  starterCss?: string;

  @IsString()
  @IsOptional()
  starterJs?: string;

  @IsString()
  @IsOptional()
  soal?: string;

  @IsString()
  @IsOptional()
  durasiMenit?: string;
}
