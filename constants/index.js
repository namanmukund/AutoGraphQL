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
import { ADMIN, UMS_ADMIN, SUPPLY_DEMAND_ADMIN } from './roles';

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

const defaultLimitValue = process.env.DATA_PLATFORM ? 100000 : 1000;
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
  learningSlide: 'learningSlide',
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

const auditQuestionType = {
  mcq: questionTypes.mcq,
  bool: 'bool',
  rating: 'rating',
  timestamp: 'timestamp',
  input: 'input',
};

const auditType = {
  mentor: 'mentor',
  preSales: 'preSales',
  postSales: 'postSales',
  demoWow: 'demoWow',
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
  radioStreet: 'radioStreet',
  agent: 'agent',
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
  development: 'https://tekie-tms-dev.herokuapp.com/forgotPassword',
  staging: 'https://tekie-tms-staging.herokuapp.com/forgotPassword',
  production: 'https://tekie-managment-system.herokuapp.com/forgotPassword',
  preProd: 'https://tekie-tms-pre-prod.herokuapp.com/forgotPassword',
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

const auditSubType = {
  b2cDemo: 'b2cDemo',
  b2cPaid: 'b2cPaid',
  b2b: batchType.b2b,
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
  homeworkAssignment: 'homeworkAssignment',
  quiz: 'quiz',
  blockBasedProject: 'blockBasedProject',
  blockBasedPractice: 'blockBasedPractice',
  homeworkPractice: 'homeworkPractice',
};

const childTopicComponents = {
  message: 'message',
  practiceQuestion: 'practiceQuestion',
  comicStrip: 'comicStrip',
  chatbot: 'chatbot',
  learningSlide: 'learningSlide',
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

const currencyTypes = {
  RS: 'RS',
  USD: 'USD',
};

const studentNoteForIQ = {
  smartAndAttentive: 'The student is very smart & attentive and understood the concepts clearly. Also, the kid tried answering all the question and was very curious. Overall the kid has great potential',
  interestedAndEagerToLearn: 'The student was really interested in coding and was eager to learn as well. Also, the student was asking questions constantly.',
  goodCommunicationAndCurious: 'The student is an extrovert and has amazing communication skills, also the kid was able to quickly grasp the concepts and had a lot of curiosity to learn more. The kid has great potential overall',
  interactiveAndFocused: 'The student was good at catching concepts and was really interactive and focused throughout the sessions and was very interested to learn coding',
  problemSolvingAndCreativeThinkingSkill: 'The student was really curious and filled with tons of energy also, had good problem-solving skills and creative thinking. Amazing kid!',
};

const iqaTags = ['ambitious', 'energetic', 'curious', 'quickLearner', 'focused', 'determined'];

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
    email: ['sanatankc@gmail.com'],
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

// used for session report, will add 'b2b2c' later
export const VERTICALS = [
  'b2b',
  'b2c',
  'b2b2c',
];

export const GRADE = [
  'grade1',
  'grade2',
  'grade3',
  'grade4',
  'grade5',
  'grade6',
  'grade7',
  'grade8',
  'grade9',
  'grade10',
  'grade11',
  'grade12',
];

export const NUNITO_BOLD_FONT_URL = `${process.env.FILE_BASE_URL}/python/course/Nunito-Bold.ttf`;

export const GILROY_EXTRA_BOLD_FONT_URL = `${process.env.FILE_BASE_URL}/python/course/Gilroy-ExtraBold.otf`;

const ALLOWED_MIME_TYPES = ['html', 'css', 'javascript'];

const MASTER_OTP = 1101;

const BLOCKED = 'blocked';

const courseToGradeMapping = [
  {
    grade: [1, 2],
    courseId: 'cks5y78w0000t0vwcauvc2rtm',
  },
  {
    grade: [3, 4, 5],
    courseId: 'cks94x3jq00fc0w24e92pb9ku',
  },
  {
    grade: [6, 7, 8, 9, 10, 11, 12],
    courseId: 'cks5r4pzv000r0v29gk231bcy',
  },
];

const courseToGradeMappingForStaging = [
  {
    grade: [1, 2],
    courseId: 'ckpwgsqpx00010txl9q1s19f2',
  },
  {
    grade: [3, 4, 5],
    courseId: 'ckpwvp8gb00000t06f78t6dbz',
  },
  {
    grade: [6, 7, 8, 9, 10, 11, 12],
    courseId: 'cjs8skrd200041huzz78kncz5',
  },
];

const PHONE_OTP_LIMIT_PER_DAY = 5;

const PHONE_OTP_MAX_RETRY_WAIT_SECOND = 60;

const ALLOWED_ROLE_FOR_MANUAL_SESSIONS = [ADMIN, UMS_ADMIN, SUPPLY_DEMAND_ADMIN];

const TIME_DIFF_FOR_MANUAL_SESSION = -1;

const newTekieWebLinks = {
  staging: 'https://tekie-web-staging-28b1816977c254e7.onporter.run',
  preProd: 'https://tekie-web-pre-prod-dd811f1acf374a8c.onporter.run',
};
const EXCLUDE_NUMBER = ['7000287388'];

const TIME_BEFORE_EVENT_CREATION = 1;

const DAY_BEFORE_DEMO_COMPLETED = 5;

const LEAD_PARTNERS_TO_CHECK_FOR_DEMO = ['virgo_india', 'ICCS'];

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
  auditQuestionType,
  auditType,
  auditSubType,
  currencyTypes,
  studentNoteForIQ,
  ALLOWED_MIME_TYPES,
  MASTER_OTP,
  courseToGradeMapping,
  courseToGradeMappingForStaging,
  iqaTags,
  BLOCKED,
  PHONE_OTP_LIMIT_PER_DAY,
  PHONE_OTP_MAX_RETRY_WAIT_SECOND,
  ALLOWED_ROLE_FOR_MANUAL_SESSIONS,
  TIME_DIFF_FOR_MANUAL_SESSION,
  newTekieWebLinks,
  EXCLUDE_NUMBER,
  TIME_BEFORE_EVENT_CREATION,
  DAY_BEFORE_DEMO_COMPLETED,
  LEAD_PARTNERS_TO_CHECK_FOR_DEMO,
};
