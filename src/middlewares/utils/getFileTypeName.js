import { includes } from 'lodash';
import { log } from '../../../utils';

const getFileTypeName = (type) => {
  let fileType;
  if (includes(type, 'image')) {
    fileType = 'image';
  } else if (includes(type, 'audio')) {
    fileType = 'audio';
  } else if (includes(type, 'video')) {
    fileType = 'video';
  } else if (includes(type, 'sheet') || includes(type, 'excel')) {
    fileType = 'excel';
  } else if (includes(type, 'octet-stream')) {
    // if invalid fileType then graphql will give the required error
    fileType = 'subtitle';
  } else if (includes(type, 'json')) {
    // if invalid fileType then graphql will give the required error
    fileType = 'lottie';
  } else {
    log('File Type is not defined');
    fileType = '';
  }
  return fileType;
};

export default getFileTypeName;
