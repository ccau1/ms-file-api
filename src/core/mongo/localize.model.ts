import { IsOptional, IsString } from 'class-validator';

export class LocalizeStringModel {
  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  'zh-hk'?: string;

  @IsOptional()
  @IsString()
  'zh-cn'?: string;
}
