import { createApolloFetchRetry } from '../utils';

const apolloFetch = createApolloFetchRetry();

const mutationQuery = (query, variables, token) => {
  /* eslint-disable no-param-reassign */
  apolloFetch.use(({ options }, next) => {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers.authorization = token;
    next();
  });
  /* eslint-enable no-param-reassign */
  return apolloFetch({ query, variables })
    .then((res) => res)
    .catch((error) => error);
};
const fetchQuery = (query, token) => {
  /* eslint-disable no-param-reassign */
  apolloFetch.use(({ options }, next) => {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers.authorization = token;
    next();
  });
  /* eslint-enable no-param-reassign */
  return apolloFetch({ query })
    .then((res) => res)
    .catch((error) => error);
};

export { mutationQuery, fetchQuery };
