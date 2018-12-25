import { includes } from 'lodash';

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
  } else {
    // if invalid fileType then graphql will give the required error
    fileType = '';
  }
  return fileType;
};

export default getFileTypeName;
