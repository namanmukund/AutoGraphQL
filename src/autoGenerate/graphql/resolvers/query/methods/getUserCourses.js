import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getUserCoursesQuery = (userId) => `
{
  userCourses(filter: { user_some: { id: "${userId}" } }) {
    id
    courses {
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

// const getUserCourseCompletion = (userId) => `
// {
//   userCourseCompletion(filter: { user_some: { id: "${userId}" } }) {
//     id
//   }
// }
// `;

const getUserCourses = (async (root, params) => {
  const { input } = params;
  if (input && get(input, 'userId')) {
    const userCoursesRes = await callLocalGraphqlApi(getUserCoursesQuery(get(input, 'userId')));
    const userCourses = get(userCoursesRes, 'data.userCourses.courses', []);
    // const filteredCourses = userCourses.map(() => {
    //     return true
    // });
    return userCourses;
  }
  return [];
});

export default getUserCourses;
