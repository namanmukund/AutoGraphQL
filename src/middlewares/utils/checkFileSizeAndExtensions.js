import { includes } from 'lodash';
import { fileSizeLimitInMB, fileExtensions } from '../../../constants';

const checkFileSizeAndExtensions = (fileType, size, ext) => {
  const {
    image: imageSizeLimit,
    audio: audioSizeLimit,
    video: videoSizeLimit,
    excel: excelSizeLimit,
  } = fileSizeLimitInMB;
  const { imageExtensions, audioExtensions, videoExtensions, excelExtensions } = fileExtensions;
  const doc = {};
  doc.isValidSize = false;
  doc.isValidExtension = false;
  const caseInsensitiveExt = ext.toLowerCase();
  switch (fileType) {
    case 'image': {
      if (size <= (imageSizeLimit * 1024 * 1024)) {
        doc.isValidSize = true;
      }
      if (includes(imageExtensions, caseInsensitiveExt)) {
        doc.isValidExtension = true;
      }
      break;
    }
    case 'audio': {
      if (size <= (audioSizeLimit * 1024 * 1024)) {
        doc.isValidSize = true;
      }
      if (includes(audioExtensions, caseInsensitiveExt)) {
        doc.isValidExtension = true;
      }
      break;
    }
    case 'video': {
      if (size <= (videoSizeLimit * 1024 * 1024)) {
        doc.isValidSize = true;
      }
      if (includes(videoExtensions, caseInsensitiveExt)) {
        doc.isValidExtension = true;
      }
      break;
    }
    case 'excel': {
      if (size <= (excelSizeLimit * 1024 * 1024)) {
        doc.isValidSize = true;
      }
      if (includes(excelExtensions, caseInsensitiveExt)) {
        doc.isValidExtension = true;
      }
      break;
    }
    default:
  }
  return doc;
};

export default checkFileSizeAndExtensions;
