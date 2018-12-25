import fetch from 'fetch-retry';
import { createApolloFetch } from 'apollo-fetch';
import allServerConfig from '../config/server/index';
import { fetchRetries, fetchRetryDelay } from '../constants';

const env = process.env.NODE_ENV || 'development';
const application = process.env.APPLICATION || 'core';
const uri = allServerConfig[application][env].backend.uri;

const customFetch = (url, req) => {
  const finalReq = Object.assign(req, { retries: fetchRetries, retryDelay: fetchRetryDelay });
  return fetch(url, finalReq);
};

const createApolloFetchRetry = (input) => {
  const finalUri = (input && input.uri) || uri;
  if (finalUri.includes('localhost')) {
    return createApolloFetch({ uri: finalUri });
  }
  return createApolloFetch({ uri: finalUri, customFetch });
};

export default createApolloFetchRetry;
