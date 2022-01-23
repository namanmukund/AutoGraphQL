/*eslint-disable*/
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MentorIdIsMandatoryError, UserDonotExistsError } from '../../../../../../constants/errors/db';
import generateMentorChild from '../../../postHookFunctions/utils/generateMentorChild';

const FETCH_USER_DATA = (mentorId) => `
{
  users( filter: {
    and :[
    {role: mentor}, 
    {
      id: "${mentorId}"
    }]
  }) 
  {
   id
   username
  }
}
`

const generateMentorChildMutationResolver = async (
  root,
  params,
) => {
  const {
    mentorId
  } = params;

  // // throw error when not mentor id sent throw mentor id is mandatory
  if(!mentorId) {
    throw new MentorIdIsMandatoryError();
  }

  const user = await callLocalGraphqlApi(FETCH_USER_DATA(mentorId));
  const isUserExist = user && user.length > 0;

  if(!isUserExist) {
    throw new UserDonotExistsError()
  }

  
  // call api for user data and get it's name from there
  // call api with user id and role mentor
  // user don'yt exist error if user id is not correct
  const mentorName = get(user[0], 'username');

  // call the utils function for creating child
  const childId = await generateMentorChild(mentorId, mentorName);

  return {
    mentorChildId: childId
  };
};

export default generateMentorChildMutationResolver;
