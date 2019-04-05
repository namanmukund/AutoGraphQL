import { pick } from 'lodash';
import {
  UserTokenNotRequiredError,
  BlockedOperationError,
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import { QueryController, RemoteController } from '../../../controllers';
import { toObject } from '../../../../../../utils';
import {
  mergeMutationsPromisesResults,
} from '../utils/mergeMutationsPromisesResults';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { checkPasswordAndReturnUserWithToken } from '../utils/checkPasswordAndReturnUserWithToken';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';

const localLoginMutationPromise = (
  typeName,
  input,
  ast,
  modelMutations,
) => {
  const { username, email, phone } = input;

  let query = {};
  if (username) query.username = username;
  if (email) query.email = email;
  if (phone) {
    const { countryCode, number } = phone;
    query = {
      'phone.countryCode': countryCode,
      'phone.number': number,
    };
  }
  return modelMutations.fetchOne(query);
};

// Returns remote delete mutaiton promises.
const remoteLoginMutationPromises = (
  input,
  typeName,
  mutationName,
  controllerFunctionName,
  fieldsFetched,
  remoteFieldsApplicationWise,
  authentication,
) => {
  const promiseArray = Object.keys(remoteFieldsApplicationWise).map((appApplicationName) => {
    const appModelRemote = new RemoteController(appApplicationName, authentication);
    const appInput = Object.assign({},
      pick(input, Object.keys(remoteFieldsApplicationWise[appApplicationName])));
    const appFieldsToMutation = Object.assign(
      {},
      // get only those fields that are requested.
      pick(fieldsFetched, Object.keys(remoteFieldsApplicationWise[appApplicationName])),
      {
        id: true,
        password: true,
      },
    );
    // Mutate remote applications.
    const loginSpecificTypeName = 'Login';
    return appModelRemote[controllerFunctionName](
      loginSpecificTypeName,
      mutationName,
      appInput,
      appFieldsToMutation,
    )
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

export default function loginMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { input } = params;
  const { localFields, remoteFields, remoteFieldsApplicationWise } = ast[typeName];
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  const accessFields = ast[typeName];
  validate(
    SINGULAR,
    accessFields,
    fieldsFetched,
    authentication,
  );
  const decodedUser = authentication && authentication.user;
  // FIX: Should this not be a null check
  if (decodedUser) {
    throw new UserTokenNotRequiredError();
  }
  // Setting user to true if not preset, as login does not require user authentication.
  Object.assign(authentication, {
    user: true,
  });
  // Create a new object id if there is no id.
  const modelMutations = new QueryController('User', authentication);

  // @TODO incorporate relation logic with multi apps logic
  // If there are no remote fields, return the result.
  if (!Object.keys(remoteFields).length) {
    return localLoginMutationPromise(
      typeName,
      input,
      ast,
      modelMutations,
    ).then((fetchedUser) => {
      if (!fetchedUser) {
        throw new DatabaseRecordNotFoundError();
      }
      const data = checkPasswordAndReturnUserWithToken(fetchedUser, input, authentication);
      const { status } = fetchedUser;
      switch (status) {
        case 'blocked':
          throw new BlockedOperationError();
        case 'inactive':
          if (!input.username === fetchedUser.username) { throw new BlockedOperationError(); }
          break;
        case 'active':
        default:
      }
      return data;
    })
      .catch(err => err);
  }

  // If there are remote fields.
  const controllerFunctionName = 'loginMutation';
  const promiseArray = remoteLoginMutationPromises(
    input,
    typeName,
    mutationName,
    controllerFunctionName,
    fieldsFetched,
    remoteFieldsApplicationWise,
    authentication,
  );
  // Wait for the promise to resolve.
  return Promise.all(promiseArray).then((values) => {
    // Expecting only one value.

    const value = values[0];
    const id = value.id;
    const cuidInput = Object.assign({}, input, {
      id,
    });
    // Input to local database.
    const localInput = pick(cuidInput, Object.keys(Object.assign({}, localFields, {
      id: true,
    })));
    return localLoginMutationPromise(
      typeName,
      localInput,
      ast,
      modelMutations,
    ).then(val => mergeMutationsPromisesResults([value, toObject(val)]))
      .then(savedUser => checkPasswordAndReturnUserWithToken(savedUser, input, authentication));
  }).catch(error => error);
}
