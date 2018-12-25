// Check middleware errors
import {
  FileUploadError,
  InvalidFileUploadExtensionError,
  InvalidFileUploadSizeAndExtensionError,
  InvalidFileUploadSizeError,
  InvalidStaticToken,
  UnauthenticatedAppError,
  UnauthenticatedUserError,
} from '../../../../../constants/errors';
import { fileExtensions, fileSizeLimitInMB } from '../../../../../constants';

const checkMiddlewareErrors = (middlewareErrorType, middlewareErrorMessage) => {
  if (middlewareErrorType) {
    switch (middlewareErrorType) {
      case 'FileUploadError':
        throw new FileUploadError();
      case 'InvalidFileUploadSizeError':
        throw new InvalidFileUploadSizeError({ data: { message: `Only allowed size in mb: ${fileSizeLimitInMB}` } });
      case 'InvalidFileUploadExtensionError':
        throw new InvalidFileUploadExtensionError({ data: { message: `Only allowed extensions:  ${fileExtensions}` } });
      case 'InvalidFileUploadSizeAndExtensionError':
        throw new InvalidFileUploadSizeAndExtensionError({ data: { message: `Only allowed size in mb and extesnsions :${fileSizeLimitInMB}`,
          fileExtensions } });
      case 'InvalidStaticToken':
        throw new InvalidStaticToken();
      case 'UnauthenticatedAppError':
        throw new UnauthenticatedAppError();
      case 'UnauthenticatedUserError':
        throw new UnauthenticatedUserError();
      default:
        throw new Error({
          data: {
            message: middlewareErrorMessage,
          },
        },
        );
    }
  }
};

export default checkMiddlewareErrors;
