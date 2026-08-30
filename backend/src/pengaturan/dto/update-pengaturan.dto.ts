import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePengaturanDto {
  @IsBoolean()
  @IsOptional()
  magangAktif?: boolean;

  @IsBoolean()
  @IsOptional()
  ukkAktif?: boolean;
}
