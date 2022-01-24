import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MentorIdIsMandatoryError, DatabaseRecordNotFoundError } from '../../../../../../constants/errors/db';
import generateMentorChild from '../../../postHookFunctions/utils/generateMentorChild';
import { MENTOR } from '../../../../../../constants/roles';

const fetchUserQuery = (mentorId) => `
{
  users( filter: {
    and :[
    {role: ${MENTOR}}, 
    {
      id: "${mentorId}"
    }]
  }) 
  {
   id
   name
  }
}
`;

const generateMentorChildMutationResolver = async (
  root,
  params,
) => {
  const { mentorId } = params;

  if (!mentorId) {
    throw new MentorIdIsMandatoryError();
  }
  const usersRes = await callLocalGraphqlApi(fetchUserQuery(mentorId));
  const usersDoc = get(usersRes, 'data.users');
  const userExists = get(usersDoc[0], 'id');

  if (!userExists) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Mentor Not Found!',
      },
    });
  }

  const mentorName = get(usersDoc[0], 'name');
  const childId = await generateMentorChild(mentorId, mentorName);

  return {
    mentorChildId: childId,
  };
};

export default generateMentorChildMutationResolver;
