/*eslint-disable*/
import { get } from 'lodash';
import { MENTEE } from '../../../../../constants/roles';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import addUserData from '../../resolvers/mutation/user/utils/addUserData';
import { generateCuid } from '../../../../../utils';

const MentorProfile = (userConnectId) => `
  mentorProfiles(filter: {
      user_some: {
          id: "${userConnectId}"
      }
  }) {
      id
  }
`

const addMentorProfileQuery = (userConnectId) => `
mutation {
    addMentorProfile(userConnectId:"${userConnectId}", input: {}) {
        id
    }
}
`;

const addStudentProfileQuery = (userConnectId, mentorConnectId) => `
mutation {
    addStudentProfile(userConnectId: "${userConnectId}", mentorConnectId: "${mentorConnectId}", input:{
      grade: Grade6
    }) {
      id
    }
  }
`;

const generateMentorChild = async (mentorId, mentorName) => {
    const mentorProfile = await callLocalGraphqlApi(MentorProfile(mentorId));
    const isMentorProfileExist = mentorProfile && mentorProfile.length > 0;
    
    // case when mentor profile don't exist
    let mentorConnectId = mentorId;
    if(!isMentorProfileExist) {
        const res = await callLocalGraphqlApi(addMentorProfileQuery(mentorId));
        mentorConnectId = get(res.data, 'addMentorProfile.id');
    } 
    // if we received id from mentorProfile query the skip below step
    if (mentorConnectId) {
      const newAuthentication = {
        bypass: true,
      };
      const childData = {
        name: mentorName,
        role: MENTEE,
      };
      const childDataWithId = generateCuid(childData);
      const childUserData = await addUserData(newAuthentication, childDataWithId);
      const { id: childUserId } = childUserData;
      await callLocalGraphqlApi(addStudentProfileQuery(childUserId, mentorConnectId));
      return childUserId;
    }
};

export default generateMentorChild;
