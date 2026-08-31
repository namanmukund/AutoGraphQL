import { get } from 'lodash';
import { validateUsername } from '../../validation';
import getUserPasswordObject from '../../../utils/getUserPasswordObject';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import {
  UserWithSimilarEmailAlreadyExist,
  UserWithSimilarNumberAlreadyExist,
  UserWithSimilarUsernameAlreadyExist,
} from '../../../../../constants/errors/db';

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

const checkUniqueEmail = async (email, id, context) => {
  const isDuplicate = await fetchUserDetail(email, id, false, context);
  if (isDuplicate) throw new UserWithSimilarEmailAlreadyExist();
};

const checkUniquePhone = async (phoneNumber, id, context) => {
  const isDuplicate = await fetchUserDetail(phoneNumber, id, true, context);
  if (isDuplicate) throw new UserWithSimilarNumberAlreadyExist();
};

const updateUserValidation = async (params, input, context) => {
  const { id } = params;
  const { username, password, email, phone } = input || {};
  const doc = {};

  if (email) {
    await checkUniqueEmail(email, id, context);
  }
  if (phone && phone.number) {
    await checkUniquePhone(phone.number, id, context);
  }
  if (username) {
    validateUsername(username);
  }
  if (password) {
    const passwordObj = getUserPasswordObject(password, true);
    Object.assign(doc, passwordObj);
  }

  return doc;
};

export default updateUserValidation;
