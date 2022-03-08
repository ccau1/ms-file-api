import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Put,
  UseGuards,
  UseInterceptors,
  Delete,
  UploadedFiles,
  BadRequestException,
  Headers,
  NotFoundException,
  Response,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { FileSearchModel } from './models/file.search.model';
import { FileUpdateModel } from './models/file.update.model';
import { AuthGuard } from '../Auth/user.auth.guard';
import extractPaginate from 'src/core/mongo/extractPaginate';
import { LocaleInterceptor } from 'src/core/interceptors/LocaleInterceptor';
import { CurrentUser } from 'src/core/decorators/currentUser.decorator';
import { User } from '../Auth/interfaces/user';
import { ParseFormDataInterceptor } from '../../core/interceptors/ParseFormDataInterceptor';
import bucketManager from './buckets';
import { getFileExtension } from './utils';
import { FileCreateWithFileDTOModel } from './models/file.createWithFile.dto.model';
import { FileSDK } from '@oodles-dev/file-sdk';
import { FileCreateModel } from './models/file.create.model';
import { FileCreatePlainDTOModel } from './models/file.createPlain.dto.model';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  @UseInterceptors(LocaleInterceptor)
  @UseGuards(AuthGuard({ optional: true }))
  public async find(
    @Query() query: FileSearchModel,
    @CurrentUser() currentUser: User,
  ) {
    console.log('get currentUser', currentUser);

    const materialCategories = await this.fileService.find(
      query,
      extractPaginate(query),
      query.populates,
      currentUser,
    );
    return materialCategories;
  }

  @Get(':_id/stream')
  @UseInterceptors(LocaleInterceptor)
  @UseGuards(AuthGuard({ optional: true }))
  public async findFileById(
    @Param('_id') _id: string,
    @Query('quality') quality = 1,
    @Response() res,
  ) {
    const file = await this.fileService.findById(_id);
    if (!file) {
      throw new NotFoundException('file not found');
    }
    const fileImage = file.toJSON().compressions.find(img => {
      return img.quality === quality;
    });

    if (!fileImage) {
      throw new BadRequestException(`file quality '${quality}' not found`);
    }

    const bucket = bucketManager.buckets[file.bucketType];

    const fileStream = await bucket.getFileToStream(
      fileImage.bucketFileName,
      fileImage.bucketFilePath,
    );

    // return fileStream;
    const stream = this.fileService.getReadableStream(fileStream);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': fileStream.length,
    });

    stream.pipe(res);
  }

  @Get(':_id')
  @UseInterceptors(LocaleInterceptor)
  @UseGuards(AuthGuard({ optional: true }))
  public async findById(@Param('_id') _id: string) {
    const pJ = await this.fileService.findById(_id);
    return pJ;
  }

  @Get('token/:type')
  @UseGuards(AuthGuard())
  public async getUploadToken(
    @Param('type') type: string,
    @Query('bucketType') _bucketType: string,
    @Query('filePath') _filePath: string,
  ) {
    // define bucketType and bucket based on param or default
    const bucketType =
      _bucketType !== undefined ? _bucketType : bucketManager.defaultBucketType;
    const filePath =
      _filePath !== undefined ? _filePath : bucketManager.defaultBucketType;
    const bucket = bucketManager.buckets[bucketType];

    // return created token based on type
    return bucket.getCommandProperties(type, filePath);
  }

  @Post('test-sdk')
  @UseGuards(AuthGuard())
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  public async createTest(
    @UploadedFiles() files,
    @Body() body: FileCreateWithFileDTOModel,
    @CurrentUser() currentUser: User,
    @Headers('authorization') headerAuthorization: string,
  ) {
    // get file from formData
    const file = files.file?.[0];
    // if file not found, throw error
    if (!file) {
      throw new BadRequestException('file not given');
    }
    const { buffer, size, mimetype, originalname } = file;
    const createdFile = (
      await new FileSDK({
        headerAuthorization,
      })
    ).uploadFileFromStream(buffer, size, {
      qualities: body.qualities,
      blobName: originalname,
      mimeType: mimetype,
      isArchived: body.isArchived,
      organization: body.organization?.toHexString(),
      bucketFilePath: body.bucketFilePath,
      bucketType: body.bucketType,
      createdBy: currentUser._id.toHexString(),
    });

    return createdFile;
  }

  @Post()
  @UseGuards(AuthGuard())
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  public async create(
    @UploadedFiles() files,
    @Body() body: FileCreateWithFileDTOModel,
    @CurrentUser() currentUser: User,
  ) {
    // get file from formData
    const file = files?.file?.[0];
    // if file not found, throw error
    if (!file) {
      throw new BadRequestException('file not given');
    }
    // extract fields from file
    const { originalname, mimetype, buffer, size } = file;

    // define bucketType and bucket based on param or default
    const bucketType = body.bucketType || bucketManager.defaultBucketType;
    const bucket = bucketManager.buckets[bucketType];

    // if bucket is not found, throw bad request
    if (!bucket) {
      throw new BadRequestException(
        `bucket type '${bucketType}' cannot be found`,
      );
    }

    const bucketFilePath =
      body.bucketFilePath || process.env.BUCKET_FILE_PATH_DEFAULT;

    // upload file to bucket, along with files of reduced qualities
    const uploadResult = await bucket.uploadFileFromStream(buffer, size, {
      blobName: originalname,
      qualities: body.qualities,
      bucketFilePath,
      mimeType: mimetype,
    });

    // get file extension string
    const fileExtension = getFileExtension(originalname);

    // create and return file document
    return this.fileService.create({
      ...body,
      mimeType: mimetype,
      originalFileName: originalname,
      extension: fileExtension,
      createdBy: currentUser._id,
      bucketType: uploadResult.bucketType,
      bucketFilePath,
      bucketFileName: uploadResult.bucketFileName,
      url: uploadResult.url,
      compressions: uploadResult.compressions,
      size,
      // if any compressions present, get the one with lowest quality
      // as thumbnail
      thumbnailUrl: uploadResult.compressions.length
        ? uploadResult.compressions.sort((a, b) => a.quality - b.quality)[0].url
        : uploadResult.url,
    });
  }

  @Post('plain')
  @UseGuards(AuthGuard())
  public async createPlain(
    @Body() body: FileCreatePlainDTOModel,
    @CurrentUser() currentUser: User,
  ) {
    return this.fileService.create({ ...body, createdBy: currentUser._id });
  }

  @Post('plain/batch')
  @UseGuards(AuthGuard())
  public async createPlainBatch(@Body() body: FileCreateModel[]) {
    return this.fileService.createBatch(body);
  }

  @Put('batch')
  @UseGuards(AuthGuard())
  public async updateMultiple(
    @Query('_ids') _ids: string[],
    @Body() body: FileUpdateModel,
  ) {
    return this.fileService.updateByIds(_ids, body);
  }

  @Put(':_id')
  @UseGuards(AuthGuard())
  public async update(
    @Param('_id') _id: string,
    @Body() body: FileUpdateModel,
  ) {
    return this.fileService.update(_id, body);
  }

  @Put(':_id/archive')
  @UseGuards(AuthGuard())
  public async archive(
    @Param('_id') _id: string,
    @Query('isArchived') isArchived?: boolean,
  ) {
    return this.fileService.archive(_id, isArchived);
  }

  @Delete()
  @UseGuards(AuthGuard())
  public async deleteMultiple(@Query('_ids') _ids: string[]) {
    return this.fileService.deleteMultiple(_ids);
  }

  @Delete(':_id')
  @UseGuards(AuthGuard())
  public async delete(@Param('_id') _id: string) {
    return this.fileService.delete(_id);
  }
}
