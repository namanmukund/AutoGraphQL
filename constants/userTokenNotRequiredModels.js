const userTokenNotRequiredModels = [
  'UserApprovedCodeTagMapping',
  'UserApprovedCode',
  'UserApprovedCodeTag',
  'EventCertificate',
  'IqaReport',
  'UserCourse',
  'ContentTag',
  'File',
  'EventCategory',
  'Event',
  'EventJoinReason',
  'EventPrize',
  'ShortLink',
  // NOTE: TEMPORARY ONLY FOR TESTING ON STAGING WILL BE REMOVED BEFORE PUSHING TO PRODUCTION
  'UserPracticeQuestionReport',
  'QuestionBank',
  'QuestionBankImage',
  'Topic',
  'LearningObjective',
  'User',
  'School',
];

export default userTokenNotRequiredModels;
