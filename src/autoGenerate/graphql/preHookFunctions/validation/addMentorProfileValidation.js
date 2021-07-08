import { get } from 'lodash';
import { MentorProfileAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchMentorProfile = async (userId) => {
  const query = `
    {
      mentorProfiles(filter: { user_some: { id: "${userId}" } }) {
        id
      }
    }
    `;
  const mentorProfiles = await callLocalGraphqlApi(query);
  return get(mentorProfiles, 'data.mentorProfiles', []);
};

const addMentorProfileValidation = async (params) => {
  // check if the document for user is already present
  const userId = get(params, 'userConnectId');

  if (!userId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'User Id is missing in input',
      },
    });
  }
  const mentorProfiles = await fetchMentorProfile(userId);
  if (mentorProfiles && mentorProfiles.length > 0) {
    throw new MentorProfileAlreadyExist();
  }
  return true;
};

export default addMentorProfileValidation;
