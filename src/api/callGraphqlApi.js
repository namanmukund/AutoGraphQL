import { createApolloFetchRetry, createAndThrowApolloError } from '../../utils';
import allServerConfig from '../../config/server/index';
import getTokenForApi from './getTokenForApi';


const application = process.env.APPLICATION || 'core';
const env = process.env.NODE_ENV || 'development';
const uri = allServerConfig[application][env].backend.uri;

// const token = getTokenForApi();
const callGraphqlApi = (
  query,
  variables = {},
  url = uri,
  mutationCallRoute,
  token,
  xForwardedBy,
) => {
  if (!token) {
    // eslint-disable-next-line no-param-reassign
    token = getTokenForApi();
  }
  const apolloFetch = createApolloFetchRetry({ uri: url });
  /* eslint-disable no-param-reassign */
  /* eslint-disable no-unused-vars */

  apolloFetch.use(({ request, options }, next) => {
    if (!options.headers) {
      options.headers = {}; // Create the headers object if needed.
    }
    options.headers.authorization = token;
    if (xForwardedBy) {
      options.headers['x-forwarded-by'] = xForwardedBy;
    }
    // header added to know when call made through agenda
    if (mutationCallRoute) {
      options.headers['mutation-call-route'] = mutationCallRoute;
    }
    next();
  });

  /* eslint-enable no-param-reassign */
  /* eslint-enable no-unused-vars */
  return apolloFetch({ query, variables })
    .then((res) => {
      if (res.errors) {
        createAndThrowApolloError(res);
      }
      return res;
    });
};

export default callGraphqlApi;
