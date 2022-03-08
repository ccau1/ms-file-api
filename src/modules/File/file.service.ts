import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileModel, File } from './interfaces/file';
import { FileSearchModel } from './models/file.search.model';
import { FileCreateModel } from './models/file.create.model';
import { FileUpdateModel } from './models/file.update.model';
import { PaginateOptions, PaginateResult } from 'mongoose';
import Buckets from './buckets';
import { User } from '../Auth/interfaces/user';
import BaseService from '../../core/layers/BaseService';
import { Readable } from 'stream';

@Injectable()
export class FileService extends BaseService<File> {
  constructor(
    @InjectModel('Files')
    private readonly fileRepository: FileModel,
  ) {
    super(fileRepository);
  }

  protected async castQuery(
    search: FileSearchModel,
    currentUser?: User,
  ): Promise<{ [key: string]: any }> {
    // initiate query's $and array
    const queryAnd = [];

    if (search._ids?.length) {
      queryAnd.push({
        //The $in operator selects the documents
        //where the value of a field equals any value in the specified array
        _id: { $in: search._ids },
      });
    }

    if (search.q) {
      // generate a regex version of q
      const qMatch = new RegExp(`${search.q}`, 'i');
      // search through all locale in names for this query search
      queryAnd.push({
        $or: [
          { name: qMatch },
          { bucketType: qMatch },
          { bucketFileName: qMatch },
          { bucketFilePath: qMatch },
          { originalFileName: qMatch },
          { extension: qMatch },
        ],
      });
    }

    if (search?.me) {
      if (!currentUser) {
        throw new BadRequestException(
          'cannot filter by me without current user',
        );
      }
      queryAnd.push({ createdBy: currentUser._id.toHexString() });
    }

    if (search.bucketTypes?.length) {
      queryAnd.push({ bucketType: { $in: search.bucketTypes } });
    }

    if (search.extensions?.length) {
      queryAnd.push({
        //The $in operator selects the documents
        //where the value of a field equals any value in the specified array
        extension: { $in: search.extensions },
      });
    }

    if (!isNaN(search.sizeMin)) {
      queryAnd.push({
        // look for size more than sizeMin
        size: { $gte: search.sizeMin },
      });
    }

    if (!isNaN(search.sizeMax)) {
      queryAnd.push({
        // look for size less than sizeMax
        size: { $lte: search.sizeMax },
      });
    }

    if (search.organizations?.length) {
      // look for organization in organizations
      queryAnd.push({
        organization: { $in: search.organizations },
      });
    }

    if (search.users?.length) {
      // look for createdBy in users
      queryAnd.push({
        createdBy: { $in: search.users },
      });
    }

    if (search.tags?.length) {
      // look for tags
      queryAnd.push({
        tags: { $in: search.tags },
      });
    }

    // return object optionally with $and field
    // $and performs a logical AND operation on an array and
    // selects the documents that satisfy all the expressions in the array
    return queryAnd.length ? { $and: queryAnd } : {};
  }

  public async find(
    search: FileSearchModel,
    paginate: PaginateOptions,
    populates: string[],
    currentUser?: User,
  ): Promise<PaginateResult<File>> {
    const q = await this.castQuery(search, currentUser);
    const paginateResult = await this.fileRepository.paginate(q, {
      ...paginate,
      lean: true,
    });
    if (populates) {
      paginateResult.docs = await this._populate(
        paginateResult.docs,
        populates,
      );
    }
    return paginateResult;
  }

  public async findOne(search: FileSearchModel): Promise<File> {
    const q = await this.castQuery(search);
    return this.fileRepository.findOne(q);
  }

  public async findById(_id: string): Promise<File> {
    return this.fileRepository.findById(_id);
  }

  public async create(createItem: FileCreateModel): Promise<File> {
    // create and return created obj
    return this.fileRepository.create(createItem);
  }

  public async createBatch(createItems: FileCreateModel[]): Promise<File[]> {
    // create and return created obj
    return this.fileRepository.insertMany(createItems);
  }

  public async update(_id: string, updateItem: FileUpdateModel): Promise<File> {
    // find by id and update, return new file
    return this.fileRepository.findByIdAndUpdate(_id, updateItem, {
      new: true,
    });
  }

  public async updateByIds(
    _ids: string[],
    updateItem: FileUpdateModel,
  ): Promise<File> {
    // find by id and update, return new file
    return this.fileRepository.updateMany({ _id: { $in: _ids } }, updateItem, {
      new: true,
    });
  }

  public async archive(_id: string, isArchived = true): Promise<File> {
    // find by id and update isArchived by param
    return this.fileRepository.findByIdAndUpdate(
      _id,
      { isArchived },
      { new: true },
    );
  }

  public async delete(_id: string) {
    // find file from db
    const file = await this.fileRepository.findById(_id);
    // if file not found, throw not found error
    if (!file) {
      throw new NotFoundException('file not found');
    }
    // remove from bucket
    await Buckets.buckets[file.bucketType].deleteFiles(
      file.compressions.map(c => c.bucketFileName),
      file.bucketFilePath,
    );
    // delete and return file
    return this.fileRepository.findByIdAndDelete(_id);
  }

  public async deleteMultiple(_ids: string[]) {
    // get file documents from db
    const files = await this.fileRepository.find({ _id: { $in: _ids } });
    // if files length not match, throw error
    if (files.length !== _ids.length) {
      const foundIds = files.map(f => f._id.toHexString());
      throw new NotFoundException(
        `the following files not found: ${_ids.filter(
          id => !foundIds.includes(id),
        )}`,
      );
    }
    // remove all from bucket
    for (const file of files) {
      await Buckets.buckets[file.bucketType].deleteFiles(
        file.compressions.map(c => c.bucketFileName),
        file.bucketFilePath,
      );
    }
    // remove from db
    await this.fileRepository.deleteMany({
      _id: { $in: files.map(f => f._id) },
    });
    // return removed files
    return files;
  }

  getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable();

    stream.push(buffer);
    stream.push(null);

    return stream;
  }
}
