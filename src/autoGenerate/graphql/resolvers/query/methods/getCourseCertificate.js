import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';

const getUserCourseCompletion = (code) => `
{
  userCourseCompletion(id:"${code}"){
    id
    courseDuration
    courseEndingDate
    mentors {
      name
    }
    proficiency
    user {
      id
      name
    }
    course {
      id
      title
      projectsCount
      thumbnail {
        id
      }
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
  const courseThumbnailId = get(getUserCourseCompletionRes, 'data.userCourseCompletion.course.thumbnail.id', null);
  result.name = get(getUserCourseCompletionRes, 'data.userCourseCompletion.user.name', null);
  result.userId = get(getUserCourseCompletionRes, 'data.userCourseCompletion.user.id', null);
  result.courseId = get(getUserCourseCompletionRes, 'data.userCourseCompletion.course.id', null);
  result.courseName = get(getUserCourseCompletionRes, 'data.userCourseCompletion.course.title', null);
  result.courseDuration = get(getUserCourseCompletionRes, 'data.userCourseCompletion.courseDuration', null);
  result.courseEndingDate = get(getUserCourseCompletionRes, 'data.userCourseCompletion.courseEndingDate', null);
  result.mentors = get(getUserCourseCompletionRes, 'data.userCourseCompletion.mentors', []).map((user) => get(user, 'name'));
  result.projectsCount = get(getUserCourseCompletionRes, 'data.userCourseCompletion.course.projectsCount', null);
  result.proficiency = get(getUserCourseCompletionRes, 'data.userCourseCompletion.proficiency', null);

  if (courseThumbnailId) {
    result.courseThumbnail = { type: 'File', typeId: `${courseThumbnailId}` };
  }
  if (certificateId) {
    result.certificate = { type: 'File', typeId: `${certificateId}` };
  }

  return result;
});

export default getCourseCertificate;
