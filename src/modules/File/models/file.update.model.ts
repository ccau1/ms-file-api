import {
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { UploadedFileModel } from 'src/core/uploadedFile.model';
import { FileImage } from './file.image.model';

export class FileUpdateModel {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsMongoId()
  organization?: ObjectId;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
