import { get } from 'lodash';
import { validateUsername } from '../../validation';
import { commonUserValidation, validateTokenAndExtractInformation } from './utils';
import getUserPasswordObject from '../../resolvers/mutation/user/utils/getUserPasswordObject';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { ADMIN, UMS_ADMIN } from '../../../../../constants/roles';
import { InsufficientPermissionError } from '../../../../../constants/errors';
import {
  UserWithSimilarEmailAlreadyExist, UserWithSimilarNumberAlreadyExist,
  UserWithSimilarUsernameAlreadyExist,
} from '../../../../../constants/errors/db';
import getUserActiveClassroom from '../../../../../utils/getUserActiveClassroom';

const allowedRoles = [ADMIN, UMS_ADMIN];

const fetchUser = async (id, context) => {
  const query = `
    {
      user(id: "${id}") {
        id
        isPreSalesAudit
        role
        source
        vertical
        campaign {
          type
        }
        parentProfile{
          children{
            id
          }
        }
        studentProfile {
          batch {
            type
          }
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.user');
};

const fetchUserDetail = async (emailOrPhoneNumber = '', userId, shouldCheckPhone = false, context) => {
  const query = `{
  users(
    filter: {
      and: [
        ${shouldCheckPhone ? `{ phone_number_subDoc: "${emailOrPhoneNumber}" }` : `{ email: "${emailOrPhoneNumber.trim()}" }`}
        { id_not: "${userId}" }
      ]
    }
  ) {
    id
  }
}
`;
  const user = await callLocalGraphqlApi(query, context);
  return get(user, 'data.users', []).length;
};

const fetchUserWithUsername = async (username = '', userId, context) => {
  const query = `{
  users(
    filter: {
      and: [
        { username: "${username.trim()}" }
        { id_not: "${userId}" }
      ]
    }
  ) {
    id
  }
}
`;
  const user = await callLocalGraphqlApi(query, context);
  return get(user, 'data.users', []).length;
};

const updateUserValidation = async (params, context, mutationOrQueryName) => {
  const { input, id: userId } = params;
  const userObj = {};
  const {
    name,
    username,
    email,
    verificationStatus,
    password,
    phone,
    isPreSalesAudit: isPreSalesAuditFromInput,
  } = input;
  commonUserValidation({
    name, email, phone, mutationOrQueryName,
  });
  if (username) {
    const isUserExistWithUsername = await fetchUserWithUsername(username, userId, context);
    if (isUserExistWithUsername) {
      throw new UserWithSimilarUsernameAlreadyExist();
    }
    validateUsername(username);
  }
  // getting user role from context. We will allow adding mentorSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  const user = await fetchUser(userId, context);
  // if the user vertical is unassigned, try to change it
  // check if vertical can be determined, first from source, then campaign type, and then lastly batch type
  if (email) {
    const isUserExistWithEmail = await fetchUserDetail(email, userId, false, context);
    if (isUserExistWithEmail) {
      throw new UserWithSimilarEmailAlreadyExist();
    }
  }
  if (get(phone, 'number')) {
    const isUserExistWithNumber = await fetchUserDetail(get(phone, 'number'), userId, true, context);
    if (isUserExistWithNumber) {
      throw new UserWithSimilarNumberAlreadyExist();
    }
  }
  const activeClassroom = await getUserActiveClassroom(context, {}, get(user, 'studentProfile.batch.id'));
  let userVertical = 'unassigned';
  if (get(user, 'vertical') === 'unassigned'
  && (get(user, 'role') === 'mentee' || get(user, 'role') === 'parent')) {
    if (get(user, 'source') !== 'school') {
      userVertical = 'b2c';
    } else if (get(activeClassroom, 'type')) {
      /* eslint-disable no-lonely-if */
      if (get(activeClassroom, 'type') === 'normal') {
        userVertical = 'b2c';
      } else if (get(activeClassroom, 'type') === 'b2b') {
        userVertical = 'b2b';
      } else if (get(activeClassroom, 'type') === 'b2b2c') {
        userVertical = 'b2b2c';
      }
    } else {
      /* eslint-disable no-lonely-if */
      if (get(user, 'campaign.type') === 'b2b') {
        userVertical = 'b2b';
      } else if (get(user, 'campaign.type') === 'b2b2cEvent') {
        userVertical = 'b2b2c';
      }
    }
  }

  input.vertical = userVertical;

  context.currentUser = currentUser;
  context.verificationStatusFromInput = verificationStatus;
  context.prevIsPreSalesAudit = get(user, 'isPreSalesAudit');
  context.isPreSalesAuditFromInput = isPreSalesAuditFromInput;
  if (password) {
    const currentUserRole = get(currentUser, 'role');
    if (!allowedRoles.includes(currentUserRole) && (get(user, 'parentProfile.children') && get(user, 'parentProfile.children').includes(userId))) {
      throw new InsufficientPermissionError();
    }
    const passwordObj = getUserPasswordObject(password, false);
    Object.assign(userObj, passwordObj);
  }

  const { pubsub } = context;
  if (pubsub && pubsub.publish) {
    pubsub.publish('USER_UPDATED', user);
  }
  return userObj;
};

export default updateUserValidation;
