import { IsOptional, IsBoolean, IsDate, IsString } from 'class-validator';

export class BaseSearchModel {
  @IsOptional()
  @IsString({ each: true })
  _ids?: string[];

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString({ each: true })
  populates?: string[];

  @IsOptional()
  @IsDate()
  dateFr?: Date;

  @IsOptional()
  @IsDate()
  dateTo?: Date;

  @IsOptional()
  @IsBoolean()
  me?: boolean;
}
