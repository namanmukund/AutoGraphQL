import { enrollmentTypes, GLOBAL_COURSE_ID, topicTypes } from '../../../constants';
import callGraphqlApi from '../../api/callGraphqlApi';

const { free } = enrollmentTypes;
const { video } = topicTypes;
// mutation to add userCurrentTopicComponentStatus
const addUserCurrentTopicComponentStatusMutation = (
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
const addUserCurrentTopicComponentStatus = (
  userId,
  firstTopicId,
  firstLearningObjectiveId,
) => callGraphqlApi(addUserCurrentTopicComponentStatusMutation(
  userId,
  firstTopicId,
  firstLearningObjectiveId,
));

export default addUserCurrentTopicComponentStatus;
