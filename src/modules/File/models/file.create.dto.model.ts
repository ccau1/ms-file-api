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

export class FileCreateDTOModel {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber({}, { each: true })
  qualities: number[];

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsMongoId()
  organization?: ObjectId;

  @IsString()
  bucketType: string;

  @IsString()
  bucketFilePath: string;

  @IsString()
  url: string;

  @ValidateNested()
  compressions: FileImage[];

  @IsMongoId()
  createdBy: ObjectId;

  @IsString()
  extension: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
