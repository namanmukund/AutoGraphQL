import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import getSchoolInformation from './getSchoolInformation';

const updateSchoolDataOfAStudent = async (input, studentProfileId) => {
  const {
    schoolName, schoolId, section, rollNo, batch, branch,
  } = input;
  let studentSchoolId = schoolId;
  if (!schoolId && !schoolName) {
    studentSchoolId = await getSchoolInformation(schoolName);
    if (!studentSchoolId) {
      return false;
    }
  }

  if (schoolName) {
    const query = `
      mutation {
        updateStudentProfile(
          id:"${studentProfileId}"
          input: {
            schoolName: "${schoolName}"
          }
        ){
          id
        }
      }
    `;

    const res = await callLocalGraphqlApi(query);
    return get(res, 'data.updateStudentProfile.id');
  }

  const query = `
  mutation($input: StudentProfileUpdate) {
    updateStudentProfile(id:"${studentProfileId}"
    input: $input
    schoolConnectId: "${studentSchoolId}"
    ){
      id
    }
  }
  `;
  const variables = {
    input: {
      section,
      rollNo,
      batch,
      branch,
    },
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateStudentProfile.id');
};

export default updateSchoolDataOfAStudent;
