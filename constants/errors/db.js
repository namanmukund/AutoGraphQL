import { createError } from 'apollo-errors';

export const DatabaseRecordNotFoundError = createError('DatabaseRecordNotFoundError', {
  message: 'Database record not found',
});

export const UserAlreadyExistsError = createError('UserAlreadyExistsError', {
  message: 'User already exist',
});

export const ConnectRecordsNotFoundInDBError = createError('ConnectRecordsNotFoundInDBError', {
  message: 'One or more records sent in Connect are not present in db',
});

export const AdditionalFieldUpdateDeniedError = createError('AdditionalFieldUpdateDeniedError', {
  message: 'No relation exists to update additionalRelationField',
});

export const FileWriteError = createError('FileWriteError', {
  message: 'File write could not happen',
});

export const DeleteChapterError = createError('DeleteChapterError', {
  message: 'Cannot delete Chapter as some Topics are published',
});

export const ChapterIsPublishedError = createError('ChapterIsPublishedError', {
  message: 'Cannot delete Chapter as Chapter is published',
});
export const ChapterTopicVideoIsPublishedError = createError('ChapterTopicVideoIsPublishedError', {
  message: 'Cannot delete Chapter as some Topic Videos are published',
});
export const ChapterTopicLoIsPublishedError = createError('ChapterTopicLoIsPublishedError', {
  message: 'Cannot delete Chapter as some Learning Objectives are published',
});
export const ChapterTopicLoMessageIsPublishedError = createError('ChapterTopicLoMessageIsPublishedError', {
  message: 'Cannot delete Chapter as some Learning Objective Messages are published',
});
export const ChapterTopicLoQuestionIsPublishedError = createError('ChapterTopicLoQuestionPublishedError', {
  message: 'Cannot delete Chapter as some Learning Objective Question Banks are published',
});
