import { createError } from 'apollo-errors';

export const EitherEmailOrPhoneRequiredError = createError('EitherEmailOrPhoneRequiredError', {
  message: 'Either email or phone is mandatory here',
});

export const EmailNotVerifiedError = createError('EmailNotVerifiedError', {
  message: 'Provided email is not verified',
});

export const PhoneNotVerifiedError = createError('PhoneNotVerifiedError', {
  message: 'Provided phone number is not verified',
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
  message: 'Either of username, email or phone is mandatory for login',
});

export const InvalidNameError = createError('InvalidNameError', {
  message: 'Only name starting with alphabet and containing alphanumeric characters with spaces are allowed',
});

export const InvalidNameLengthError = createError('InvalidNameLengthError', {
  message: 'The name should be more than 3 and less than 30 characters in length',
});

export const InvalidUsernameError = createError('InvalidUsernameError', {
  message: 'Only username starting with alphabet and containing alphanumeric characters with . and _ are allowed',
});

export const InvalidUsernameLengthError = createError('InvalidUsernameLengthError', {
  message: 'The username should be more than 3 and less than 30 characters in length',
});

export const PhoneNumberAndCountryCodeRequiredError = createError('PhoneNumberAndCountryCodeRequiredError', {
  message: 'Both country code and phone number is mandatory',
});

export const EitherPhoneOrEmailOtpRequiredError = createError('EitherPhoneOrEmailOtpRequiredError', {
  message: 'Either of phoneOtp or emailOtp field is mandatory',
});

export const ConnectIdsAlreadyRelatedError = createError('ConnectIdsAlreadyRelatedError', {
  message: 'Connect Ids sent in input have already been connected to the type',
});

export const DuplicateConnectIdsError = createError('DuplicateConnectIdsError', {
  message: 'Duplicate connect ids sent in input',
});

export const UnauthorizedFieldOrTypeAccessByAppError = createError('UnauthorizedFieldAccessByAppError', {
  message: 'App is not authorized to access some of the fields or types',
});
