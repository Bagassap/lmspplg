import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitTugasDto {
  @IsString()
  @IsNotEmpty({ message: 'Tugas tidak boleh kosong' })
  tugasId: string;

  @IsString()
  @IsOptional()
  catatan?: string;

  @IsString()
  @IsOptional()
  submittedHtml?: string;

  @IsString()
  @IsOptional()
  submittedCss?: string;

  @IsString()
  @IsOptional()
  submittedJs?: string;

  @IsString()
  @IsOptional()
  jawaban?: string;
}
