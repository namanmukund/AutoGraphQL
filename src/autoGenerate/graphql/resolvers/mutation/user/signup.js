import bcrypt from 'bcrypt';
import { pick } from 'lodash';
import { operationName } from '../../../../../../constants';
import { UserTokenNotRequiredError } from '../../../../../../constants/errors';
import allAuthParams from '../../../../../../config/authParams';
import { MutationController, RemoteController } from '../../../controllers';
import { generateCuid, toObject } from '../../../../../../utils';
import {
  mergeMutationsPromisesResults,
} from '../utils/mergeMutationsPromisesResults';

import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];

// Returns remote delete mutaiton promises.
const remoteSignUpMutationPromises = (
  input,
  typeName,
  mutationName,
  controllerFunctionName,
  feildsFetched,
  remoteFieldsApplicationWise,
  authentication,
) => {
  // Loop through all applicaiton fields to delete.
  const promiseArray = Object.keys(remoteFieldsApplicationWise).map((appApplicationName) => {
    const appModelRemote = new RemoteController(appApplicationName, authentication);
    const appInputCore = Object.assign({},
      pick(input, Object.keys(remoteFieldsApplicationWise[appApplicationName])));
    const appFieldsToMutatue = Object.assign(
      {},
      // get only those fields that are requested.
      pick(feildsFetched, Object.keys(remoteFieldsApplicationWise[appApplicationName])),
      {
        id: true,
      },
    );
    // Mutate remote applications.
    return appModelRemote[controllerFunctionName](
      typeName,
      mutationName,
      appInputCore,
      appFieldsToMutatue,
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

export default function signupMutationResolver(
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

  validate(
    typeName,
    ast,
    operationName.add,
    fieldsFetched,
    authentication,
    {},
  );

  const decodedUser = authentication && authentication.user;

  if (decodedUser) {
    throw new UserTokenNotRequiredError();
  }

  /* Setting user to true if not preset, as signup
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });
  const newUser = input;
  const hashedPwd = bcrypt.hashSync(newUser.password, authParams.SALT);
  newUser.password = hashedPwd;
  newUser.isSetPassword = true;

  // Create a new object id if there is no id.
  const modelMutations = new MutationController(typeName, authentication);

  // @TODO incorporate relation logic with multi apps logic
  // If there are no remote fields, return the result.
  if (!Object.keys(remoteFields).length) {
    const cuidInput = generateCuid(newUser);
    return localSignUpMutationPromise(
      cuidInput,
      modelMutations,
    ).then(savedUser => createUserTokenTypeData(savedUser));
  }

  // If there are remote fields.
  const controllerFunctionName = 'signUpMutation';

  const promiseArray = remoteSignUpMutationPromises(
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
    return localSignUpMutationPromise(
      localInput,
      modelMutations,
    ).then(val => mergeMutationsPromisesResults([value, toObject(val)]))
      .then(savedUser => createUserTokenTypeData(savedUser));
  }).catch(error => error);
}
