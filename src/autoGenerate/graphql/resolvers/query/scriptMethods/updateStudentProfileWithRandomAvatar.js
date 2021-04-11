import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import studentProfileAvatarCodes from '../../../../../../constants/studentProfileAvatarCodes';

const getStudentProfiles = async () => {
  const query = `
    query{
        studentProfiles {
          id
          grade
          profileAvatarCode
        }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.studentProfiles');
};

const updateStudentProfile = async (id, input) => {
  const query = `
    mutation($input:StudentProfileUpdate){
      updateStudentProfile(id:"${id}",
      input:$input){
        id
      }
    }
  `;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateStudentProfile.id');
};

const updateStudentProfileWithRandomAvatar = async () => {
  const studentProfiles = await getStudentProfiles();
  studentProfiles.forEach(async (studentProfile) => {
    const studentProfileId = get(studentProfile, 'id');
    if (studentProfileId && !get(studentProfile, 'profileAvatarCode')) {
      const updateObj = {
        profileAvatarCode:
          studentProfileAvatarCodes[Math.floor((Math.random() * studentProfileAvatarCodes.length))] || 'theo',
      };
      // eslint-disable-next-line no-await-in-loop
      await updateStudentProfile(studentProfileId, updateObj);
    }
  });
};

export default updateStudentProfileWithRandomAvatar;
