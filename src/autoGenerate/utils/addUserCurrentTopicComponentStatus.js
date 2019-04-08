import { enrollmentTypes, GLOBAL_COURSE_ID, topicTypes } from '../../../constants';
import callGraphqlApi from '../../api/callGraphqlApi';

const { free } = enrollmentTypes;
const { video } = topicTypes;
// mutation to add userCurrentTopicComponentStatus
const addUserCurrentTopicComponentStatusMutation = async (
  userId,
  firstTopicId,
  firstLearningObjectiveId,
) => `
  mutation{
    addUserCurrentTopicComponentStatus(
      input: {
        enrollmentType: ${free}
        currentTopicComponentType: ${video}
      }
      userConnectId:"${userId}"
      currentCourseConnectId:"${GLOBAL_COURSE_ID}"
      currentTopicConnectId:"${firstTopicId}"
      currentLearningObjectiveConnectId: "${firstLearningObjectiveId}"
    ){
      id
    }
  }
`;

// mutation to create current component status of user
const addUserCurrentTopicComponentStatus = async (
  userId,
  firstTopicId,
  firstLearningObjectiveId,
) => {
  const addUserCurrentTopicComponentStatusResult =
    await callGraphqlApi(await addUserCurrentTopicComponentStatusMutation(
      userId,
      firstTopicId,
      firstLearningObjectiveId,
    ));
  return addUserCurrentTopicComponentStatusResult;
};

export default addUserCurrentTopicComponentStatus;
