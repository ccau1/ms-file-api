import {
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ObjectId } from 'mongodb';

export class FileCreateWithFileDTOModel {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber({}, { each: true })
  @IsOptional()
  qualities?: number[];

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsMongoId()
  organization?: ObjectId;

  @IsOptional()
  @IsString()
  bucketType?: FileBucketType;

  @IsOptional()
  @IsString()
  bucketFilePath?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
