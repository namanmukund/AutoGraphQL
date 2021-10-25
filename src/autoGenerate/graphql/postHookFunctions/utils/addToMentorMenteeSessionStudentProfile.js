import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const addToMentorMenteeSessionStudentProfile = async (mentorMenteeSessionId, studentProfileId) => {
  const query = `
  mutation {
  addToMentorMenteeSessionStudentProfile(
    mentorMenteeSessionId: "${mentorMenteeSessionId}"
    studentProfileId: "${studentProfileId}"
  ) {
    mentorMenteeSession {
      id
    }
  }
}
  `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.addToMentorMenteeSessionStudentProfile', {});
};

export default addToMentorMenteeSessionStudentProfile;
