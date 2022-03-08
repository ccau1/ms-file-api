import { ObjectId } from 'mongodb';
import { Document, PaginateModel } from 'mongoose';

export interface File extends Document {
  _id: ObjectId;

  name: string;
  bucketType: string;
  bucketFilePath: string;
  bucketFileName: string;
  originalFileName: string;
  extension: string;
  size: number;
  url: string;
  thumbnailUrl: string;
  createdBy: ObjectId;
  compressions: Array<{
    quality: number;
    url: string;
    size: number;
    bucketFilePath: string;
    bucketFileName: string;
  }>;
  tags: string[];
  organization: ObjectId;
  isArchived: boolean;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FileModel = PaginateModel<File>;
