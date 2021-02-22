import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';

const userSavedCodeQuery = async (id) => {
  const query = `
query{
  userSavedCode(id:"${id}"){
    id
    isApprovedForDisplay
    userApprovedCode {
      id
    }
  }
}`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.userSavedCode');
};

const updateUserSavedCodeValidation = async (params, mutationOrQueryName, context) => {
  if (get(params, 'input.isApprovedForDisplay')) {
    const { id } = params;
    const userSavedCodeData = await userSavedCodeQuery(id);
    if (!get(userSavedCodeData, 'id')) {
      throw new DatabaseRecordNotFoundError();
    }
    context.previousDocument = userSavedCodeData;
  }
};

export default updateUserSavedCodeValidation;
