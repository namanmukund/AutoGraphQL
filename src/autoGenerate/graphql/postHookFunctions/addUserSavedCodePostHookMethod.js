import { get } from 'lodash';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import sendSavedCodeSubmittedMailIfRequestedByMentee from './utils/sendSavedCodeSubmittedMailIfRequestedByMentee';

const userQuery = async (id) => {
  const query = `
query{
    user(id:"${id}"){
        id
        email
        name
        studentProfile {
        parents {
            user {
            email
            }
        }
        }
    }
}`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user');
};

const addUserSavedCodePostHookMethod = async (input, params) => {
  if (get(params, 'input.hasRequestedByMentee')) {
    const userData = await userQuery(get(input, 'user.typeId'));
    if (!get(userData, 'id')) {
      throw new DatabaseRecordNotFoundError();
    }
    await sendSavedCodeSubmittedMailIfRequestedByMentee({
      id: get(input, '_id'),
      code: get(input, 'code'),
      fileName: get(input, 'fileName'),
      user: userData,
    });
  }
};

export default addUserSavedCodePostHookMethod;
