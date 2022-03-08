interface UploadFileImageResponse {
  quality: number;
  url: string;
  size: number;
  bucketFileName?: string;
  bucketFilePath?: string;
}

type FileCommandType = 'create' | 'update' | 'read' | 'delete';

type FileBucketType = 'azure' | 'aws' | 'google';

interface UploadFileResponse {
  url: string;
  bucketType: string;
  bucketFileName: string;
  compressions: UploadFileImageResponse[];
}

interface UploadFileOptions {
  blobName?: string;
  isUpdate?: boolean;
  qualities?: number[];
  bucketFilePath?: string;
  mimeType?: string;
  isArchived?: boolean;
  organization?: string;
  bucketType?: FileBucketType;
  headerAuthorization?: string;
  createdBy?: string;
}

interface CommandPropertiesResponse {
  bucketType: string;
  expiresOn?: Date;
  sas: string;
  meta?: any;
}

interface StorageBucket {
  getCommandProperties(
    type: string,
    bucketFilePath?: string,
  ): Promise<CommandPropertiesResponse>;
  uploadFileFromLocalFile(
    filePath: string,
    options?: UploadFileOptions,
  ): Promise<UploadFileResponse>;
  uploadFileFromStream(
    bufferStream: Buffer,
    bufferSize: number,
    options?: UploadFileOptions,
  ): Promise<UploadFileResponse>;
  getFileToStream(fileName: string, filePath?: string): Promise<Buffer>;
  deleteFile(fileName: string, filePath?: string): Promise<void>;
  deleteFiles(fileName: string[], filePath?: string): Promise<void>;
  compressImage(
    bufferOrPath: Buffer | string,
    quality: number,
  ): Promise<Buffer>;
  compressImageMultiple(
    bufferOrPath: Buffer | string,
    qualities: number[],
  ): Promise<Array<{ quality: number; buffer: Buffer }>>;
}
