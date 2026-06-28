import { IsString, IsOptional } from 'class-validator';

export class UpdateProfilSiswaDto {
  @IsString()
  @IsOptional()
  noHp?: string;

  @IsString()
  @IsOptional()
  alamat?: string;
}
