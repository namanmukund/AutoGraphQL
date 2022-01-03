import { get } from 'lodash';
import { validateUsername } from '../../validation';
import { commonUserValidation, validateTokenAndExtractInformation } from './utils';
import getUserPasswordObject from '../../resolvers/mutation/user/utils/getUserPasswordObject';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { ADMIN, UMS_ADMIN } from '../../../../../constants/roles';
import { InsufficientPermissionError } from '../../../../../constants/errors';
import { UserWithSimilarEmailAlreadyExist, UserWithSimilarNumberAlreadyExist } from '../../../../../constants/errors/db';

const allowedRoles = [ADMIN, UMS_ADMIN];

const fetchUser = async (id) => {
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
        studentProfile {
          batch {
            type
          }
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user');
};

const fetchUserDetail = async (emailOrPhoneNumber = '', userId, shouldCheckPhone = false) => {
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
  const user = await callLocalGraphqlApi(query);
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
    validateUsername(username);
  }
  // getting user role from context. We will allow adding mentorSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  const user = await fetchUser(userId);
  // if the user vertical is unassigned, try to change it
  // check if vertical can be determined, first from source, then campaign type, and then lastly batch type
  if (email) {
    const isUserExistWithEmail = await fetchUserDetail(email, userId);
    if (isUserExistWithEmail) {
      throw new UserWithSimilarEmailAlreadyExist();
    }
  }
  if (get(phone, 'number')) {
    const isUserExistWithNumber = await fetchUserDetail(get(phone, 'number'), userId, true);
    if (isUserExistWithNumber) {
      throw new UserWithSimilarNumberAlreadyExist();
    }
  }
  let userVertical = 'unassigned';
  if (get(user, 'vertical') === 'unassigned'
  && (get(user, 'role') === 'mentee' || get(user, 'role') === 'parent')) {
    if (get(user, 'source') !== 'school') {
      userVertical = 'b2c';
    } else if (get(user, 'studentProfile.batch.type')) {
      /* eslint-disable no-lonely-if */
      if (get(user, 'studentProfile.batch.type') === 'normal') {
        userVertical = 'b2c';
      } else if (get(user, 'studentProfile.batch.type') === 'b2b') {
        userVertical = 'b2b';
      } else if (get(user, 'studentProfile.batch.type') === 'b2b2c') {
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
    if (!allowedRoles.includes(currentUserRole)) {
      throw new InsufficientPermissionError();
    }
    const passwordObj = getUserPasswordObject(password, false);
    Object.assign(userObj, passwordObj);
  }

  const { pubsub } = context;
  pubsub.publish('USER_UPDATED', user);
  return userObj;
};

export default updateUserValidation;
