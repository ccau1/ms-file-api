import { IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';

export class FileImage {
  @IsNumber()
  @Min(0)
  @Max(100)
  quality: number;

  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  bucketFilePath?: string;

  @IsString()
  @IsOptional()
  bucketFileName?: string;
}
