import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addStudentProfile = async (
  variables,
  userConnectId,
  parentProfileId,
  studentSchoolId,
  batchId,
) => {
  let schoolConnectId = '';
  if (studentSchoolId) {
    schoolConnectId = `schoolConnectId: "${studentSchoolId}"`;
  }
  let batchConnectId = '';
  if (batchId) {
    batchConnectId = `batchConnectId: "${batchId}"`;
  }

  const query = `
mutation($input: StudentProfileInput!){
  addStudentProfile(
  input:$input, 
  userConnectId: "${userConnectId}", 
  parentsConnectIds:["${parentProfileId}"],
  ${schoolConnectId}
  ${batchConnectId}
  ){
    id
  }
}
`;

  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addStudentProfile.id');
};

export default addStudentProfile;
