import { createError } from 'apollo-errors';

export const InvalidWriteAccessError = createError('InvalidWriteAccessError', {
  message: 'You are trying to add wrong fields',
});

export const InvalidReadAccessError = createError('InvalidReadAccessError', {
  message: 'You are trying to fetch wrong fields',
});

export const InvalidActionOnDefaultFieldsError = createError('InvalidActionOnDefaultFieldsError', {
  message: 'Update operation on default fields are not allowed',
});

export const UnauthorizedOperationError = createError('UnauthorizedOperationError', {
  message: 'Not authorized to perform the current operation',
});

export const BlockedOperationError = createError('BlockedOperationError', {
  message: 'You are not allowed to access here',
});

export const PermissionDeniedError = createError('PermissionDeniedError', {
  message: 'Permission denied!',
});

export const UserRolesNotFoundError = createError('UserRolesNotFoundError', {
  message: 'User roles not found.',
});
