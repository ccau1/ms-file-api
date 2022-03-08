import { Schema, SchemaTypes } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export const FileSchema = new Schema(
  {
    name: { type: String, default: '' },
    bucketType: { type: String, required: true },
    bucketFilePath: { type: String, default: '' },
    bucketFileName: { type: String, default: '' },
    originalFileName: { type: String, default: '' },
    extension: { type: String, default: '' },
    size: { type: Number },
    url: { type: String, required: true },
    // whether this should be shown or not
    thumbnailUrl: { type: String },
    createdBy: { type: SchemaTypes.ObjectId, required: true, ref: 'Users' },
    compressions: [
      {
        quality: { type: Number, required: true },
        url: { type: String, required: true },
        size: { type: Number, required: true },
        bucketFileName: { type: String },
        bucketFilePath: { type: String },
      },
    ],
    tags: [{ type: String, required: true }],
    mimeType: { type: String, default: '' },
    organization: { type: SchemaTypes.ObjectId },
    isArchived: { type: Boolean },
  },
  {
    collection: 'Files',
    timestamps: true,
  },
);

FileSchema.plugin(mongoosePaginate);
