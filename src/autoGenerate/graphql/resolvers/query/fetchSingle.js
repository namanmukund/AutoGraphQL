import { pick } from 'lodash';
import { QueryController, RemoteController } from '../../controllers';
import { getFieldsBeingFetched, filterRemoteFields } from '../../../utils';
import { toObject } from '../../../../../utils';
import { validate } from '../../validation';
import { InvalidParamsError } from '../../../../../constants/errors';
import { SINGULAR } from '../../../../../constants/graphqlOperations';
// Validate that the params used for single fetch are unique.
const validateParamsUniqueness = (paramKey, typeAST) => {
  let isUniqueField = false;
  // Id field is always unique.
  if (paramKey === 'id') {
    return true;
  }
  // Loop and find if field is unique.
  // @TODO can be improved using getParsedObjectTypeAST.
  isUniqueField = !!(typeAST.field[paramKey].directive.unique
    || typeAST.field[paramKey].directive.uniqueOrEmpty);
  return isUniqueField;
};

// Returns data from remote applications.
const remoteApplicationPromises = (
  result,
  queryName,
  newParam,
  feildsFetched,
  remoteFieldsApplicationWise,
  existingPromise,
  applicationName,
  authentication,
  ast,
  typeName,
) => {
  const promiseArray = Object.keys(remoteFieldsApplicationWise).map((appApplicationName) => {
    if (applicationName !== appApplicationName) {
      const appfieldsToQuery = filterRemoteFields(
        typeName,
        appApplicationName,
        ast,
        feildsFetched,
      );
      const appModelRemote = new RemoteController(appApplicationName, authentication);
      return appModelRemote.query(queryName, newParam, appfieldsToQuery);
    }
    return {};
  });
  promiseArray.push(existingPromise);
  return Promise.all(promiseArray).then((values) => {
    let returnObject = result;
    if (values && values.length > 0) {
      values.map((value) => {
        returnObject = { ...returnObject, ...value };
        return null;
      });
    }
    // @ TODO In relation fields are queried for,
    // and some fields in relations are local and some are remote,
    // in that case only remote fields are returned.
    return returnObject;
  });
};

const fetchSingleQueryResolver = (
  root,
  params,
  typeName,
  info,
  ast,
  authentication,
  allowMultiple,
) => {
  const { fieldNodes } = info; // Fields which are requested.
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  const typeAST = ast[typeName];
  validate(
    typeName,
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
  );
  const modelQueries = new QueryController(typeName, authentication);
  const { remoteFields, remoteFieldsApplicationWise } = ast[typeName];
  const queryName = info.fieldName;
  const paramsKeys = Object.keys(params);
  const isValidParams = validateParamsUniqueness(paramsKeys[0], typeAST);
  if (!allowMultiple && (!params || paramsKeys.length !== 1 || !isValidParams)) {
    throw new InvalidParamsError();
  }
  // Check if params is remote field.
  // If yes, the first query has to be to remote, which will give,
  // the id using which other system's can be queried.
  // @TODO Right now this assumes that there is only one param in params object.
  if (remoteFields[paramsKeys[0]]) {
    const applicationName = remoteFields[paramsKeys[0]].name;

    const modelRemote = new RemoteController(applicationName, authentication);
    // Out of all the fields requested, get the fields required.
    const fieldsToQuery = pick(fieldsFetched, Object.keys(remoteFieldsApplicationWise[applicationName]));
    return modelRemote.query(queryName, params, fieldsToQuery).then((resultRemote) => {
      if (!(resultRemote && resultRemote.id)) {
        return null;
      }
      const { id } = resultRemote;
      // Create params object.
      const newParam = {
        id,
      };

      // Fetch from local.
      const existingPromise = modelQueries.fetchById(id).then((result) => toObject(result));
      // Fetch from remote applications.
      return remoteApplicationPromises(
        resultRemote,
        queryName,
        newParam,
        fieldsFetched,
        remoteFieldsApplicationWise,
        existingPromise,
        applicationName,
        authentication,
        ast,
        typeName,
      );
    });
  }
  // If params is not remote field, first query db then,
  // query remote using id.
  return modelQueries.fetchOne(params).then((result) => {
    // If there are no remote fields, return the result.
    if (!Object.keys(remoteFields).length) {
      return result;
    }
    if (!(result && result.id)) {
      return null;
    }
    // Create params object.
    const { id } = result;
    const newParam = {
      id,
    };
    const existingPromise = null;
    const applicationName = null;
    const objectResult = toObject(result);
    // Fetch from remote applications.
    return remoteApplicationPromises(
      objectResult,
      queryName,
      newParam,
      fieldsFetched,
      remoteFieldsApplicationWise,
      existingPromise,
      applicationName,
      authentication,
      ast,
      typeName,
    );
  });
};

export default fetchSingleQueryResolver;
