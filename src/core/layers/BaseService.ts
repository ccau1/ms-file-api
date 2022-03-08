import { Model, PaginateModel, Document } from 'mongoose';

type Repository<Doc extends Document> =
  | Model<Doc>
  | PaginateModel<Doc>
  | { [field: string]: any };

export default class BaseService<Doc extends Document> {
  protected repository: Repository<Doc>;
  constructor(repository: Repository<Doc>) {
    this.repository = repository;
  }

  protected async _populate(docs: any, populates: string[]) {
    return docs;
  }

  protected async generateSlug(
    text: string,
    options?: { requireUniqueSlug?: boolean; dbField?: string },
  ): Promise<string> {
    const opts = {
      dbField: 'slug',
      ...options,
    };
    const slug = text
      .toString()
      .toLowerCase() //Create URL-Friendly String
      .trim()
      .replace(/[\s_]+/g, '-') // Replace spaces and underscore with -
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\d\-]+/, '') // Remove all special characters
      .replace(/[\-]+/g, '-'); // Replace multiple - with single -

    if (!opts.requireUniqueSlug) {
      return slug;
    } else {
      //Retrieve the result with the largest number
      const existingSlug = await this.repository
        .findOne({ [opts.dbField]: new RegExp(`^${slug}(-([0-9]+))?$`, 'i') })
        .sort({ [opts.dbField]: -1 });
      if (!existingSlug) {
        return slug;
      } else {
        const regex = new RegExp(`^${slug}(-([0-9]+))?$`, 'i');
        //An array with the text, -numbers and numbers
        //Ex: existingSlug.slug = "abc-123"
        //    existingSlugMatched = ["abc", "-123", "123"]
        const existingSlugMatched = existingSlug[opts.dbField].match(regex);

        // Check if there are numbers after the text ("123")
        if (existingSlugMatched && !isNaN(parseInt(existingSlugMatched[2]))) {
          // If yes, add 1 to the number (123 => 124)
          const slugify = `${slug}-${parseInt(existingSlugMatched[2], 10) + 1}`;
          return slugify;
        } else {
          // Otherwise, assign a number (-1)
          return `${slug}-1`;
        }
      }
    }
  }
}
