import { createError } from 'apollo-errors';

export const InvalidSortFieldError = createError('InvalidSortFieldError', {
  message: 'Must contain proper field of sort',
});

export const InvalidFilterArgumentsError = createError('InvalidFilterArgumentsError', {
  message: 'Only one param in filter allowed, if more needed use AND/OR',
});

export const NotFilterRequiredError = createError('NotFilterRequiredError', {
  message: 'Must contain a not filter if two underscores used in filter key',
});

export const FetchError = createError('FetchError', {
  message: 'Error in Fetching Data From Database',
});

export const InvalidParamsError = createError('InvalidParamsError', {
  message: 'Invalid Params',
});

export const ConnectionAlreadyExistError = createError('ConnectionAlreadyExistError', {
  message: 'Connection cannot be done as connection already exist between the two given ids.',
});
export const ConnectionNotExistError = createError('ConnectionNotExistError', {
  message: 'Connection doesnt exist between two models.',
});
export const InvalidFieldType = createError('InvalidFieldType', {
  message: 'Field schema is invalid',
});
