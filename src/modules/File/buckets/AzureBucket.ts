import {
  BlobServiceClient,
  ContainerClient,
  generateAccountSASQueryParameters,
  AccountSASPermissions,
  AccountSASResourceTypes,
  StorageSharedKeyCredential,
  AccountSASSignatureValues,
  AccountSASServices,
} from '@azure/storage-blob';
import { Readable } from 'stream';
import { getFileExtension, getFileName } from '../utils';
import BaseBucket from './BaseBucket';
import Jimp from 'jimp/es';

const account = process.env.AZURE_STORAGE_ACCOUNT;
const defaultContainerName = process.env.BUCKET_FILE_PATH_DEFAULT;
const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY;

class AzureBucket extends BaseBucket implements StorageBucket {
  protected sharedKeyCredential: StorageSharedKeyCredential;
  protected blobServiceClient: BlobServiceClient;
  protected container: ContainerClient;
  protected containerName: string;
  protected accountName: string;

  constructor() {
    super();
    this._setBlobServiceClient(account);
    this._setContainer(defaultContainerName);
  }

  protected _setBlobServiceClient(
    account: string,
    _accountKey: string = accountKey,
    // azureCredential: ChainedTokenCredential = new DefaultAzureCredential(),
  ) {
    this.accountName = account;
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      `DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${_accountKey};EndpointSuffix=core.windows.net`,
      // `BlobEndpoint=https://${account}.blob.core.windows.net;SharedAccessSignature=${sas};`,
    );
    this.sharedKeyCredential = new StorageSharedKeyCredential(
      account,
      accountKey,
    );
  }

  protected async _setContainer(containerName: string) {
    this.containerName = containerName;
    this.container = this.blobServiceClient.getContainerClient(containerName);
    if (!(await this.container.exists())) {
      await this.container.create({ access: 'blob' });
    }
  }

  protected getContainerByNameOrDefault(containerName?: string) {
    return containerName
      ? this.blobServiceClient.getContainerClient(containerName)
      : this.container;
  }

  public async getCommandProperties(
    type: 'create' | 'delete' | 'read' | 'update',
    bucketFilePath?: string,
  ) {
    // define SAS permissions
    const permissions = new AccountSASPermissions();
    switch (type) {
      case 'create':
        permissions.create = true;
        permissions.write = true;
        permissions.add = true;
        permissions.read = true;
        break;
      case 'delete':
        permissions.delete = true;
        break;
      case 'read':
        permissions.list = true;
        break;
      case 'update':
        permissions.update = true;
        break;
    }

    // define SAS services
    const services = new AccountSASServices();
    services.blob = true;

    // define SAS resource types
    const resourceTypes = new AccountSASResourceTypes();
    resourceTypes.container = true;
    resourceTypes.object = true;
    resourceTypes.service = true;

    const expiresOn = new Date(Date.now() + 300000);

    // define SAS signature values
    const sasSignatureVal: AccountSASSignatureValues = {
      // default to 1 minute
      expiresOn,
      services: services.toString(),
      permissions,
      resourceTypes: resourceTypes.toString(),
    };

    // generate sas
    const sas = generateAccountSASQueryParameters(
      sasSignatureVal,
      this.sharedKeyCredential,
    );

    // return sas as a string
    return {
      bucketType: 'azure',
      expiresOn,
      sas: sas.toString(),
      meta: {
        accountName: this.accountName,
        containerName: bucketFilePath || this.containerName,
      },
    };
  }

  public async uploadFileFromLocalFile(
    filePath: string,
    options?: UploadFileOptions,
  ): Promise<UploadFileResponse> {
    const opts = {
      ...options,
    };
    // if this is update but blobName was not passed, throw error
    // because can't update without identifier
    if (opts.isUpdate && !opts.blobName) {
      throw new Error('cannot update empty blobName');
    }
    // if blobName not defined, create our own blobName
    if (!opts.blobName) {
      // TODO: create unique blob name
      opts.blobName = `${this.containerName}-${Date.now()}-${Math.floor(
        Math.random() * 10000,
      )}`;
    }
    const blockBlobClient = this.container.getBlockBlobClient(opts.blobName);
    // if this is update but blob is not found, throw error
    if (opts.isUpdate && !blockBlobClient.exists()) {
      throw new Error('cannot find blob by blobName');
    }
    // if blob exists and this is not update
    if (blockBlobClient.exists() && !opts.isUpdate) {
      // this name already exists, create a unique version of it
    }
    // update file by stream
    const blobUploadResponse = await blockBlobClient.uploadFile(filePath);

    return {
      url: opts.blobName,
      bucketType: 'azure',
      bucketFileName: opts.blobName,
      compressions: [],
    };
  }

  public async uploadFileFromStream(
    buffer: Buffer,
    bufferSize: number,
    options?: UploadFileOptions,
  ): Promise<UploadFileResponse> {
    const opts = {
      qualities: [],
      ...options,
    };
    const container = this.getContainerByNameOrDefault(opts.bucketFilePath);
    // if this is update but blobName was not passed, throw error
    // because can't update without identifier
    if (opts.isUpdate && !opts.blobName) {
      throw new Error('cannot update empty blobName');
    }
    // if blobName not defined, create our own blobName
    if (!opts.blobName) {
      // TODO: create unique blob name
      opts.blobName = `${container.containerName}-${Date.now()}-${Math.floor(
        Math.random() * 10000,
      )}`;
    }
    const fileExtension = getFileExtension(opts.blobName);
    const fileName = getFileName(opts.blobName);
    // get blob by filename
    let blockBlobClient = container.getBlockBlobClient(opts.blobName);
    // if this is update but blob is not found, throw error
    if (opts.isUpdate && !blockBlobClient.exists()) {
      throw new Error('cannot find blob by blobName');
    }

    // if this is not isUpdate, keep doing this while blob name exists
    while ((await blockBlobClient.exists()) && !opts.isUpdate) {
      // this name already exists, create a unique version of it
      opts.blobName = `${fileName}-${Date.now()}${
        fileExtension ? `.${fileExtension}` : ''
      }`;
      // update blockBlobClient
      blockBlobClient = container.getBlockBlobClient(opts.blobName);
    }
    let fileMimeType = opts.mimeType;
    let qualityBuffers = [];
    // fetch all quality buffers to upload
    try {
      const jimpInstance = await Jimp.read(buffer);
      fileMimeType = jimpInstance.getMIME();
      // if buffer is image, get all compressed buffers
      // else leave empty array
      qualityBuffers = /^image/.test(fileMimeType)
        ? await this.compressImageMultiple(jimpInstance, [
            // define distinct list of quantities, excluding 100
            // because 100 will be added manually below
            ...new Set(opts.qualities.filter((q) => q !== 1)),
          ])
        : [];
    } catch (err) {}
    // add raw quality (100)
    qualityBuffers.unshift({ quality: 1, buffer });

    // upload each quality requested (including raw)
    const compressions: Array<UploadFileImageResponse> = [];
    for (const { quality, buffer: qualityBuffer } of qualityBuffers) {
      // create a Readable from Buffer
      const readable = new Readable();
      readable._read = () => null;
      readable.push(qualityBuffer);
      readable.push(null);

      // get fileName and fileExtension from blobName
      const fileName = getFileName(opts.blobName);
      const fileExtension = getFileExtension(opts.blobName);

      // define fileName based on quality (100 = original name)
      const qualityFileName = `${fileName}${
        quality === 1 ? '' : `@${quality > 1 ? quality : `${quality * 100}pc`}`
      }${fileExtension ? `.${fileExtension}` : ''}`;

      // get/create blob by the fileName
      blockBlobClient = container.getBlockBlobClient(qualityFileName);
      // upload using readable
      const blobUploadResponse = await blockBlobClient.uploadStream(
        readable,
        qualityBuffer.byteLength,
        5,
        {
          blobHTTPHeaders: {
            blobContentType: fileMimeType,
          },
        },
      );

      // add to compressions list
      compressions.push({
        quality,
        size: qualityBuffer.byteLength,
        // FIXME
        bucketFilePath: container.containerName,
        bucketFileName: qualityFileName,
        url: blockBlobClient.url.split('?')[0],
      });
    }

    // return url and its other image qualities
    return {
      url: compressions.find((img) => img.quality === 1).url,
      bucketType: 'azure',
      // bucketFilePath: opts.bucketFilePath,
      bucketFileName: opts.blobName,
      compressions,
    };
  }

  public async getFileToStream(blobName: string, containerName?: string) {
    // fetch blob from container by blobName
    // where container is either based on param's container name
    // or default's container
    const blobClient =
      this.getContainerByNameOrDefault(containerName).getBlobClient(blobName);
    // return blob as buffer
    return blobClient.downloadToBuffer();
  }

  public async deleteFile(blobName: string, containerName?: string) {
    // get the blob by blobName
    const blockBlobClient =
      this.getContainerByNameOrDefault(containerName).getBlockBlobClient(
        blobName,
      );
    // delete the file if exists
    await blockBlobClient.deleteIfExists();
  }

  public async deleteFiles(blobNames: string[], containerName?: string) {
    // go through each blob names
    for (const blobName of blobNames) {
      // delete them independently
      await this.deleteFile(blobName, containerName);
    }
  }
}

export default AzureBucket;
