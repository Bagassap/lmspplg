import { IsBoolean, IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class UpdatePengaturanDto {
  @IsBoolean()
  @IsOptional()
  magangAktif?: boolean;

  @IsBoolean()
  @IsOptional()
  ukkAktif?: boolean;

  @ValidateIf((o) => o.ukkDriveLink !== undefined && o.ukkDriveLink !== null && o.ukkDriveLink !== '')
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @IsOptional()
  ukkDriveLink?: string | null;
}
