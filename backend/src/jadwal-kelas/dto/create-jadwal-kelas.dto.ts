import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJadwalKelasDto {
  @IsString()
  @IsNotEmpty({ message: 'Hari tidak boleh kosong' })
  hari: string;

  @IsString()
  @IsNotEmpty({ message: 'Jam mulai tidak boleh kosong' })
  jamMulai: string;

  @IsString()
  @IsNotEmpty({ message: 'Jam selesai tidak boleh kosong' })
  jamSelesai: string;

  @IsString()
  @IsNotEmpty({ message: 'Mata pelajaran tidak boleh kosong' })
  mataPelajaran: string;

  @IsString()
  @IsNotEmpty({ message: 'Kelas tidak boleh kosong' })
  kelas: string;

  @IsString()
  @IsNotEmpty({ message: 'ID guru tidak boleh kosong' })
  guruId: string;

  @IsString()
  @IsOptional()
  ruangan?: string;
}
