import { createError } from 'apollo-errors';

export const DatabaseRecordNotFoundError = createError('DatabaseRecordNotFoundError', {
  message: 'Database record not found',
});

export const FileUploadConnectionFailedError = createError('FileUploadConnectionFailedError', {
  message: 'File uploaded but connection failed due to target record not found',
});

export const UserAlreadyExistsError = createError('UserAlreadyExistsError', {
  message: 'User already exists',
});

export const ConnectRecordsNotFoundInDBError = createError('ConnectRecordsNotFoundInDBError', {
  message: 'One or more records sent in Connect are not present in database',
});

export const AdditionalFieldUpdateDeniedError = createError('AdditionalFieldUpdateDeniedError', {
  message: 'No relation exists to update additionalRelationField',
});

export const FileWriteError = createError('FileWriteError', {
  message: 'File write operation failed',
});

export const OrderAlreadyExistsError = createError('OrderAlreadyExistsError', {
  message: 'Cannot perform the current operation as order already exists; order must be unique',
});

export const ConnectIdRequiredError = createError('ConnectIdRequiredError', {
  message: 'Cannot perform the current operation as mandatory connectId/connectIds is not provided',
});

export const SendOtpFirstError = createError('SendOtpFirstError', {
  message: 'Please send and verify OTP first',
});

export const SimilarDocumentAlreadyExistError = createError('SimilarDocumentAlreadyExistError', {
  message: 'A similar record already exists in the database',
});

export const FileNameAlreadyExists = createError('FileNameAlreadyExists', {
  message: 'File with similar name already exists',
});

export const CategoryAlreadyExist = createError('CategoryAlreadyExist', {
  message: 'Category with similar name already exists',
});

export const UserWithSimilarUsernameAlreadyExist = createError('UserWithSimilarUsernameAlreadyExist', {
  message: 'User with similar username already exists',
});

export const UserWithSimilarEmailAlreadyExist = createError('UserWithSimilarEmailAlreadyExist', {
  message: 'User with similar email already exists',
});

export const UserWithSimilarNumberAlreadyExist = createError('UserWithSimilarNumberAlreadyExist', {
  message: 'User with similar phone number already exists',
});
