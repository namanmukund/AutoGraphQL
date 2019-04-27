import bcrypt from 'bcrypt';
import { get } from 'lodash';
import {
  InvalidEmailError,
  InvalidPasswordLengthError, UserAlreadyExistsError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import allAuthParams from '../../../../../../config/authParams';
import { MutationController } from '../../../controllers';
import { generateCuid, log } from '../../../../../../utils';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import getFirstTopicAndLearningObjective from '../../../../utils/getFirstTopicAndLearningObjective';
import addUserCurrentTopicComponentStatus
  from '../../../../utils/addUserCurrentTopicComponentStatus';
import { ADD } from '../../../../../../constants/graphqlOperations';
import isValidEmail from '../../../validation/isValidEmail';
import getUserData from './utils/getUserData';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];

const validateSignUpInput = (input) => {
  const { email, password } = input;
  if (!isValidEmail(email)) {
    throw new InvalidEmailError();
  }
  if (password.length < 6) {
    throw new InvalidPasswordLengthError();
  }
  return true;
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

  const decodedUser = authentication && authentication.user;

  if (decodedUser) {
    throw new UserTokenNotRequiredError();
  }

  validateSignUpInput(input);

  const { email } = input;
  const userData = await getUserData(email, { bypass: true });
  const { isGmailLogin, isFacebookLogin, isSetPassword } = userData;

  /* if password is already present or if password
    is not present and also user is not socially logged in
    */
  if (userData && (isSetPassword || (!isSetPassword && !isGmailLogin && !isFacebookLogin))) {
    throw new UserAlreadyExistsError();
  }
  /* Setting user to true if not preset, as signup
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });

  const userObj = {};
  const hashedPwd = bcrypt.hashSync(input.password, authParams.SALT);
  userObj.password = hashedPwd;
  userObj.isSetPassword = true;

  let result = '';
  const modelMutations = new MutationController(typeName, authentication);
  // update password only if previously socially logged in
  if (userData && (!isSetPassword && (isGmailLogin || isFacebookLogin))) {
    const { id } = userData;
    result = await modelMutations.updateDocument(id, userObj);
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
      userId, firstTopicId, firstLearningObjectiveId);
  } else {
    log('Failed to get first published topic or first published learning objective corresponding to it');
  }
  // return user with token
  return createUserTokenTypeData(result);
};

export default signupMutationResolver;
