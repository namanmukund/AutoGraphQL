// checks for particular error like invalid size or extension or both
const getFileSizeExtErrorName = (isValidSize, isValidExtension) => {
  let middlewareErrorType;
  if (!isValidSize && isValidExtension) {
    middlewareErrorType = 'InvalidFileUploadSizeError';
  } else if (isValidSize && !isValidExtension) {
    middlewareErrorType = 'InvalidFileUploadExtensionError';
  } else {
    middlewareErrorType = 'InvalidFileUploadSizeAndExtensionError';
  }
  return middlewareErrorType;
};

export default getFileSizeExtErrorName;
