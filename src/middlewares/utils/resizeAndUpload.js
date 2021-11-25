import im from 'imagemagick';
import { resizePicDimensions } from '../../../constants';
import { log } from '../../../utils';
import { uploadToS3 } from './uploadToS3';
import generateFileNameForResizedImage from './generateFileNameForResizedImage';

const resizeAndUpload = (fileTypeName, name, fileContent, fileKind, path, fileMimeType = null) => {
  // upload normal size file to s3
  uploadToS3(path, fileContent, fileMimeType);
  // if resize dimension is given upload file according to that size
  if (resizePicDimensions[fileKind] && fileTypeName === 'image') {
    const resizePicKeys = Object.keys(resizePicDimensions[fileKind]);
    resizePicKeys.forEach((key) => {
      const doc = {};
      doc.srcData = fileContent;
      const { width, height } = resizePicDimensions[fileKind][key];
      if (width) {
        doc.width = width;
      }
      // if height is not available it will use aspect ratio for resizing
      if (height) {
        doc.height = height;
      }
      const newPath = generateFileNameForResizedImage(fileKind, name, key);
      im.resize(doc, (err, stdout) => {
        if (err) log(err);

        const newFileContent = (Buffer.isBuffer(stdout) ? stdout : new Buffer(stdout, 'binary'));
        uploadToS3(newPath, newFileContent);
      });
    });
  }
};

export default resizeAndUpload;
