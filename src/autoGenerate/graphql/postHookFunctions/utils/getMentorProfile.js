import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getMentorProfile = async (userId) => {
  const query = `{
    user(id: "${userId}") {
        id
        mentorProfile {
        id
        }
    }
  }`;
  const mentorProfile = await callLocalGraphqlApi(query);
  return get(mentorProfile, 'data.user', {});
};

export default getMentorProfile;
