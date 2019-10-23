import { includes } from 'lodash';
import { QueryController, MutationController } from '../controllers';
import { frontEndApps, backendApps } from '../../../../constants';
import { InvalidApplicationNameError } from '../../../../constants/errors';

const isAppTokenExists = (
  query,
  modelQueries,
) => modelQueries.fetchOne(query);

const validateAppTokenInput = (input, authentication) => {
  const { name: appName, type } = input;
  // If app name is not in the frontend or backend app list then it will throw an error
  if ((type === 'frontend' && (!includes(frontEndApps, appName)))
    || (type === 'backend' && (!includes(backendApps, appName)))
  ) {
    throw new InvalidApplicationNameError();
  }
  const typeName = 'AppToken';
  const { name } = input;
  const query = {
    name,
  };
  const modelQueries = new QueryController(typeName, authentication);
  return isAppTokenExists(
    query,
    modelQueries,
  ).then((res) => {
    // if res then just return so that new AppToken can be created
    if (!res) {
      return true;
    }
    // else remove the document so that a fresh AppToken can be created
    const modelMutations = new MutationController(typeName, authentication);
    return modelMutations.deleteDocumentWithAnyKey(query);
  });
};

export default validateAppTokenInput;
