import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const updateSchoolDataOfAStudent = async (input, studentProfileId) => {
  const {
    schoolName, schoolId, section, rollNo, batch, branch,
  } = input;
  let studentSchoolId = schoolId;
  if (!schoolId) {
    studentSchoolId = await getSchoolInformation(schoolName);
    if (!studentSchoolId) {
      return false;
    }
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
