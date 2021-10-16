import { get } from 'lodash';
import { OLD_COURSE_ID } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchUserAssignments = async () => {
  const query = `
    {
      userAssignments(filter: {and: [ 
        {course_some: {id: "${OLD_COURSE_ID}"}}
      ]}) {
        id
        course {
          title
        }
      }
    }
  `;
  const userAssignments = await callLocalGraphqlApi(query);
  return get(userAssignments, 'data.userAssignments', []);
};

const removeCourseIdFromUserAssignment = async (userAssignmentId) => {
  const mutation = `
      mutation {
        removeFromUserAssignmentCourse(userAssignmentId:"${userAssignmentId}", courseId:"cjs8skrd200041huzz78kncz5") {
          typeName
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.removeFromUserAssignmentCourse', {});
};

const removeCourseFromUserAssignments = async () => {
  // eslint-disable-next-line no-await-in-loop
  const userAssignments = await fetchUserAssignments();
  // eslint-disable-next-line no-restricted-syntax
  for (const userAssignment of userAssignments) {
    const userAssignmentId = userAssignment.id;
    if (userAssignmentId) {
      // eslint-disable-next-line no-await-in-loop
      await removeCourseIdFromUserAssignment(userAssignmentId);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Python CourseId Removed From Assignment : ${userAssignmentId}`);
    }
  }
};
export default removeCourseFromUserAssignments;
