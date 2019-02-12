import errors from './errors';
import relationDirections from './relations';
import resizePicDimensions from './resizePicDimensions';
import fileSizeLimitInMB from './fileSizeLimitInMB';
import fileExtensions from './fileExtensions';
import forceUpdateTypeNames from './forceUpdateTypeNames';
import forceDeleteTypeNames from './forceDeleteTypeNames';
import regexValidation from './regexValidation';


const FRONTEND_APP_ONE = 'tekieTms';
const FRONTEND_APP_TWO = 'tekieLearningApp';
const backendApps = ['core'];

const frontEndApps = [FRONTEND_APP_TWO, FRONTEND_APP_ONE];
const permissionIntegratedApps = [FRONTEND_APP_ONE];
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
};

const sortBy = ['ASC', 'DESC'];
const smsOTPMessage = {
  bodyBeforeName: 'Dear ',
  bodyAfterName: ', your xyz OTP is ',
};

const fromEmail = 'xyz@gmail.com';
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
};
