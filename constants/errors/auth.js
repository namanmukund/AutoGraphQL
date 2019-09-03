import { createError } from 'apollo-errors';

export const UserTokenNotRequiredError = createError('UserTokenNotRequiredError', {
  message: 'The current request does not require any user token',
});

export const UnknownUserError = createError('UnknownUserError', {
  message: 'No user found with that username',
});

export const PasswordMismatchError = createError('PasswordMismatchError', {
  message: 'Incorrect password',
});

export const OTPMismatchError = createError('OTPMismatchError', {
  message: 'Incorrect otp provided',
});

export const UnauthenticatedUserError = createError('UnauthenticatedUserError', {
  message: 'User is not authenticated',
});

export const UnauthenticatedAppError = createError('UnauthenticatedAppError', {
  message: 'App is not authenticated',
});

export const AlreadyActiveUser = createError('AlreadyActiveUser', {
  message: 'User is already active',
});
export const UserPasswordAlreadySetError = createError('UserPasswordAlreadySetError', {
  message: 'User password is already set',
});
export const UserPasswordNotSetError = createError('UserPasswordNotSetError', {
  message: 'User password is not set',
});
export const AlreadySubscribedError = createError('AlreadySubscribedError', {
  message: 'User is already subscribed',
});
export const AppTokenNotRequiredError = createError('AppTokenNotRequiredError', {
  message: 'The current request does not require any app token',
});
export const InvalidApplicationNameError = createError('InvalidApplicationNameError', {
  message: 'Wrong application name is provided',
});
export const InvalidStaticToken = createError('InvalidStaticToken', {
  message: 'Invalid static token is provided',
});

export const MandatoryFieldNotSetError = createError('MandatoryFieldNotSetError', {
  message: 'Mandatory field is not provided',
});

export const InvalidToken = createError('InvalidToken', {
  message: 'User Token is invalid.',
});
