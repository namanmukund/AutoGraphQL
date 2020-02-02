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

export const ChapterIsPublishedError = createError('ChapterIsPublishedError', {
  message: 'Can not perform the current operation as chapter is published',
});

export const TopicIsPublishedError = createError('TopicIsPublishedError', {
  message: 'Can not perform the current operation as topic is published',
});

export const VideoIsPublishedError = createError('VideoIsPublishedError', {
  message: 'Can not perform the current operation as video is published',
});

export const LearningObjectiveIsPublishedError = createError('LearningObjectiveIsPublishedError', {
  message: 'Can not perform the current operation as learning objective is published',
});

export const QuestionIsPublishedError = createError('QuestionIsPublishedError', {
  message: 'Can not perform the current operation as question is published',
});

export const MessageIsPublishedError = createError('MessageIsPublishedError', {
  message: 'Can not perform the current operation as message is published',
});

export const ComponentLockedError = createError('ComponentLockedError', {
  message: 'Component is locked',
});

export const OrderAlreadyExistsError = createError('OrderAlreadyExistsError', {
  message: 'Cannot perform the current operation as order already exists, order has to be unique',
});

export const TopicIdRequiredError = createError('TopicIdRequiredError', {
  message: 'Cannot perform the current operation as TopicConnectId is not provided',
});

export const ConnectIdRequiredError = createError('ConnectIdRequiredError', {
  message: 'Cannot perform the current operation as one of the mandatory connectId/connectIds is not provided',
});
