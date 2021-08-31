import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getUserCourses = (userId) => `
{
  userCourses(filter: { user_some: { id: "${userId}" } }) {
    id
    courses {
        id
    }
  }
}
`;


const getUserCourses = (async (root, params) => {
  const { input } = params;
  if (input && get(input, 'userId')) {
    // const enrollmentTypeFromPayment = await callLocalGraphqlApi(getEnrollmentStatusFromPayment(get(input, 'userId')));
    // // If we get the enrollment status as downgraded then the student status is churned
    return []
  }
  return []
});

export default getUserCourses;
