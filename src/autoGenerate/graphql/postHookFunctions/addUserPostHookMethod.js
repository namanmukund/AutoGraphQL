/*eslint-disable*/
import { get } from 'lodash';
import { MENTOR, MENTEE } from '../../../../constants/roles';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import addUserData from '../resolvers/mutation/user/utils/addUserData';
import { generateCuid } from '../../../../utils';
import generateMentorChild from './utils/generateMentorChild';

// const addMentorProfileQuery = (userConnectId) => `
// mutation {
//     addMentorProfile(userConnectId:"${userConnectId}", input: {}) {
//         id
//     }
// }
// `;

// const addStudentProfileQuery = (userConnectId, mentorConnectId) => `
// mutation {
//     addStudentProfile(userConnectId: "${userConnectId}", mentorConnectId: "${mentorConnectId}", input:{
//       grade: Grade6
//     }) {
//       id
//     }
//   }
// `;

const addUserPostHookMethod = async (input, params) => {
  if (get(params, 'input.role') === MENTOR) {
    const mentorId = get(input, 'id');
    const mentorName = get(input, 'name');
    await generateMentorChild(mentorId, mentorName);
    // const res = await callLocalGraphqlApi(addMentorProfileQuery(get(input, 'id')));
    // if (get(res.data, 'addMentorProfile.id')) {
    //   const mentorConnectId = get(res.data, 'addMentorProfile.id');
    //   const newAuthentication = {
    //     bypass: true,
    //   };
    //   const childData = {
    //     name: get(input, 'name'),
    //     role: MENTEE,
    //   };
    //   const childDataWithId = generateCuid(childData);
    //   const childUserData = await addUserData(newAuthentication, childDataWithId);
    //   const { id: childUserId } = childUserData;
    //   await callLocalGraphqlApi(addStudentProfileQuery(childUserId, mentorConnectId));
    // }
  }
};

export default addUserPostHookMethod;
