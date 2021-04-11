import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const addUserApprovedCodeQuery = async (input, userConnectId, userSavedCodeConnectId) => {
  const query = `
    mutation($input:UserApprovedCodeInput!){
      addUserApprovedCode(
        input: $input,
        userConnectId:"${userConnectId}",
        userSavedCodeConnectId:"${userSavedCodeConnectId}"
      ){
        id
      }
    }`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addUserApprovedCode');
};

const userQuery = async (userId) => {
  const query = `
      query{
        user(id:"${userId}"){
          id
          name
          studentProfile{
            id
            grade
            profileAvatarCode
          }
        }
      }`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user');
};

const updateUserSavedCodePostHookMethod = async (input, params, mutationName, context) => {
  if (
    get(params, 'input.isApprovedForDisplay')
    && get(context, 'previousDocument.isApprovedForDisplay') !== true
  ) {
    if (!get(context, 'previousDocument.userApprovedCode.id')) {
      const {
        id: userSavedCodeConnectId,
        user: { typeId: userConnectId }, code, fileName, description,
      } = input;

      const userData = await userQuery(userConnectId);
      const doc = {
        studentName: get(userData, 'name') || '',
        studentGrade: get(userData, 'studentProfile.grade'),
        studentProfileAvatar: get(userData, 'studentProfile.profileAvatarCode', 'theo'),
        approvedCode: code || '',
        approvedFileName: fileName || '',
        approvedDescription: description || '',

      };
      const userApprovedData = await addUserApprovedCodeQuery(doc, userConnectId, userSavedCodeConnectId);
      if (userApprovedData && userApprovedData.id) {
        Object.assign(input, {
          userApprovedCode: {
            type: 'UserApprovedCode',
            typeId: userApprovedData.id,
          },
        });
      }
    }
  }
};

export default updateUserSavedCodePostHookMethod;
