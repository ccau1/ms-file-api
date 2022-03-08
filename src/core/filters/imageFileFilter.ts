import { BadRequestException } from '@nestjs/common';

export const imageFileFilter = (
  extensions: string[] = ['jpg', 'jpeg', 'png', 'gif'],
  errorMessage = 'Only image files are allowed!',
) => (req, file, callback) => {
  if (
    !file.originalname.match(new RegExp(`\.(${extensions.join('|')})$`, 'i'))
  ) {
    return callback(new BadRequestException(errorMessage), false);
  }
  callback(null, true);
};
