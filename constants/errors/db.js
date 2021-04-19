import { createError } from 'apollo-errors';

export const DatabaseRecordNotFoundError = createError('DatabaseRecordNotFoundError', {
  message: 'Database record not found',
});

export const UserAlreadyExistsError = createError('UserAlreadyExistsError', {
  message: 'User already exist',
});

export const EmailOrPhoneMismatchError = createError('EmailOrPhoneMismatchError', {
  message: 'To add a sibling parent must use the same email and phone number that was used to register the first kid',
});

export const ChildAlreadyRegisteredError = createError('ChildAlreadyRegisteredError', {
  message: 'A child is already registered with the above credentials. You can login to continue.',
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

export const ApprovedCodeTagIsAddedToCodeError = createError('ApprovedCodeTagIsAddedToCodeError', {
  message: 'Cannot delete as Tag is added to some Approved Code',
});

export const MessageIsPublishedError = createError('MessageIsPublishedError', {
  message: 'Can not perform the current operation as message is published',
});

export const BannerIsPublishedError = createError('BannerIsPublishedError', {
  message: 'Can not perform the current operation as banner is published',
});

export const BannerExistsError = createError('BannerExistsError', {
  message: 'Cannot perform the current operation as banner with similar type already published',
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

export const PaidComponentLockedError = createError('PaidComponentLockedError', {
  message: 'Component is not free',
});

export const SendOtpFirstError = createError('SendOtpFirstError', {
  message: 'Send otp via login first',
});

export const SimilarDocumentAlreadyExistError = createError('SimilarDocumentAlreadyExistError', {
  message: 'Similar document has already been added from before',
});

export const PastDateOrSlotError = createError('PastDateOrSlotError', {
  message: 'Can not delete as either date or slot is of past',
});

export const NoSlotsAvailableForBooking = createError('NoSlotsAvailableForBooking', {
  message: 'No slot is available for booking',
});

export const WorkbookIsPublished = createError('WorkbookIsPublished', {
  message: 'Can not perform the current operation as workbook is published',
});

export const ProjectIsPublishedError = createError('ProjectIsPublishedError', {
  message: 'Can not perform the current operation as project is published',
});

export const CheatSheetIsPublishedError = createError('CheatSheetIsPublishedError', {
  message: 'Can not perform the current operation as cheatSheet is published',
});

export const OtherDiscountAlreadySetToDefault = createError('OtherDiscountAlreadySetToDefault', {
  message: 'Cannot set discount as default as another discount is already set to default',
});

export const ProductTypeAlreadyAdded = createError('ProductTypeAlreadyAdded', {
  message: 'Cannot perform the current operation as product with similar type already published',
});

export const ProductIsPublishedError = createError('ProductIsPublishedError', {
  message: 'Cannot perform the current operation as product is published',
});

export const ProductWithSimilarTypeAlreadyPublished = createError('ProductWithSimilarTypeAlreadyPublished', {
  message: 'Product with similar type already published',
});

export const AlreadyBookmarkedOtherCheatSheet = createError('AlreadyBookmarkedOtherCheatSheet', {
  message: 'Already bookmarked other cheatsheet.',
});

export const AlreadyBookmarkedCheatSheet = createError('AlreadyBookmarkedCheatSheet', {
  message: 'Already bookmarked this cheatsheet',
});
