import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { OLD_COURSE_ID } from '../../../../../../constants'

const getUserCoursesQuery = (userId) => `
{
  userCourses(filter: { user_some: { id: "${userId}" } }) {
    id
    courses {
      id
      title
      order
      defaultLoComponentRule {
        componentName
        order
      }
      courseComponentRule {
        componentName
        order
      }
      topicsMeta {
        count
      }
      topics {
        order
        title
        topicComponentRule {
          componentName
          childComponentName
          order
        }
      }
    }
  }
}
`;

const getUserCourseCompletion = (userId) => `
{
  userCourseCompletion(filter: { user_some: { id: "${userId}" } }) {
    id
  }
}
`;

const getUserCourses = (async (root, params) => {
  const { input } = params;
  if (input && get(input, 'userId')) {
    const userId = get(input, 'userId');
    const userCoursesRes = await callLocalGraphqlApi(getUserCoursesQuery(userId));
    const userCourses = get(userCoursesRes, 'data.userCourses[0].courses', []);
    console.log({ userCourses })
    const updatedCourseArr = userCourses.filter(async (course) => {
      if (get(course, 'id') === OLD_COURSE_ID) {
        const userCourseCompletion = await callLocalGraphqlApi(getUserCourseCompletion(userId));
        if (userCourseCompletion && userCourseCompletion.id) {
          return true;
        }
        return false;
      }
      return true;
    });
    
    console.log({ updatedCourseArr })
    return updatedCourseArr || [];
  }
  return [];
});

export default getUserCourses;
