import { BaseSearchModel } from 'src/core/mongo/BaseSearchModel';
import {
  IsOptional,
  IsString,
  IsMongoId,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import transformBoolean from 'src/core/classTransformers/transformBoolean';
import { Transform } from 'class-transformer';

export class FileSearchModel extends BaseSearchModel {
  // q searches as regex, the following:
  //.  name
  //.  bucketFileName
  //.  originalFileName
  //.  extension
  @IsOptional()
  @IsString()
  q?: string; // from base search

  // fetch only files with createdBy file related to me
  @IsOptional()
  @Transform(transformBoolean)
  @IsBoolean()
  me?: boolean; // from base search

  @IsOptional()
  @IsString({ each: true })
  bucketTypes?: string[];

  // extension matches one of this
  @IsOptional()
  @IsString({ each: true })
  extensions?: string[];

  // size must be bigger than this
  @IsOptional()
  @IsNumber()
  sizeMin?: number;

  // size must be smaller than this
  @IsOptional()
  @IsNumber()
  sizeMax?: number;

  // organization match one of this
  @IsOptional()
  @IsMongoId({ each: true })
  organizations?: ObjectId[];

  // createdBy match one of this
  @IsOptional()
  @IsMongoId({ each: true })
  users?: ObjectId[];

  // createdBy match one of this
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
