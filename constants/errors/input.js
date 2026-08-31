import { createError } from 'apollo-errors';

export const EitherEmailOrPhoneRequiredError = createError('EitherEmailOrPhoneRequiredError', {
  message: 'Either email or phone is mandatory',
});

export const EitherEmailOrPhoneNotBothRequiredError = createError('EitherEmailOrPhoneNotBothRequiredError', {
  message: 'Provide either email or phone and not both',
});

export const InvalidEmailError = createError('InvalidEmailError', {
  message: 'Invalid email address',
});

export const InvalidPhoneError = createError('InvalidPhoneError', {
  message: 'Invalid phone number',
});

export const EitherUsernameEmailOrPhoneRequiredError = createError('EitherUsernameEmailOrPhoneRequiredError', {
  message: 'Either of username, email, or phone is mandatory for authentication',
});

export const InvalidNameError = createError('InvalidNameError', {
  message: 'Name must start with an alphabet and contain alphanumeric characters with spaces',
});

export const InvalidNameLengthError = createError('InvalidNameLengthError', {
  message: 'Name must be between 3 and 30 characters in length',
});

export const InvalidUsernameError = createError('InvalidUsernameError', {
  message: 'Username must start with an alphabet and contain alphanumeric characters, dots, or underscores',
});

export const InvalidUsernameLengthError = createError('InvalidUsernameLengthError', {
  message: 'Username must be between 3 and 30 characters in length',
});

export const InvalidPasswordLengthError = createError('InvalidPasswordLengthError', {
  message: 'Password must be at least 6 characters in length',
});

export const PhoneNumberAndCountryCodeRequiredError = createError('PhoneNumberAndCountryCodeRequiredError', {
  message: 'Both country code and phone number are mandatory',
});

export const EitherPhoneOrEmailOtpRequiredError = createError('EitherPhoneOrEmailOtpRequiredError', {
  message: 'Either phoneOtp or emailOtp is mandatory',
});

export const ConnectIdsAlreadyRelatedError = createError('ConnectIdsAlreadyRelatedError', {
  message: 'Connect IDs provided are already connected to this record',
});

export const DuplicateConnectIdsError = createError('DuplicateConnectIdsError', {
  message: 'Duplicate connect IDs sent in input',
});

export const UserMismatchError = createError('UserMismatchError', {
  message: 'User ID provided does not match the authenticated user',
});

export const UnauthorizedFieldOrTypeAccessByAppError = createError('UnauthorizedFieldAccessByAppError', {
  message: 'Application is not authorized to access requested fields or types',
});

export const InsufficientPermissionError = createError('InsufficientPermissionError', {
  message: 'Insufficient permissions to perform this operation',
});

export const MissingMandatoryInputInRequestError = createError('MissingMandatoryInputInRequestError', {
  message: 'One or more mandatory input fields are missing in request',
});

export const InvalidTimeError = createError('InvalidTimeError', {
  message: 'Time must be in the future',
});

export const InvalidDateError = createError('InvalidDateError', {
  message: 'Date cannot be in the past',
});

export const EmailNotVerifiedError = createError('EmailNotVerifiedError', {
  message: 'Email address is not verified',
});

export const PhoneNotVerifiedError = createError('PhoneNotVerifiedError', {
  message: 'Phone number is not verified',
});
