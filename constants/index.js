import errors from './errors';
import relationDirections from './relations';
import resizePicDimensions from './resizePicDimensions';
import fileSizeLimitInMB from './fileSizeLimitInMB';
import fileExtensions from './fileExtensions';
import forceUpdateTypeNames from './forceUpdateTypeNames';
import forceDeleteTypeNames from './forceDeleteTypeNames';
import regexValidation from './regexValidation';
import loginType from './loginType';


const TMS = 'tekieTms';
const TLA = 'tekieLearningApp';
const TWA = 'tekieWebApp';
const backendApps = ['core'];

const frontEndApps = [TLA, TMS, TWA];
const permissionIntegratedApps = [];
const firebaseExcludedApps = [];

const BYPASS = 'bypass';

const SUPER_ADMIN = 'superAdmin';

const scalarTypes = ['String', 'Int', 'Boolean', 'Float', 'ID', 'Date'];
const defaultFields = ['id', 'createdAt', 'updatedAt'];

const rangeOTP = {
  min: 1000,
  max: 9999,
};

const MAX_ALLOWED_REFERRALS = 10;
const randomNumberRangeForUsername = {
  min: 1,
  max: 99,
};
const nameRules = {
  min: 3,
  max: 30,
};
const usernameRules = {
  min: 3,
  max: 30,
};


const connectMutationsArgumentsSuffix = {
  singular: 'ConnectId',
  plural: 'ConnectIds',
};

const operationName = {
  add: 'add',
  update: 'update',
  delete: 'delete',
  read: 'read',
};
const allFilters = {
  and: 'and',
  or: 'or',
  AND: 'AND',
  OR: 'OR',
  not: 'not',
  in: 'in',
  lt: 'lt',
  lte: 'lte',
  gt: 'gt',
  gte: 'gte',
  contains: 'contains',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  none: 'none',
  some: 'some',
  notIn: 'not_in',
  notStartsWith: 'not_startsWith',
  notEndsWith: 'not_endsWith',
  notContains: 'not_contains',
  exists: 'exists',
  array: 'array',
  notArray: 'notArray',
  referenceId: 'ReferenceId',
};

const arrayUpdateAddTypes = [
  'push', 'pushMany', 'pushToSet', 'replace',
];
const arrayUpdateRemoveTypes = [
  'popFront', 'popBack', 'popAll', 'pop',
];

const sortBy = ['ASC', 'DESC'];
const smsOTPMessage = {
  bodyBeforeName: 'Dear ',
  bodyAfterName: ', your login OTP for Tekie App is ',
};

const fromEmail = 'namanmukund@gmail.com';
const STATIC = 'static';

const fetchRetries = 5;
const fetchRetryDelay = 1000;

const defaultLimitValue = 1000;
const defaultDeleteLimitValue = 100;

const defaultPermissionErrorMsg = 'Not authorised to perform this operation.';

const timeZones = [{
  countryCode: '+91',
  timeZone: 'Asia/Kolkata',
},
{
  countryCode: '+65',
  timeZone: 'Asia/Singapore',
},
{
  countryCode: '+63',
  timeZone: 'Asia/Manila',
}, {
  countryCode: '+977',
  timeZone: 'Asia/Kathmandu',
}];

const historyFieldName = 'history';

const graphQlOperations = {
  query: 'query',
  mutation: 'mutation',
};
const META = 'Meta';
const userProfiles = ['sampleProfile'];

const PUBLISHED = 'published';
const UNPUBLISHED = 'unpublished';

const GLOBAL_COURSE_TITLE = 'python';

const enrollmentTypes = {
  free: 'free',
  pro: 'pro',
};

const topicTypes = {
  video: 'video',
  message: 'message',
  practiceQuestion: 'practiceQuestion',
  quiz: 'quiz',
};

const userActionType = {
  next: 'next',
  back: 'back',
  appClose: 'appClose',
  skip: 'skip',
};

const userTopicTypeStatus = {
  complete: 'complete',
  incomplete: 'incomplete',
  skip: 'skip',
};

const questionTypes = {
  mcq: 'mcq',
  fibInput: 'fibInput',
  fibBlock: 'fibBlock',
  arrange: 'arrange',
};

const scholarshipThreshHolds = {
  proficient: 100,
  master: 80,
  familiar: 60,
};

const learningObjectiveQuizReportThreshHolds = {
  proficient: 100,
  master: 80,
  familiar: 60,
};

const learningObjectiveRecommendationTexts = {
  learningObjectiveProficientText: 'Excellent',
  learningObjectiveMasterText: 'Great going',
  learningObjectiveFamiliarText: 'Almost there',
  learningObjectiveDefaultText: 'Need work',
};

const masteryLevels = {
  proficient: 'proficient',
  master: 'master',
  familiar: 'familiar',
  defaultMastery: 'none',
};

const freeTopicCount = 5;
const badgeTypes = {
  character: 'character',
  equipment: 'equipment',
};


const stickerEmojiType = {
  sticker: 'sticker',
  emoji: 'emoji',
};

const forgotPassWebURL = {
  development: 'https://tekie-tms-dev.herokuapp.com/forgotPassword/',
  staging: 'https://tekie-tms-staging.herokuapp.com/forgotPassword/',
  production: 'https://tekie-tms-staging.herokuapp.com/forgotPassword/',
};

const slotTimes = [
  'slot0', 'slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6', 'slot7', 'slot8', 'slot9', 'slot10',
  'slot11', 'slot12', 'slot13', 'slot14', 'slot15', 'slot16', 'slot17', 'slot18', 'slot19', 'slot20',
  'slot21', 'slot22', 'slot23',
];

const CREDITED = 'credited';
const DEBITED = 'debited';
const REGISTRATION_BASE_CREDIT = 1000;
export const GIFT_VOUCHER_AMOUNT = 2500;

export {
  scalarTypes, defaultFields, backendApps, connectMutationsArgumentsSuffix,
  operationName, sortBy, allFilters, BYPASS, rangeOTP,
  relationDirections, errors, randomNumberRangeForUsername, nameRules,
  usernameRules, smsOTPMessage, frontEndApps,
  defaultLimitValue,
  fromEmail,
  STATIC, permissionIntegratedApps,
  resizePicDimensions, fileSizeLimitInMB, fileExtensions, fetchRetries,
  fetchRetryDelay,
  firebaseExcludedApps, defaultPermissionErrorMsg,
  SUPER_ADMIN,
  timeZones,
  defaultDeleteLimitValue,
  historyFieldName,
  graphQlOperations,
  META,
  userProfiles,
  forceUpdateTypeNames,
  forceDeleteTypeNames,
  PUBLISHED,
  UNPUBLISHED,
  regexValidation,
  arrayUpdateAddTypes,
  arrayUpdateRemoveTypes,
  GLOBAL_COURSE_TITLE,
  enrollmentTypes,
  topicTypes,
  userActionType,
  userTopicTypeStatus,
  questionTypes,
  scholarshipThreshHolds,
  freeTopicCount,
  TMS,
  TLA,
  TWA,
  loginType,
  masteryLevels,
  learningObjectiveQuizReportThreshHolds,
  learningObjectiveRecommendationTexts,
  badgeTypes,
  forgotPassWebURL,
  stickerEmojiType,
  slotTimes,
  MAX_ALLOWED_REFERRALS,
  CREDITED,
  DEBITED,
  REGISTRATION_BASE_CREDIT,
};
