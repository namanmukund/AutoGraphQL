import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  PUBLISHED,
  topicTypes,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import getNextComponent from './utils/getNextComponent';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';

// query to get learning objective and all the learning objectives of the topic associated
const learningObjectiveQuery = learningObjectiveId => `
  query{
    learningObjective(id:"${learningObjectiveId}"){
      id
      order
      topic{
        id
        learningObjectives(
          filter:{
            status: ${PUBLISHED}
          }
          orderBy:order_ASC,
        ){
          id
        }
      }
      questionBank(filter:{
        and:[
          {
            assessmentType:${topicTypes.practiceQuestion}
          },
          {
            status: ${PUBLISHED}
          }
        ]
      }){
        id
      }
    }
  }
  `;

// query to add User LO if it is not already present for user and LO id
const addUserLearningObjectiveMutation = (
  userId,
  learningObjectiveId,
  restQuery,
  practiceQuestionsQuery,
) => `
  mutation{
    addUserLearningObjective(
    userConnectId:"${userId}"
    learningObjectiveConnectId:"${learningObjectiveId}"
    input:{
        ${restQuery}
        ${practiceQuestionsQuery}
    }
    ){
      id
      user{
        id
      }
      learningObjective{
        id
      }
      practiceQuestions {
        question {
          id
          order
        }
        status
        isHintUsed
        isAnswerUsed
        attemptNumber
      }
      chatStatus
      isChatBookmarked
      practiceQuestionStatus
      isPracticeQuestionBookmarked
      nextComponent{
        learningObjective{
          id
        }
        topic{
          id
        }
        nextComponentType
      }
    }
    }
    `;
/*
if userLO document does not exist for provided combination of user id and LO id.
It will be created and returned.
Document contains all the necessary information needed on page along
with the next component.
*/
const userLearningObjectivePostHookMethod = async (input, params) => {
  /*
  checking if document is already present in collection for user and LO id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  if (input && input.length) {
    return input;
  }
  const resultArray = [];
  /*
    we are getting below fields in learningObjectiveQuery:
    -topic and it's next LO if present, which will be populated in nextComponent
    -all published practice questions of the LO
    */
  const {
    userId,
    learningObjectiveId,
  } = getInfoFromParams(params, 'learningObjective');
  // In case there is no learning objective id, empty data will be sent
  if (!learningObjectiveId) {
    return resultArray;
  }
  const learningObjectiveQueryRes = await callGraphqlApi(
    learningObjectiveQuery(learningObjectiveId));
  const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
  const {
    topic: topicInfo,
    questionBank: practiceQuestionsInLO,
  } = learningObjectiveInfo;
  if (!topicInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.topic: is not present',
      },
    });
  }
  const { id: topicId } = topicInfo;
  // adding PQs to the userLearningObjective document
  let practiceQuestionsQuery = 'practiceQuestions:[';
  if (learningObjectiveInfo && practiceQuestionsInLO) {
    practiceQuestionsInLO.forEach((practiceQuestion) => {
      const { id: practiceQuestionId } = practiceQuestion;
      practiceQuestionsQuery += `{ questionConnectId: "${practiceQuestionId}" }, `;
    });
  }
  practiceQuestionsQuery += ']';
  // obtaining next LO
  const learningObjectivesInTopic = get(topicInfo, 'learningObjectives');
  let currentLearningObjectiveIndex;
  learningObjectivesInTopic.forEach((learningObjective, index) => {
    if (learningObjective.id === learningObjectiveId) {
      currentLearningObjectiveIndex = index;
    }
  });
  let nextLearningObjectiveId = '';
  if (currentLearningObjectiveIndex + 1 < learningObjectivesInTopic.length) {
    nextLearningObjectiveId = learningObjectivesInTopic[currentLearningObjectiveIndex + 1].id;
  }

  const restQuery = getNextComponent(
    nextLearningObjectiveId,
    topicId,
    'learningObjective',
  );
  /*
    adding addUserLearningObjective document on the basis of
    restQuery(next component data), practiceQuestionsQuery(published practice questions of LO)
    */
  const result = await callGraphqlApi(
    addUserLearningObjectiveMutation(
      userId,
      learningObjectiveId,
      restQuery,
      practiceQuestionsQuery,
    ));
  if (result) {
    /*
      parsing data 'addUserLearningObjective' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of learningObjective,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      And here we have not parsed data for practice questions because userLO will be created
      when user attempts chat, and he will not need PQ there.
      */
    const addUserLearningObjectiveResult = get(result, 'data.addUserLearningObjective');
    if (addUserLearningObjectiveResult) {
      resultArray.push(parseTopicComponentResultData(addUserLearningObjectiveResult, 'learningObjective'));
    }
  }
  return resultArray;
};

export default userLearningObjectivePostHookMethod;
