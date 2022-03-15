import bcrypt from 'bcryptjs';
import { get } from 'lodash';
import {
  InvalidPasswordLengthError, UserAlreadyExistsError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import authParams from '../../../../../../config/authParams';
import { MutationController, QueryController } from '../../../controllers';
import { generateCuid, log } from '../../../../../../utils';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import getFirstTopicAndLearningObjective from '../../../../utils/getFirstTopicAndLearningObjective';
import addUserCurrentTopicComponentStatus
from '../../../../utils/addUserCurrentTopicComponentStatus';
import { ADD } from '../../../../../../constants/graphqlOperations';
import { commonUserValidation } from '../../../preHookFunctions/validation/utils';
import {
  NameFieldRequiredError,
  PasswordFieldRequiredError,
  PhoneFieldRequiredError,
} from '../../../../../../constants/errors/input';
import { TWA } from '../../../../../../constants';
import getUserFromDBQuery from './utils/getUserFromDBQuery';
import { SELF_LEARNER } from '../../../../../../constants/roles';

const validateSignUpInput = (input, authentication) => {
  const {
    name, email, phone, password,
  } = input;

  const { app: { name: appName } } = authentication;

  switch (appName) {
    case TWA: {
      if (!name) {
        throw new NameFieldRequiredError();
      }
      if (!phone || !phone.countryCode || !phone.number) {
        throw new PhoneFieldRequiredError();
      }
      // eslint-disable-next-line no-param-reassign
      input.role = SELF_LEARNER;
      break;
    }
    default: {
      if (!password) {
        throw new PasswordFieldRequiredError();
      }
    }
  }

  commonUserValidation({ name, email, phone });

  if (password && password.length < 6) {
    throw new InvalidPasswordLengthError();
  }
  return input;
};

const signupMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    'UserToken',
    ast,
    ADD,
    fieldsFetched,
    authentication,
    {},
  );

  const currentUser = authentication && authentication.user;

  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }

  validateSignUpInput(input, authentication);

  Object.assign(authentication, {
    user: true,
  });
  const modelQueries = new QueryController('User', authentication);
  const userData = await getUserFromDBQuery(input, modelQueries);
  /* if password is already present or if password
    is not present and also user is not socially logged in
    */
  if (userData) {
    const { isGmailLogin, isFacebookLogin, isSetPassword } = userData;
    if ((isSetPassword || (!isSetPassword && !isGmailLogin && !isFacebookLogin))) {
      throw new UserAlreadyExistsError();
    }
  }
  /* Setting user to true if not preset, as signup
  does not require user authentication.
  */
  const userObj = {};

  if (input.password) {
    const hashedPwd = bcrypt.hashSync(input.password, authParams.SALT);
    userObj.password = hashedPwd;
    userObj.isSetPassword = true;
  }

  let result = '';
  const modelMutations = new MutationController(typeName, authentication);
  // update password only if previously socially logged in
  if (userData) {
    const { isGmailLogin, isFacebookLogin, isSetPassword } = userData;
    if (!isSetPassword && (isGmailLogin || isFacebookLogin)) {
      const { id } = userData;
      result = await modelMutations.updateDocument(id, userObj);
    }
  } else {
    const { password, ...restObj } = input;
    const newUser = { ...restObj, ...userObj };
    const cuidInput = generateCuid(newUser);

    result = await localSignUpMutationPromise(
      cuidInput,
      modelMutations,
    );
  }

  /*
    logic to add current user topic component status
    the first published topic and first published learning objective corresponding to that topic
    will get populated in the document
    */
  const topic = await getFirstTopicAndLearningObjective();
  const firstTopicId = get(topic, 'data.topics[0].id');
  const firstLearningObjectiveId = get(topic, 'data.topics[0].learningObjectives[0].id');
  const { id: userId } = result;
  // we are not throwing any error here because it will seem that sign up failed if
  // firstTopicId and firstLearningObjectiveId is not present. Just adding log
  if (firstTopicId && firstLearningObjectiveId) {
    await addUserCurrentTopicComponentStatus(
      userId, firstTopicId, firstLearningObjectiveId,
    );
  } else {
    log('Failed to get first published topic or first published learning objective corresponding to it');
  }
  // return user with token
  return createUserTokenTypeData(result, authentication, '', true);
};

export default signupMutationResolver;
