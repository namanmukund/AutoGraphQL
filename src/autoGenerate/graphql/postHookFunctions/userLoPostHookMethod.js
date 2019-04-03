import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes,
} from '../../../../constants';

const userLoPostHookMethod = async (input, params) => {
  const resultArray = [];
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  // value of input in case of query is result of the query
  // so we are adding new document if document is not already present
  if (userId && learningObjectiveId && input && input.length === 0) {
    const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
                learningObjectives{
                  id
                  order
                }
              }
              questionBank(filter:{assessmentType:${componentTypes.practiceQuestion}}){
                id
              }
            }
          }
          `;
    const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const topicInfo = get(learningObjectiveInfo, 'topic');
    const topicId = get(topicInfo, 'id');
    const learningObjectivetId = get(learningObjectiveInfo, 'id');
    const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
    // adding PQs to the userLO document
    let practiceQuestionsQuery = 'practiceQuestions:[';
    if (learningObjectiveInfo) {
      const practiceQuestionsinLO = get(learningObjectiveInfo, 'questionBank');
      practiceQuestionsinLO.forEach((practiceQuestion) => {
        practiceQuestionsQuery += `{ questionConnectId: "${practiceQuestion.id}" }, `;
      });
    }
    practiceQuestionsQuery += ']';
    let restQuerv = '';
    const learningObjectives = get(topicInfo, 'learningObjectives');
    // obtaining next LO
    const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
    let nextLOId;
    let nextCurrentComponentType;
    let learningObjectiveConnectIdQuerv = '';
    let topicConnectIdQuerv = '';
    learningObjectives.forEach((learningObjective) => {
      if (learningObjective &&
        learningObjective.order === nextLearningObjectiveOrder
      ) {
        nextLOId = learningObjective.id;
      }
    });
    // if next LO is not present in that case, quiz will be next component
    if (nextLOId) {
      nextCurrentComponentType = componentTypes.message;
      learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
    } else {
      topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
      nextCurrentComponentType = componentTypes.quiz;
    }
    // restQuery is for when we ceate/update userLO
    if (learningObjectivetId) {
      restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentComponentType}
                   }`;
    }

    const addUserLOMutation = `
              mutation{
                  addUserLO(
                  userConnectId:"${userId}"
                  learningObjectiveConnectId:"${learningObjectiveId}"
                  input:{
                      ${restQuerv}
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
    const result = await callGraphqlApi(addUserLOMutation);
    if (result) {
      // parsing data 'addUserVideo' so that the logic implemented ahead can read data is
      // desired format and return the same
      const parsedData = get(result, 'data.addUserLO');
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

export default userLoPostHookMethod;
