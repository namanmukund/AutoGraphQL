import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';

const userApprovedCodeQuery = async (id, context) => {
  const query = `
    query{
      userApprovedCode(id:"${id}"){
        id
        studentName
        approvedFileName
        approvedDescription
        approvedCode
        status
        user {
          email
          id
        }
      }
    }`;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.userApprovedCode');
};

const updateUserApprovedCodeValidation = async (params, _, context) => {
  const { id } = params;
  const userApprovedCodeData = await userApprovedCodeQuery(id, context);
  if (!get(userApprovedCodeData, 'id')) {
    throw new DatabaseRecordNotFoundError();
  }
  context.previousDocument = userApprovedCodeData;
};

export default updateUserApprovedCodeValidation;
