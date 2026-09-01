import errors from './errors';
import relationDirections from './relations';
import resizePicDimensions from './resizePicDimensions';
import fileSizeLimitInMB from './fileSizeLimitInMB';
import fileExtensions from './fileExtensions';
import forceUpdateTypeNames from './forceUpdateTypeNames';
import forceDeleteTypeNames from './forceDeleteTypeNames';
import regexValidation from './regexValidation';
import loginType from './loginType';
import { ADMIN, USER, GUEST, SERVICE } from './roles';

const CORE_APP = 'core';
const WEB_APP = 'web';
const MOBILE_APP = 'mobile';
const ADMIN_APP = 'admin';

const SECONDARY_APPLICATIONS = {};

const backendApps = [CORE_APP];
const byPassMenteeValidationApps = [CORE_APP];
const frontEndApps = [WEB_APP, MOBILE_APP, ADMIN_APP];
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

const STATIC = 'static';
const fetchRetries = 5;
const fetchRetryDelay = 1000;

const defaultLimitValue = process.env.DATA_PLATFORM ? 100000 : 1000;
const defaultDeleteLimitValue = 100;

const defaultPermissionErrorMsg = 'Not authorized to perform this operation.';

const historyFieldName = 'history';

const graphQlOperations = {
  query: 'query',
  mutation: 'mutation',
};

const META = 'Meta';
const PUBLISHED = 'published';
const UNPUBLISHED = 'unpublished';

const dbControllerModes = {
  MONGO: 'mongo',
  POSTGRES: 'postgres',
};

const DEFAULT_CLAMP_VALUE = 20;
const DB_AGGREGATION_MODE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
];

const ALLOWED_FILE_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const ALLOWED_HEADERS = [
  'Authorization',
  'authorization',
  'Content-Type',
  'content-type',
  'Accept',
  'accept',
  'Origin',
  'origin',
  'X-Requested-With',
  'x-requested-with',
  'app-name',
  'appname',
  'token',
];

const ADDITIONAL_CONTEXT_VARIABLES_FROM_HEADER = [
  'app-name',
  'appname',
  'token',
];

const HEADER_VARIABLES = {
  APP_NAME: 'app-name',
  TOKEN: 'token',
};

const DATABASE_DIALECTS = {
  mongoose: 'mongoose',
  postgres: 'postgres',
  mongo: 'mongoose',
  mongodb: 'mongoose',
  postgresql: 'postgres',
  sql: 'postgres',
  sequelize: 'postgres',
  MONGO: 'mongoose',
  POSTGRES: 'postgres',
};

const getDefaultDatabaseDialect = () => {
  const envVal = (
    process.env.DEFAULT_DATABASE_DIALECT
    || process.env.DEFAULT_DATABASE
    || process.env.DATABASE_DIALECT
    || 'mongoose'
  ).toLowerCase().trim();
  return DATABASE_DIALECTS[envVal] || DATABASE_DIALECTS.mongoose;
};

const PG_MODEL_SUFFIX = 'PG';
const INACTIVE = 'inactive';

const MEDIA_RESOLUTIONS = {
  THUMBNAIL: { width: 150, height: 150 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 },
};

const STELLATE_PURGE_CONFIG = {
  URL: process.env.STELLATE_PURGE_URL || '',
};

const STELLATE_PURGE_TOKEN = process.env.STELLATE_PURGE_TOKEN || '';

export {
  errors,
  relationDirections,
  resizePicDimensions,
  fileSizeLimitInMB,
  fileExtensions,
  forceUpdateTypeNames,
  forceDeleteTypeNames,
  regexValidation,
  loginType,
  ADMIN,
  USER,
  GUEST,
  SERVICE,
  SUPER_ADMIN,
  CORE_APP,
  WEB_APP,
  MOBILE_APP,
  ADMIN_APP,
  backendApps,
  byPassMenteeValidationApps,
  frontEndApps,
  permissionIntegratedApps,
  firebaseExcludedApps,
  BYPASS,
  scalarTypes,
  defaultFields,
  rangeOTP,
  randomNumberRangeForUsername,
  nameRules,
  usernameRules,
  connectMutationsArgumentsSuffix,
  operationName,
  allFilters,
  arrayUpdateAddTypes,
  arrayUpdateRemoveTypes,
  sortBy,
  STATIC,
  fetchRetries,
  fetchRetryDelay,
  defaultLimitValue,
  defaultDeleteLimitValue,
  defaultPermissionErrorMsg,
  historyFieldName,
  graphQlOperations,
  META,
  PUBLISHED,
  UNPUBLISHED,
  dbControllerModes,
  DEFAULT_CLAMP_VALUE,
  DB_AGGREGATION_MODE_STATUS,
  ALLOWED_MIME_TYPES,
  ALLOWED_FILE_UPLOAD_TYPES,
  ALLOWED_HEADERS,
  ADDITIONAL_CONTEXT_VARIABLES_FROM_HEADER,
  HEADER_VARIABLES,
  DATABASE_DIALECTS,
  getDefaultDatabaseDialect,
  PG_MODEL_SUFFIX,
  SECONDARY_APPLICATIONS,
  INACTIVE,
  MEDIA_RESOLUTIONS,
  STELLATE_PURGE_CONFIG,
  STELLATE_PURGE_TOKEN,
};
