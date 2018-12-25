import { sampleSize } from 'lodash';

const createRandomString = (length) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  const pwd = sampleSize(chars, length || 12);
  return pwd.join('');
};

export default createRandomString;
