import { resizePicDimensions } from '../../../constants';
import { log } from '../../../utils';
import { uploadToS3 } from './uploadToS3';
import generateFileNameForResizedImage from './generateFileNameForResizedImage';

const resizeAndUpload = (fileTypeName, name, fileContent, fileKind, path, fileMimeType = null) => {
  // upload normal size file to s3/storage
  uploadToS3(path, fileContent, fileMimeType);
};

export default resizeAndUpload;
