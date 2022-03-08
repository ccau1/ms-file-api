import { TransformFnParams } from 'class-transformer';

export default ({ obj, key }: TransformFnParams) => {
  return obj[key] === '' || obj[key].toString().toLowerCase() === 'true'
    ? true
    : false;
};
