import { createError } from 'apollo-errors';

export const FileUploadError = createError('FileUploadError', {
  message: 'Error in File Upload',
});

export const InvalidFileUploadSizeError = createError('InvalidFileUploadSizeError', {
  message: 'Invalid file size is provided for file upload',
});

export const InvalidFileUploadExtensionError = createError('InvalidFileUploadExtensionError', {
  message: 'Invalid file extension is provided for file upload',
});

export const InvalidFileUploadSizeAndExtensionError = createError('InvalidFileUploadSizeAndExtensionError', {
  message: 'Invalid file size and extension is provided for file upload',
});

export const FileUsageCountNotZeroError = createError('FileUsageCountNotZeroError', {
  message: 'The file can not be deleted as its usage count is not zero',
});
