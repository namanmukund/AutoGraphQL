import { log, logMapOfArrays, logArray } from './log';
import { authenticateUser, authenticateApp, ifAuthorized } from './ifAuthorized';
import generateCuid from './generateCuid';
import schema from '../graphqlSchema';
import dbConfig from '../config/mongoDb';
import toObject from './toObject';
import isErrorThrown from './isErrorThrown';
import encodeToken from './encodeToken';
import parsedDate from './parsedDate';
import allAwsConfig from '../config/aws/awsConfig';
import getRandomNumber from './getRandomNumber';
import getQueryFieldString from './getQueryFieldString';
import formatToParamString from './formatToParamString';
import mergeGraphqlTypeStrings from './mergeGraphqlTypeStrings';
import getProcessedGraphqlResponse from './getProcessedGraphqlResponse';
import getPossessiveNoun from './getPossessiveNoun';
import getUserShortName from './getUserShortName';
import getPresentYear from './getPresentYear';
import getRemoteSchema from './getRemoteSchema';
import mergeCustomizer from './mergeCustomizer';
import createApolloFetchRetry from './createApolloFetchRetry';
import insertSubString from './insertSubString';
import types from '../src/autoGenerate/graphql/types';
import getGraphqlStringFromObject from './getGraphqlStringFromObject';
import getUnixTime from './getUnixTime';
import addDaysToDate from './addDaysToDate';
import getTimeZoneDate from './getTimeZoneDate';
import getTimeZoneFromCountryCode from './getTimeZoneFromCountryCode';
import isEqualArrays from './isEqualArrays';
import createAndThrowApolloError from './createAndThrowApolloError';
import compareObjects from './compareObjects';
import isObject from './isObject';
import isSentryAppAndEnv from './isSentryAppAndEnv';
import throwAsyncError from './throwAsyncError';
import getTimeDifferenceWithCurrentDateInSeconds from './getTimeDifferenceWithCurrentDateInSeconds';

const env = process.env.NODE_ENV || 'development';
const application = process.env.APPLICATION || 'core';
const { functions } = schema[application];
const awsConfig = allAwsConfig[env];

export {
  log,
  logArray,
  logMapOfArrays,
  generateCuid,
  types,
  functions,
  dbConfig,
  isErrorThrown,
  formatToParamString,
  authenticateUser,
  authenticateApp,
  ifAuthorized,
  toObject,
  encodeToken,
  getRemoteSchema,
  parsedDate,
  getQueryFieldString,
  getProcessedGraphqlResponse,
  awsConfig,
  getRandomNumber,
  mergeGraphqlTypeStrings,
  getPossessiveNoun,
  getUserShortName,
  getPresentYear,
  mergeCustomizer,
  createApolloFetchRetry,
  insertSubString,
  getGraphqlStringFromObject,
  getUnixTime,
  addDaysToDate,
  getTimeZoneDate,
  getTimeZoneFromCountryCode,
  isEqualArrays,
  createAndThrowApolloError,
  compareObjects,
  isObject,
  isSentryAppAndEnv,
  throwAsyncError,
  getTimeDifferenceWithCurrentDateInSeconds,
};
