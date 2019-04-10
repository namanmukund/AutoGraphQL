import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  PUBLISHED,
  topicTypes,
} from '../../../../constants';
import { log } from '../../../../utils';

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
It will be created and returned.
Document contains all the necessary information needed on page along
with the next component.
*/
const userLearningObjectivePostHookMethod = async (userLearningObjectiveResult, params) => {
  const resultArray = [];
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(filterElem => filterElem.user_some);
  const loSome = filterArray.find(filterElem => filterElem.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  if (!userId || !learningObjectiveId) {
    log('Either one of userId or learningObjectiveId is missing in input of userLearningObjectivePostHookMethod');
  }
  /*
  checking if document is not already present in collection for user and LO id
  if it is not already present, we will add a new document with default data
  */
  if (userLearningObjectiveResult && userLearningObjectiveResult.length === 0) {
    /*
    we are getting below fields in learningObjectiveQuery:
    -topic and it's next LO if present, which will be populated in nextComponent
    -all published practice questions of the LO
    */
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
    // restQuery is for when we create userLearningObjective
    if (learningObjectiveIdInResult) {
      restQuery = `nextComponent:{
                     ${learningObjectiveConnectIdQuery}
                     ${topicConnectIdQuery}
                     nextComponentType: ${nextCurrentTopicComponentType}
                   }`;
    }
    /*
    adding addUserLearningObjective document on the basis of
    restQuery(next component data), practiceQuestionsQuery(published practice questions of LO)
    */
    const result = await callGraphqlApi(
      await addUserLearningObjectiveMutation(
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
