import { get } from 'lodash';
import { validateUsername } from '../../validation';
import { commonUserValidation, validateTokenAndExtractInformation } from './utils';
import getUserPasswordObject from '../../resolvers/mutation/user/utils/getUserPasswordObject';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchUser = async (id) => {
  const query = `
    {
      user(id: "${id}") {
        id
        isPreSalesAudit
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user');
};

const updateUserValidation = async (params, context) => {
  const { input, id: userId } = params;
  const userObj = {};
  const {
    name,
    username,
    email,
    phone,
    verificationStatus,
    password,
    isPreSalesAudit: isPreSalesAuditFromInput,
  } = input;
  commonUserValidation({ name, email, phone });
  if (username) {
    validateUsername(username);
  }
  // getting user role from context. We will allow adding mentorSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  const user = await fetchUser(userId);
  context.currentUser = currentUser;
  context.verificationStatusFromInput = verificationStatus;
  context.prevIsPreSalesAudit = get(user, 'isPreSalesAudit');
  context.isPreSalesAuditFromInput = isPreSalesAuditFromInput;

  if (password) {
    const passwordObj = getUserPasswordObject(password, false);
    Object.assign(userObj, passwordObj);
  }

  return userObj;
};

export default updateUserValidation;
