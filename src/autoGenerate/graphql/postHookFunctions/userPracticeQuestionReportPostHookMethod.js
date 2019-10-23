import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import getInfoFromParams from './utils/getInfoFromParams';

// query to get user learning objective
const userLearningObjectiveQuery = (userId, learningObjectiveId) => `
  query {
    userLearningObjectives(
      filter: {
        and: [
          { user_some: { id: "${userId}" } }
          { learningObjective_some: { id: "${learningObjectiveId}" } }
        ]
      }
    ){
      id
      nextComponent {
        learningObjective {
          id
        }
        topic {
          id
        }
        nextComponentType
      }
    }
  }
  `;

/*
In this method we are going to append next component in user PQ report.
To achieve this we are getting nextComponent from userLearningObjective and then
will add that to PQ report
*/
const userPracticeQuestionReportPostHookMethod = async (input, params) => {
  const {
    userId,
    learningObjectiveId,
  } = getInfoFromParams(params, 'learningObjective');
  if (input.length) {
    // getting next topicId, learningObjectiveId and component from userLearningObjective
    const userLearningObjectiveRes = await callGraphqlApi(userLearningObjectiveQuery(userId, learningObjectiveId));
    const nextTopicId = get(userLearningObjectiveRes, 'data.userLearningObjectives[0].nextComponent.topic.id');
    const nextLearningObjectiveId = get(userLearningObjectiveRes, 'data.userLearningObjectives[0].nextComponent.learningObjective.id');
    const nextComponent = get(userLearningObjectiveRes, 'data.userLearningObjectives[0].nextComponent.nextComponentType');
    // parsing data for next topic, LO and component
    const nextTopicData = { type: 'Topic', typeId: `${nextTopicId}` };
    const nextLearningObjectiveData = { type: 'LearningObjective', typeId: `${nextLearningObjectiveId}` };

    // parsing nextComponent data to be returned in PQ report
    const nextComponentData = {
      nextComponent: {
        learningObjective: nextLearningObjectiveData,
        topic: nextTopicData,
        nextComponentType: nextComponent,
      },
    };
    Object.assign(input[0], nextComponentData);
  }
  return input;
};

export default userPracticeQuestionReportPostHookMethod;
