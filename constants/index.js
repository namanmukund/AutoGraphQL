import errors from './errors';
import relationDirections from './relations';
import resizePicDimensions from './resizePicDimensions';
import fileSizeLimitInMB from './fileSizeLimitInMB';
import fileExtensions from './fileExtensions';
import forceUpdateTypeNames from './forceUpdateTypeNames';
import forceDeleteTypeNames from './forceDeleteTypeNames';
import regexValidation from './regexValidation';
import loginType from './loginType';
import { meWatiSMS, usWatiSMS } from './messagingText';

const TMS = 'tekieTms';
const TLA = 'tekieLearningApp';
const TWA = 'tekieWebApp';
const TAA = 'tekieAffiliateApp';
const TBA = 'core';
const backendApps = [TBA];
const byPassMenteeValidationApps = [TBA];

const frontEndApps = [TLA, TMS, TWA, TAA];
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
const AFFILIATE_MAX_ALLOWED_REFERRALS = 1000;
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
  bodyBeforeIfNoName: 'Hi',
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

const OLD_COURSE_ID = 'cjs8skrd200041huzz78kncz5';

const enrollmentTypes = {
  free: 'free',
  pro: 'pro',
};

const topicTypes = {
  video: 'video',
  message: 'message',
  comicStrip: 'comicStrip',
  practiceQuestion: 'practiceQuestion',
  quiz: 'quiz',
  blockBasedProject: 'blockBasedProject',
  blockBasedPractice: 'blockBasedPractice',
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

const userSavedCodeStatus = {
  accepted: 'accepted',
  pending: 'pending',
  rejected: 'rejected',
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

const userSourceOrigin = {
  school: 'school',
  facebook: 'facebook',
  instagram: 'instagram',
  google: 'google',
  website: 'website',
  transformation: 'transformation',
};

const freeTopicCount = 5;
const badgeTypes = {
  character: 'character',
  equipment: 'equipment',
  skill: 'skill',
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

const weekDays = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

const CREDITED = 'credited';
const DEBITED = 'debited';
const REGISTRATION_BASE_CREDIT = 1000;

const skillsLevel = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

const installmentStatus = {
  pending: 'pending',
  paid: 'paid',
};

const batchType = {
  normal: 'normal',
  b2b: 'b2b',
  b2b2c: 'b2b2c',
  b2c: 'b2c',
};

const sessionStatus = {
  started: 'started',
  completed: 'completed',
  allotted: 'allotted',
};

const leadStatus = {
  pipeline: 'pipeline',
  hot: 'hot',
  cold: 'cold',
  lost: 'lost',
  won: 'won',
  unfit: 'unfit',
  unassigned: 'unassigned',
};

const campaignTypes = {
  b2b: 'b2b',
  b2b2cPaid: 'b2b2cPaid',
  b2b2cEvent: 'b2b2cEvent',
};

const batchCreationBasis = {
  grade: 'grade',
  section: 'section',
};

const batchCreationStatus = {
  todo: 'todo',
  inProgress: 'inProgress',
  complete: 'complete',
};

const sessionType = {
  trial: 'trial',
  paid: 'paid',
  batch: 'batch',
};

const studentCurrentStatus = {
  unRegistered: 'unRegistered',
  registered: 'registered',
  preDemo: 'preDemo',
  postDemo: 'postDemo',
  onBoarding: 'onBoarding',
  paidUser: 'paidUser',
  churned: 'churned',
};

const topicComponents = {
  video: 'video',
  learningObjective: 'learningObjective',
  assignment: 'assignment',
  quiz: 'quiz',
  blockBasedProject: 'blockBasedProject',
  blockBasedPractice: 'blockBasedPractice',
};

const childTopicComponents = {
  message: 'message',
  practiceQuestion: 'practiceQuestion',
  comicStrip: 'comicStrip',
};

const blockBasedProjectType = {
  project: 'project',
  practice: 'practice',
};

const emailText = {
  instagramLink: {
    india: 'https://instagram.com/tekie.in',
    default: 'https://www.instagram.com/tekie.us/',
  },
  tekieLink: {
    india: 'https://www.tekie.in',
    default: 'https://www.tekie.us',
  },
  tekieText: {
    india: 'VISIT TEKIE.IN',
    default: 'VISIT TEKIE.US',
  },
};

export const GIFT_VOUCHER_AMOUNT = 2500;

export const MENTOR_REPORT_COUNTRY = 'india';

export const MENTOR_REPORT_SESSION_TYPE = 'trial';

export const MENTOR_REPORT_DAYS = 3;

export const MENTOR_RATING_AUDIT_THRESHOLD = 4;

export const ADD_BATCH_TRY_LIMIT = 20;

export const BULK_MENTOR_SESSION_DAYS_LIMIT = 365;
export const MAX_ALLOWED_BATCH_SESSIONS_DAYS_RANGE = 365;

export const testMailingList = {
  production: {
    email: ['sanatankc@gmail.com', 'naman.mukund@tekie.in', 'shravastivaidya@gmail.com', 'kriteshpk@gmail.com', 'amit.ranjan@tekie.in', 'rishabh.bucha@tekie.in'],
    phone: ['918368246974', '919654347463'],
  },
  staging: {
    email: ['kriteshpk@gmail.com', 'sanatxn@gmail.com'],
    phone: ['918368246974'],
  },
  usMailingList: ['rishabprachi26@gmail.com'],
};

export const DEFAULT_LS_OM_USER_ID = 'b29041e3-5645-11eb-9166-0a68392cb7c4';

export const SESSION_REPORT_DAYS = 4;

export const COUNTRIES = [
  'india',
  'usa',
  'uk',
  'canada',
  'jamaica',
  'australia',
  'singapore',
  'bangladesh',
  'qatar',
  'uae',
  'oman',
  'kuwait',
  'egypt',
  'afghanistan',
  'russia',
];

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
  TAA,
  TBA,
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
  AFFILIATE_MAX_ALLOWED_REFERRALS,
  skillsLevel,
  installmentStatus,
  byPassMenteeValidationApps,
  userSourceOrigin,
  batchType,
  sessionStatus,
  leadStatus,
  userSavedCodeStatus,
  campaignTypes,
  batchCreationBasis,
  batchCreationStatus,
  weekDays,
  sessionType,
  studentCurrentStatus,
  topicComponents,
  childTopicComponents,
  OLD_COURSE_ID,
  blockBasedProjectType,
  emailText,
  meWatiSMS,
  usWatiSMS,
};
