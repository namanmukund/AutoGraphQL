import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  PUBLISHED,
  topicTypes,
} from '../../../../constants';
import { UserOrLearningObjectiveNotPresentError } from '../../../../constants/errors';

// query to get learning objective and all the learning objectives of the topic associated
const learningObjectiveQuery = async learningObjectiveId => `
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
          after:"${learningObjectiveId}", 
          orderBy:order_ASC, 
          first:1
        ){
          id
        }
      }
      questionBank(filter:{assessmentType:${topicTypes.practiceQuestion}}){
        id
      }
    }
  }
  `;

// query to add User LO if it is not already present for user and LO id
const addUserLearningObjectiveMutation = async (
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
      chatStatus
      isChatBookmarked
      practiceQuestionStatus
      isPracticeQuestionBookmarked
    }
    }
    `;
/*
if userLO document does not exist for provided combination of user id and LO id.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userLearningObjectivePostHookMethod = async (input, params) => {
  const resultArray = [];
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(filterElem => filterElem.user_some);
  const loSome = filterArray.find(filterElem => filterElem.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  // value of input in case of query is result of the query
  // so we are adding new document if document is not already present
  if (!userId || !learningObjectiveId) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  if (input && input.length === 0) {
    const learningObjectiveQueryRes = await callGraphqlApi(
      await learningObjectiveQuery(learningObjectiveId));
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const topicInfo = get(learningObjectiveInfo, 'topic');
    const { id: topicId } = topicInfo;
    const { message, quiz } = topicTypes;
    const {
      id: learningObjectiveIdInResult,
      questionBank: practiceQuestionsinLO,
    } = learningObjectiveInfo;
    // adding PQs to the userLearningObjective document
    let practiceQuestionsQuery = 'practiceQuestions:[';
    if (learningObjectiveInfo && practiceQuestionsinLO) {
      practiceQuestionsinLO.forEach((practiceQuestion) => {
        const { id: practiceQuestionId } = practiceQuestion;
        practiceQuestionsQuery += `{ questionConnectId: "${practiceQuestionId}" }, `;
      });
    }
    practiceQuestionsQuery += ']';
    let restQuery = '';
    let nextCurrentTopicComponentType;
    let learningObjectiveConnectIdQuery = '';
    let topicConnectIdQuery = '';
    // obtaining next LO
    const nextLearningObjectiveId = get(topicInfo, 'learningObjectives[0].id');
    // if next LO is not present in that case, quiz will be next component
    if (nextLearningObjectiveId) {
      nextCurrentTopicComponentType = message;
      learningObjectiveConnectIdQuery = `learningObjectiveConnectId:"${nextLearningObjectiveId}"`;
    } else {
      nextCurrentTopicComponentType = quiz;
    }
    if (topicId) { topicConnectIdQuery = `topicConnectId:"${topicId}"`; }
    // restQuery is for when we ceating userLearningObjective
    if (learningObjectiveIdInResult) {
      restQuery = `nextComponent:{
                     ${learningObjectiveConnectIdQuery}
                     ${topicConnectIdQuery}
                     nextComponentType: ${nextCurrentTopicComponentType}
                   }`;
    }

    const result = await callGraphqlApi(
      await addUserLearningObjectiveMutation(
        userId,
        learningObjectiveId,
        restQuery,
        practiceQuestionsQuery,
      ));
    if (result) {
      // parsing data 'addUserVideo' so that the logic implemented ahead can read data is
      // desired format and return the same
      const parsedData = get(result, 'data.addUserLearningObjective');
      if (parsedData) {
        const lo = { type: 'LearningObjective', typeId: `${parsedData.learningObjective.id}` };
        const user = { type: 'User', typeId: `${parsedData.user.id}` };
        parsedData.learningObjective = lo;
        parsedData.user = user;
        resultArray.push(parsedData);
      }
    }
  }
  return resultArray;
};

export default userLearningObjectivePostHookMethod;
