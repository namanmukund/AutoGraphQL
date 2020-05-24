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

export const InvalidPasswordLengthError = createError('InvalidPasswordLengthError', {
  message: 'Password must be at least 6 characters',
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

export const UserOrCourseNotPresentError = createError('UserOrCourseNotPresentError', {
  message: 'User or course id is missing in input',
});

export const TopicOrLONotPresentError = createError('TopicOrLONotPresentError', {
  message: 'Topic or learning objective id is missing in input',
});

export const TopicOrUserCurrentTopicComponentNotPresentError = createError('TopicOrUserCurrentTopicComponentNotPresentError', {
  message: 'Topic or UserCurrentTopicComponent id is missing in input',
});

export const UserOrLearningObjectiveNotPresentError = createError('UserOrLearningObjectiveNotPresentError', {
  message: 'User or learning objective id is missing in input',
});

export const UserOrTopicNotPresentError = createError('UserOrTopicNotPresentError', {
  message: 'User or topic id is missing in input',
});

export const PracticeQuestionsNotPresentError = createError('PracticeQuestionsNotPresentError', {
  message: 'PracticeQuestions are missing in input',
});

export const QuizQuestionsNotPresentError = createError('QuizQuestionsNotPresentError', {
  message: 'QuizQuestions are missing in input',
});

export const UserMismatchError = createError('UserMismatchError', {
  message: 'User id passed in input does not belong to logged in user',
});

export const UnauthorizedFieldOrTypeAccessByAppError = createError('UnauthorizedFieldAccessByAppError', {
  message: 'App is not authorized to access some of the fields or types',
});

export const InsufficientPermissionError = createError('InsufficientPermissionError', {
  message: 'Insufficient permission error',
});

export const InvalidGmailTokenError = createError('InvalidGmailTokenError', {
  message: 'Invalid gmail token error',
});

export const InvalidFacebookTokenError = createError('InvalidFacebookTokenError', {
  message: 'Invalid facebook token error',
});

export const AssignmentQuestionsNotPresentError = createError('AssignmentQuestionsNotPresentError', {
  message: 'AssignmentQuestions are missing in input',
});

export const SessionTopicAndTopicConnectIdMismatchError = createError('SessionTopicAndTopicConnectIdMismatchError', {
  message: 'Invalid topicConnectId sent in input',
});

export const InvalidSessionDateTimeError = createError('InvalidSessionDateTimeError', {
  message: 'Invalid session date or time',
});

export const MissingMandatoryInputInRequestError = createError('MissingMandatoryInputInRequestError', {
  message: 'One or more than one input is missing in request',
});

export const InvalidTimeError = createError('InvalidTimeError', {
  message: 'Time has to be more than current time',
});

export const InvalidDateError = createError('InvalidDateError', {
  message: 'Date can not be less than current date',
});

export const NoSlotSelectedError = createError('NoSlotSelectedError', {
  message: 'No slot is selected in input',
});

export const OnlyOneSlotAllowedError = createError('OnlyOneSlotAllowedError', {
  message: 'Only one slot can be selected in a day',
});

export const NameFieldRequiredError = createError('NameFieldRequiredError', {
  message: 'Name field is mandatory in input',
});

export const PhoneFieldRequiredError = createError('PhoneFieldRequiredError', {
  message: 'Phone field is mandatory in input',
});

export const PasswordFieldRequiredError = createError('PasswordFieldRequiredError', {
  message: 'Password field is mandatory in input',
});

export const ProductIdNotPresentError = createError('ProductIdNotPresentError', {
  message: 'Product Id is missing in input',
});

export const TransactionIdNotPresentError = createError('TransactionIdNotPresentError', {
  message: 'Transaction Id is missing in input',
});

export const HashOrStatusNotPresentError = createError('HashOrStatusNotPresentError', {
  message: 'Hash is missing in input',
});
