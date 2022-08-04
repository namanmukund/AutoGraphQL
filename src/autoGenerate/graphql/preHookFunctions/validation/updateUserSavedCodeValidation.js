import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { userSavedCodeStatus } from '../../../../../constants';

const userSavedCodeQuery = async (id, context) => {
  const query = `
query{
  userSavedCode(id:"${id}"){
    id
    code
    fileName
    isApprovedForDisplay
    hasRequestedByMentee
    user {
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
    userApprovedCode {
      id
    }
  }
}`;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.userSavedCode');
};

const updateUserSavedCodeValidation = async (params, mutationOrQueryName, context) => {
  if (
    get(params, 'input.isApprovedForDisplay') === userSavedCodeStatus.accepted
    || get(params, 'input.hasRequestedByMentee')
  ) {
    const { id } = params;
    const userSavedCodeData = await userSavedCodeQuery(id, context);
    if (!get(userSavedCodeData, 'id')) {
      throw new DatabaseRecordNotFoundError();
    }
    context.previousDocument = userSavedCodeData;
  }
};

export default updateUserSavedCodeValidation;
