import fetch from 'node-fetch';
import allServerConfig from '../config/server/index';

const env = process.env.NODE_ENV || 'development';
const application = process.env.APPLICATION || 'core';
const { uri } = allServerConfig[application][env]?.backend || { uri: 'http://localhost:3000/graphql/core' };

const createApolloFetchRetry = (input) => {
  const targetUri = (input && input.uri) || uri;
  return async (queryObj) => {
    const response = await fetch(targetUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryObj),
    });
    return response.json();
  };
};

export default createApolloFetchRetry;
