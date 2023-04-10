import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addStudentProfile = async (
  variables,
  userConnectId,
  parentProfileId,
  studentSchoolId,
  batchId,
  bookingAgentId,
  academicYearId,
  context,
) => {
  let schoolConnectId = '';
  if (studentSchoolId) {
    schoolConnectId = `schoolConnectId: "${studentSchoolId}"`;
  }
  let batchConnectId = '';
  if (batchId) {
    batchConnectId = `batchConnectId: "${batchId}"`;
  }
  let bookingAgentConnectId = '';
  if (bookingAgentId) {
    bookingAgentConnectId = `bookingAgentConnectId: "${bookingAgentId}"`;
  }

  const query = `
mutation($input: StudentProfileInput!){
  addStudentProfile(
  input:$input, 
  userConnectId: "${userConnectId}", 
  parentsConnectIds:["${parentProfileId}"],
  ${schoolConnectId}
  ${batchConnectId}
  ${bookingAgentConnectId}
  ${academicYearId ? `academicYearsConnectIds: ["${academicYearId}"]` : ''}
  ){
    id
  }
}
`;

  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addStudentProfile.id');
};

export default addStudentProfile;
