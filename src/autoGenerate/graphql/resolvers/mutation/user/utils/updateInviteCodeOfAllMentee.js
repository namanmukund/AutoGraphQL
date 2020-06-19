import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import generateInviteCode from '../../../../../../../utils/generateInviteCode';

const updateInviteCodeOfAllMentee = async () => {
  const query = `
      query{
        users(filter:{
          role:mentee
        }){
          id
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  const usersData = get(res, 'data.users');
  const promiseArray = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const obj of usersData) {
    const { id } = obj;
    const ic = generateInviteCode();
    const query2 = `
          mutation{
        updateUser(id:"${id}", input:{
          fromReferral:false
          inviteCode: "${ic}"
        }){
          id
          inviteCode
        }
      }
    `;
    promiseArray.push(callLocalGraphqlApi(query2));
  }
  await Promise.all(promiseArray);
};

export default updateInviteCodeOfAllMentee;
