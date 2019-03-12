import { MutationController, RemoteController } from '../../../controllers';
import { getFieldsBeingFetched, filterRemoteFields } from '../../../../utils';
import { checkAndDeleteReferences } from '../utils';
import { log, toObject } from '../../../../../../utils';
import { validate } from '../../../validation';
import { operationName } from '../../../../../../constants';
import { mergeMutationsPromisesResults } from '../utils/mergeMutationsPromisesResults';

// Roll back the changes made by deleteMutationResolver
const rollBack = () => {
  // @TODO implement rollback.
};

// Returns remote delete mutaiton promises.
const remoteDeleteMutationPromises = (
  id,
  typeName,
  feildsFetched,
  mutationName,
  controllerFucntionName,
  remoteFieldsApplicationWise,
  authentication,
  ast,
) => {
  // Loop through all applicaiton fields to delete.
  const promiseArray = Object.keys(remoteFieldsApplicationWise).map((appApplicationName) => {
    const appFieldsToMutatue = filterRemoteFields(
      typeName,
      appApplicationName,
      ast,
      feildsFetched,
    );
    const appModelRemote = new RemoteController(appApplicationName, authentication);
    // Mutate remote applications.
    return appModelRemote[controllerFucntionName](typeName, id, appFieldsToMutatue)
      .then((appResultRemote) => {
        const appData = appResultRemote.data;
        const appErrors = appResultRemote.errors;
        if (appErrors) {
          throw new Error(JSON.stringify(appErrors));
        }
        return appData[mutationName];
      });
  });
  return promiseArray;
};

const localDeleteMutationPromise = (
  id,
  typeName,
  ast,
  authentication,
) => {
  const modelMutations = new MutationController(typeName, authentication);
  return modelMutations.deleteDocument(id).then(async (record) => {
    // if (!record) {
    //   return null;
    // }
    const relationFields = ast[typeName].localRelationFields;
    const relationSubsetFields = ast[typeName].localSubsetFields;
    const relationFieldNames = Object.keys(relationFields);
    // if not relation fields present return;
    if (!relationFieldNames.length) {
      return record;
    }
    return checkAndDeleteReferences(typeName,
      ast,
      authentication,
      record,
      relationFields,
      relationSubsetFields);
  })
    .then(rec => rec)
    .catch((err) => {
      log(err);
      return err;
    });
};

const deleteMutationResolver = (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { id } = params;
  const { remoteFields, remoteFieldsApplicationWise } = ast[typeName];
  // Fields which are requested.
  const { fieldNodes } = info;
  const feildsFetched = getFieldsBeingFetched(fieldNodes);

  const accessFields = ast[typeName];
  validate(operationName.delete, accessFields, feildsFetched, authentication);
  // If there are no remote fields, return the result.
  if (!Object.keys(remoteFields).length) {
    return localDeleteMutationPromise(
      id,
      typeName,
      ast,
      authentication,
    );
  }
  // Loop through all applicaiton fields to delete.
  const controllerFucntionName = 'deleteMutation';
  const promiseArray = remoteDeleteMutationPromises(
    id,
    typeName,
    feildsFetched,
    mutationName,
    controllerFucntionName,
    remoteFieldsApplicationWise,
    authentication,
    ast,
  );
  // Delete in locacl database.
  promiseArray.push(
    localDeleteMutationPromise(
      id,
      typeName,
      ast,
      authentication,
    ).then(result => toObject(result)),
  );
  // Wait for all mutations to resolve.
  return Promise.all(promiseArray).then(values => mergeMutationsPromisesResults(values))
    .catch((err) => {
      // Roll back in case of any error.
      rollBack();
      return err;
    });
};

export default deleteMutationResolver;
