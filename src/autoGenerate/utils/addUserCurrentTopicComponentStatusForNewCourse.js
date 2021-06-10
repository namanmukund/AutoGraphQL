import {
  enrollmentTypes,
} from '../../../constants';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

const { free } = enrollmentTypes;
// mutation to add userCurrentTopicComponentStatus
const addUserCurrentTopicComponentStatusMutation = (
  userId,
  courseId,
  firstTopicId,
  firstLearningObjectiveId,
  firstVideoId,
  firstBlockedBasedProjectId,
  firstComponentName,
) => `
  mutation{
    addUserCurrentTopicComponentStatus(
      input: {
        enrollmentType: ${free}
        currentTopicComponentType: ${firstComponentName}
      }
      userConnectId:"${userId}"
      currentCourseConnectId:"${courseId}"
      currentTopicConnectId:"${firstTopicId}"
      ${firstLearningObjectiveId ? `currentLearningObjectiveConnectId: "${firstLearningObjectiveId}"` : ''}
      ${firstVideoId ? `currentVideoConnectId: "${firstVideoId}"` : ''}
      ${firstBlockedBasedProjectId ? `currentBlockBasedProjectConnectId: "${firstBlockedBasedProjectId}"` : ''}
    ){
      id
    }
  }
`;

// mutation to create current component status of user
const addUserCurrentTopicComponentStatusForNewCourse = async (
  userId, courseId, firstTopicId, firstLearningObjectiveId, firstVideoId, firstBlockedBasedProjectId, firstComponentName,
) => {
  await callLocalGraphqlApi(addUserCurrentTopicComponentStatusMutation(
    userId,
    courseId,
    firstTopicId,
    firstLearningObjectiveId,
    firstVideoId,
    firstBlockedBasedProjectId,
    firstComponentName,
  ));
};

export default addUserCurrentTopicComponentStatusForNewCourse;
