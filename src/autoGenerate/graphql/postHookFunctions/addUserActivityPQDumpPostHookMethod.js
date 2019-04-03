import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userComponentStatus,
} from '../../../../constants';

const addUserActivityPQDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  if (userId && learningObjectiveId) {
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
    const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
    const learningObjectivetId = get(learningObjectiveInfo, 'id');
    // query to get current component status of user
    const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
              and:[
                {user_some:{
                id:"${userId}"
                }},
              {currentCourse_some:{
                and:[
                  {status: published},
                  {id:"${GLOBAL_COURSE_ID}"}
                  {chapters_some:{
                    status: published
                  }}
                ]
              }}
              ]
            }){
              id
              user{
                id
                username
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
    const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
    const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
    const userLOQuery = `
          query{
            userLos(filter:{
              and:[
                {user_some:{
                id:"${userId}"
                }},
              {learningObjective_some:{
                id:"${learningObjectiveId}"
              }}
              ]
            }){
              id
              practiceQuestionStatus
              practiceQuestions{
                question{
                  id
                }
                isHintused
                isAnswerUsed
                attemptNumber
                status
              }
              nextComponent{
                learningObjective{
                  id
                }
                nextComponentType
              }
            }
          }
          `;
    const userLOQueryRes = await callGraphqlApi(userLOQuery);
    const userLOInfo = get(userLOQueryRes, 'data.userLos[0]');
    const userLOId = get(userLOInfo, 'id');
    let isPracticeQuestionBookmarked = false;
    let practiceQuestionStatus = get(userLOInfo, 'practiceQuestionStatus', userComponentStatus.incomplete);
    const practiceQuestionStatusBeforeUpdate = get(userLOInfo, 'practiceQuestionStatus');
    const pqAction = get(input, 'pqAction');
    isPracticeQuestionBookmarked = get(input, 'isBookmarked');
    if (pqAction && pqAction === userActionType.next) {
      practiceQuestionStatus = userComponentStatus.complete;
    }
    const {
      id: currentComponentId,
      currentComponentType: currentComponent,
      currentLearningObjective,
      currentTopic,
    } = currentComponentInfo;
    if (userLOInfo && userLOInfo.practiceQuestionStatus === userComponentStatus.complete) {
      practiceQuestionStatus = userComponentStatus.complete;
    }
    let restQuerv = '';
    const nextComponent = get(userLOInfo, 'nextComponent.learningObjective.id');
    const learningObjectives = get(topicInfo, 'learningObjectives');
    const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
    let nextLOId;
    let nextCurrentComponentType;
    let restUserCurrentComponentStatusQuerv = '';
    let learningObjectiveConnectIdQuerv = '';
    let topicConnectIdQuerv = '';
    learningObjectives.forEach((learningObjective) => {
      if (learningObjective &&
        learningObjective.order === nextLearningObjectiveOrder
      ) {
        nextLOId = learningObjective.id;
      }
    });
    // logic for checking the next component
    if (nextLOId) {
      nextCurrentComponentType = componentTypes.message;
      restUserCurrentComponentStatusQuerv = `currentLearningObjectiveConnectId:"${nextLOId}"`;
      learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
    } else {
      topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
      nextCurrentComponentType = componentTypes.quiz;
    }
    // restQuery is for when we ceate/update userLO
    if (learningObjectivetId && !nextComponent) {
      restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentComponentType}
                   }`;
    }

    if (currentComponent &&
      currentTopic &&
      topicInfo &&
      currentLearningObjective &&
      pqAction === userActionType.next &&
      currentComponent === componentTypes.practiceQuestion &&
      currentTopic.id === topicInfo.id &&
      currentLearningObjective.id === learningObjectiveInfo.id
    ) {
      const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${nextCurrentComponentType}
                }
                ${restUserCurrentComponentStatusQuerv}
                ){
                  id
                }
              }
              `;
      await callGraphqlApi(updateUserCurrentComponentStatusMutation);
    }
    if (userLOId) {
      // update userLO
      let firstTryCount = 0;
      let secondTryCount = 0;
      let threeOrMoreTryCount = 0;
      let helpUsedCount = 0;
      let answerUsedCount = 0;
      let inputQuestion;
      let isCorrect;
      let isHintused;
      let isAnswerUsed;
      let attemptNumber;
      let status;
      let inputQuestionConnectId;
      let pushManyQuery = 'practiceQuestions:{ pushMany: [';
      const inputPracticeQuestions = get(input, 'practiceQuestions');
      const practiceQuestionsInUserLO = get(userLOInfo, 'practiceQuestions');
      if (inputPracticeQuestions.length && practiceQuestionsInUserLO.length) {
        practiceQuestionsInUserLO.forEach((practiceQuestionInUserLO) => {
          // storing all the passed info in input in newPracticeQuestionInUserLO
          const { question, ...newPracticeQuestionInUserLO } = practiceQuestionInUserLO;
          const questionConnectId = get(practiceQuestionInUserLO, 'question.id');
          pushManyQuery += `{ questionConnectId: "${questionConnectId}", `;
          inputPracticeQuestions.forEach((inputPracticeQuestion) => {
            inputQuestion = get(inputPracticeQuestion, 'question');
            isCorrect = get(inputPracticeQuestion, 'isCorrect');
            isHintused = get(inputPracticeQuestion, 'isHintused');
            isAnswerUsed = get(inputPracticeQuestion, 'isAnswerUsed');
            attemptNumber = get(inputPracticeQuestion, 'attemptNumber');
            status = get(inputPracticeQuestion, 'status');
            inputQuestionConnectId = get(inputQuestion, 'typeId');
            if (questionConnectId === inputQuestionConnectId) {
              Object.assign(newPracticeQuestionInUserLO, { questionConnectId });
              // case when individual question is incomplete and
              // practice question is also incomplete
              if (practiceQuestionStatusBeforeUpdate === userComponentStatus.incomplete &&
                practiceQuestionInUserLO.status === userComponentStatus.incomplete
              ) {
                if (isHintused === true) {
                  Object.assign(newPracticeQuestionInUserLO, { isHintused });
                }
                if (isAnswerUsed === true) {
                  Object.assign(newPracticeQuestionInUserLO, { isAnswerUsed });
                }
                if (status === userComponentStatus.complete) {
                  Object.assign(newPracticeQuestionInUserLO, { status });
                }
                if (isCorrect === true && attemptNumber) {
                  Object.assign(newPracticeQuestionInUserLO, { attemptNumber });
                }
                // case when PQ is already completed and user is reattempting
              } else if (practiceQuestionStatus === userComponentStatus.complete &&
                practiceQuestionInUserLO.status === userComponentStatus.complete) {
                Object.assign(newPracticeQuestionInUserLO, { isHintused });
                Object.assign(newPracticeQuestionInUserLO, { isAnswerUsed });
                if (isCorrect === true && attemptNumber) {
                  Object.assign(newPracticeQuestionInUserLO, { attemptNumber });
                }
              }
            }
          });
          // ceating query which will be sent in UserLO
          pushManyQuery += `isHintused: ${newPracticeQuestionInUserLO.isHintused}, 
                                               isAnswerUsed: ${newPracticeQuestionInUserLO.isAnswerUsed}, 
                                               attemptNumber: ${newPracticeQuestionInUserLO.attemptNumber}, 
                                               status: ${newPracticeQuestionInUserLO.status}, 
                                              }, `;

          // these properties will be used in UserPracticeQuestionReport
          // PQ report will only be generated when user hits next
          if (pqAction === userActionType.next) {
            if (newPracticeQuestionInUserLO.isHintused) helpUsedCount += 1;
            if (newPracticeQuestionInUserLO.isAnswerUsed) answerUsedCount += 1;
            if (newPracticeQuestionInUserLO.attemptNumber === 1) {
              firstTryCount += 1;
            } else if (newPracticeQuestionInUserLO.attemptNumber === 2) {
              secondTryCount += 1;
            } else {
              threeOrMoreTryCount += 1;
            }
          }
        });
      }
      pushManyQuery += ']}';
      let popAllQuery = '';
      // popping all the practice questions
      popAllQuery = `practiceQuestions:{
                     popAll: true
                   }`;
      const updateUserLOMutation = `
          mutation{
            updateUserLO(id:"${userLOId}",  input:{
              isPracticeQuestionBookmarked: ${isPracticeQuestionBookmarked}
              practiceQuestionStatus: ${practiceQuestionStatus}
              ${restQuerv}
              ${popAllQuery}
            }){
              id
            }
          }
          `;

      await callGraphqlApi(updateUserLOMutation);
      // pushing updated practice questions
      const updateUserLOMutationPracticeQuestions = `
              mutation{
                updateUserLO(id:"${userLOId}",  input:{
                  ${pushManyQuery}
                }){
                  id
                }
              }
              `;

      await callGraphqlApi(updateUserLOMutationPracticeQuestions);
      // PQ report will only be generated when user hits next
      if (pqAction === userActionType.next) {
        const addUserPracticeQuestionReportMutation = `
              mutation{
                  addUserPracticeQuestionReport(
                  userConnectId:"${userId}"
                  learningObjectiveConnectId:"${learningObjectivetId}"
                  input:{
                      firstTryCount: ${firstTryCount}
                      secondTryCount: ${secondTryCount}
                      threeOrMoreTryCount: ${threeOrMoreTryCount}
                      helpUsedCount: ${helpUsedCount}
                      answerUsedCount: ${answerUsedCount}
                  }
              ){
                    id
                  }
              }
              `;

        await callGraphqlApi(addUserPracticeQuestionReportMutation);
      }
    }
  }
};

export default addUserActivityPQDumpPostHookMethod;
