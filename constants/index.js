import errors from './errors';
import relationDirections from './relations';
import resizePicDimensions from './resizePicDimensions';
import fileSizeLimitInMB from './fileSizeLimitInMB';
import fileExtensions from './fileExtensions';
import forceUpdateTypeNames from './forceUpdateTypeNames';
import forceDeleteTypeNames from './forceDeleteTypeNames';
import regexValidation from './regexValidation';
import loginType from './loginType';


const FRONTEND_APP_ONE = 'tekieTms';
const FRONTEND_APP_TWO = 'tekieLearningApp';
const backendApps = ['core'];

const frontEndApps = [FRONTEND_APP_TWO, FRONTEND_APP_ONE];
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
  bodyAfterName: ', your xyz OTP is ',
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

const GLOBAL_COURSE_ID = 'cjs8skrd200041huzz78kncz5';

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
};

const userTopicTypeStatus = {
  complete: 'complete',
  incomplete: 'incomplete',
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

const masteryLevels = {
  proficient: 'proficient',
  master: 'master',
  familiar: 'familiar',
  defaultMastery: 'defaultMastery',
};

const freeTopicCount = 5;

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
  GLOBAL_COURSE_ID,
  enrollmentTypes,
  topicTypes,
  userActionType,
  userTopicTypeStatus,
  questionTypes,
  scholarshipThreshHolds,
  freeTopicCount,
  FRONTEND_APP_ONE,
  FRONTEND_APP_TWO,
  loginType,
  masteryLevels,
};
