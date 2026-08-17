import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMateriDto {
  @IsString()
  @IsNotEmpty({ message: 'Judul tidak boleh kosong' })
  judul: string;

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsString()
  @IsNotEmpty({ message: 'Mapel tidak boleh kosong' })
  mapel: string;

  @IsString()
  @IsOptional()
  kelasId?: string;
}
