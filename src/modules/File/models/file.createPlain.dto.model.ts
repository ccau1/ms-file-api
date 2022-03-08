import {
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { FileImage } from './file.image.model';

export class FileCreatePlainDTOModel {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  bucketType: string;

  @IsString()
  @IsOptional()
  bucketFilePath: string;

  @IsOptional()
  @IsString()
  bucketFileName?: string;

  @IsOptional()
  @IsString()
  originalFileName?: string;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ValidateNested({ each: true })
  compressions: FileImage[];

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsMongoId()
  organization?: ObjectId;

  @IsMongoId()
  @IsOptional()
  createdBy?: ObjectId;

  @IsString()
  extension: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
