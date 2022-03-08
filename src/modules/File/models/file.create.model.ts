import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import transformBoolean from 'src/core/classTransformers/transformBoolean';
import { FileImage } from './file.image.model';

export class FileCreateModel {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  bucketType?: string;

  @IsString()
  @IsOptional()
  bucketFilePath?: string;

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
  @Transform(transformBoolean)
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsMongoId()
  organization?: ObjectId;

  @IsMongoId()
  createdBy: ObjectId;

  @IsString()
  extension: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
