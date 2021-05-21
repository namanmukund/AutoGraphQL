import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addStudentProfile = async (
  context,
  variables,
  userConnectId,
  parentProfileId,
  studentSchoolId,
) => {
  let schoolConnectId = '';
  if (studentSchoolId) {
    schoolConnectId = `schoolConnectId: "${studentSchoolId}"`;
  }
  const query = `
mutation($input: StudentProfileInput!){
  addStudentProfile(
  input:$input, 
  userConnectId: "${userConnectId}", 
  parentsConnectIds:["${parentProfileId}"],
  ${schoolConnectId}
  ){
    id
  }
}
`;

  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addStudentProfile.id');
};

export default addStudentProfile;
