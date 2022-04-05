/* eslint-disable consistent-return */
import { get } from 'lodash';
import { MENTEE } from '../../../../../constants/roles';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import addUserData from '../../resolvers/mutation/user/utils/addUserData';
import { generateCuid } from '../../../../../utils';

const fetchMentorProfile = (userConnectId) => `{
  mentorProfiles(filter: {
      user_some: {
          id: "${userConnectId}"
      }
  }) {
      id
  }
}`;

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
  const mentorProfilesRes = await callLocalGraphqlApi(fetchMentorProfile(mentorId));
  const mentorProfiles = get(mentorProfilesRes, 'data.mentorProfiles');
  const mentorProfileExists = get(mentorProfiles[0], 'id');

  let mentorConnectId = mentorProfileExists;
  if (!mentorProfileExists) {
    const res = await callLocalGraphqlApi(addMentorProfileQuery(mentorId));
    mentorConnectId = get(res.data, 'addMentorProfile.id');
  }
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
    return {
      childUserId,
      mentorConnectId,
    };
  }
};

export default generateMentorChild;
