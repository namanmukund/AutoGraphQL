import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const updateUserApprovedCodeQuery = async (userApprovedCodeID, input) => {
  const query = `
    mutation($input:UserApprovedCodeUpdate!){
      updateUserApprovedCode(
        id:"${userApprovedCodeID}"
        input: $input,
      ){
        id
      }
    }`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateUserApprovedCode');
};

const userApprovedCodeQuery = async (userId) => {
  const query = `
      query{
        userApprovedCodes(filter: {
            and: [
                {status: published},
                {user_some: { id: "${userId}" } }
            ]
        }) {
          id
        }
      }`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.userApprovedCodes');
};

const updateStudentProfilePostHookMethod = async (input, params, mutationName, context) => {
  if (get(params, 'input.profileAvatarCode') !== get(context, 'previousDocument.profileAvatarCode')) {
    const userId = get(context, 'previousDocument.user.id');
    const userApprovedCodes = await userApprovedCodeQuery(userId);
    const updateObj = {
      studentAvatar: get(input, 'profileAvatarCode', 'theo'),
    };
    if (userApprovedCodes && userApprovedCodes.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const userApprovedCode of userApprovedCodes) {
        const userApprovedCodeID = get(userApprovedCode, 'id');
        // eslint-disable-next-line no-await-in-loop
        await updateUserApprovedCodeQuery(userApprovedCodeID, updateObj);
      }
    }
  }
};

export default updateStudentProfilePostHookMethod;
