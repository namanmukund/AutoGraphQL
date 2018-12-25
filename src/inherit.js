import allServerConfig from '../config/server';
import { log, encodeToken, createApolloFetchRetry } from '../utils';
import { createToken } from './auth';

const appInheritanceCheck = (
  env,
  application,
  inheritedApplications,
) => {
  const inheritedApplicationsArray = inheritedApplications ? inheritedApplications.split(',') : [];

  if (inheritedApplicationsArray.length <= 0) {
    log(`Application ${application} is not inheriting from any other application`, 'info');
    return true;
  }

  const promiseArray = inheritedApplicationsArray.map((inheritedApplication) => {
    const uri = allServerConfig[inheritedApplication][env].backend.uri;
    const apolloFetch = createApolloFetchRetry();
    // To create a token,
    // first argument is the application which is requesting access.
    // second argument is application to whome request is directed.
    const appToken = createToken(application, inheritedApplication);
    const token = encodeToken({
      appToken,
      userToken: '',
    });
    const query = `query {
      users {
        id
        username
        email
      }
    }
  `;
    // Execute query.
    apolloFetch.use(({ options }, next) => {
      /* eslint-disable no-param-reassign */
      if (!options.headers) {
        options.headers = {};
      }
      options.headers.authorization = token;
      next();
      /* eslint-enable no-param-reassign */
    });
    return apolloFetch({ query })
      .then((result) => {
        log(`Connection Success: Application ${application} could connect to dependent applicaiton ${inheritedApplication} : ${uri}`);
        return result;
      })
      .catch((error) => {
        log(`Connection Error: Application ${application} could not connect to dependent applicaiton ${inheritedApplication} : ${uri}`, 'error');
        return error;
      });
  });
  return Promise.all(promiseArray).then(() => true).catch(() => false);
};

export default appInheritanceCheck;
