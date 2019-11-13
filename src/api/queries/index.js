import {
  getfileNameWhichArePresent, fileAddQuery, getFilesListQuery,
  getAllfilesQuery,
} from './file';
import {
  genericFilterQueryToGetIds, genericApiToFetchRelatedObjectQueryBasedOnTypeId,
  genericSkipFirstQuery, genericFilterQuery,
} from './genericQueries';
import { getUpdateUserMutation } from './user';

export {
  getfileNameWhichArePresent,
  genericFilterQueryToGetIds,
  fileAddQuery,
  getFilesListQuery,
  getAllfilesQuery,
  genericApiToFetchRelatedObjectQueryBasedOnTypeId,
  genericSkipFirstQuery,
  getUpdateUserMutation,
  genericFilterQuery,
};
