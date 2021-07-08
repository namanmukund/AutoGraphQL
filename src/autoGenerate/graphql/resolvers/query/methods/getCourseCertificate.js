import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';

const getUserCourseCompletion = (code) => `
{
  userCourseCompletion(id:"${code}"){
    id
    user {
      id
      name
    }
    course {
      title
    }
    certificate {
      id
    }
  }
}
`;

// this API will return user's course completion certificate if exists
const getCourseCertificate = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { input: { code } } = params;
  // this will be sent in output
  const result = {};

  const getUserCourseCompletionRes = await callLocalGraphqlApi(getUserCourseCompletion(code));
  const completionId = get(getUserCourseCompletionRes, 'data.userCourseCompletion.id', {});
  
  if (!completionId) {
    throw new DatabaseRecordNotFoundError();
  }

  const certificateId = get(getUserCourseCompletionRes, 'data.userCourseCompletion.certificate.id', {});
  result.name = get(getUserCourseCompletionRes, 'data.userCourseCompletion.user.name', null);
  result.userId = get(getUserCourseCompletionRes, 'data.userCourseCompletion.user.id', null);
  result.courseName = get(getUserCourseCompletionRes, 'data.userCourseCompletion.course.title', null);


  if (certificateId) {
    result.certificate = { type: 'File', typeId: `${certificateId}` };
  }

  return result;
});

export default getCourseCertificate;
