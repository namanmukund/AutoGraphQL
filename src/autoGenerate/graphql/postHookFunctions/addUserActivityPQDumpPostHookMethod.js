import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';

// query to get learning objective and all the learning objectives of the topic associated
// query needs optimization
const learningObjectiveQuery = async learningObjectiveId => `
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
      questionBank(filter:{assessmentType:${topicTypes.practiceQuestion}}){
        id
      }
    }
  }
  `;

// query to get current topic component status so that we can change the next component accordingly
const userCurrentTopicComponentStatusQuery = async userId => `
  query{
    userCurrentTopicComponentStatuses(filter:{
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
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

/* query to get userLO to check if document exists for userId and learningObjectiveId
also we are doing computationfor chatStatus and next component for this */
const userLearningObjectiveQuery = async (userId, learningObjectiveId) => `
  query{
    userLearningObjectives(filter:{
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

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = async (
  currentTopicComponentId,
  nextCurrentTopicComponentType,
  restUserCurrentTopicComponentStatusQuerv,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
      currentTopicComponentType: ${nextCurrentTopicComponentType}
    }
    ${restUserCurrentTopicComponentStatusQuerv}
    ){
      id
    }
  }
  `;

// mutation to update User Learning Objective, popping all practice questions
const updateUserLearningObjectiveMutation = async (
  userLearningObjectiveId,
  isPracticeQuestionBookmarked,
  practiceQuestionStatus,
  restQuerv,
  popAllQuery,
) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      isPracticeQuestionBookmarked: ${isPracticeQuestionBookmarked}
      practiceQuestionStatus: ${practiceQuestionStatus}
      ${restQuerv}
      ${popAllQuery}
    }){
      id
    }
  }
  `;

// mutation to update User Learning Objective, pushing updated practice questions
const updateUserLearningObjectiveMutationPracticeQuestions = async (
  userLearningObjectiveId, pushManyQuery) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

// mutation to add UserPracticeQuestionReport
const addUserPracticeQuestionReportMutation = async (
  userId,
  learningObjectivetId,
  firstTryCount,
  secondTryCount,
  threeOrMoreTryCount,
  helpUsedCount,
  answerUsedCount,
) => `
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

/*
Current topic component status and
UserLearningObjective(bookmark, practiceQuestionStatus etc) is updated based on-
  -current topic component status
  -user Learning Objective for provided userId and learning objective id
  -learning objectives and topic
*/
const addUserActivityPQDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  if (userId && learningObjectiveId) {
    const learningObjectiveQueryRes = await callGraphqlApi(
      await learningObjectiveQuery(learningObjectiveId));
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const topicInfo = get(learningObjectiveInfo, 'topic');
    const topicId = get(topicInfo, 'id');
    const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
    const learningObjectivetId = get(learningObjectiveInfo, 'id');
    const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
    const userLearningObjectiveQueryRes = await callGraphqlApi(
      await userLearningObjectiveQuery(userId, learningObjectiveId));
    const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
    const userLearningObjectiveId = get(userLearningObjectiveInfo, 'id');
    let isPracticeQuestionBookmarked = false;
    let practiceQuestionStatus = get(userLearningObjectiveInfo, 'practiceQuestionStatus', userTopicTypeStatus.incomplete);
    const practiceQuestionStatusBeforeUpdate = get(userLearningObjectiveInfo, 'practiceQuestionStatus');
    const pqAction = get(input, 'pqAction');
    isPracticeQuestionBookmarked = get(input, 'isBookmarked');
    if (pqAction && pqAction === userActionType.next) {
      practiceQuestionStatus = userTopicTypeStatus.complete;
    }
    const {
      id: currentTopicComponentId,
      currentTopicComponentType: currentTopicComponent,
      currentLearningObjective,
      currentTopic,
    } = currentTopicComponentInfo;
    if (userLearningObjectiveInfo &&
      userLearningObjectiveInfo.practiceQuestionStatus === userTopicTypeStatus.complete) {
      practiceQuestionStatus = userTopicTypeStatus.complete;
    }
    let restQuery = '';
    const nextComponent = get(userLearningObjectiveInfo, 'nextComponent.learningObjective.id');
    const learningObjectives = get(topicInfo, 'learningObjectives');
    const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
    let nextLOId;
    let nextCurrentTopicComponentType;
    let restUserCurrentTopicComponentStatusQuerv = '';
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
      nextCurrentTopicComponentType = topicTypes.message;
      restUserCurrentTopicComponentStatusQuerv = `currentLearningObjectiveConnectId:"${nextLOId}"`;
      learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
    } else {
      topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
      nextCurrentTopicComponentType = topicTypes.quiz;
    }
    // restQuery is for when we ceate/update userLearningObjective
    if (learningObjectivetId && !nextComponent) {
      restQuery = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentTopicComponentType}
                   }`;
    }

    if (currentTopicComponent &&
      currentTopic &&
      topicInfo &&
      currentLearningObjective &&
      pqAction === userActionType.next &&
      currentTopicComponent === topicTypes.practiceQuestion &&
      currentTopic.id === topicInfo.id &&
      currentLearningObjective.id === learningObjectiveInfo.id
    ) {
      await callGraphqlApi(await updateUserCurrentTopicComponentStatusMutation(
        currentTopicComponentId,
        nextCurrentTopicComponentType,
        restUserCurrentTopicComponentStatusQuerv,
      ));
    }
    if (userLearningObjectiveId) {
      // update userLearningObjective
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
      const practiceQuestionsInUserLearningObjective = get(userLearningObjectiveInfo, 'practiceQuestions');
      if (inputPracticeQuestions.length && practiceQuestionsInUserLearningObjective.length) {
        practiceQuestionsInUserLearningObjective.forEach(
          (practiceQuestionInUserLearningObjective) => {
          // storing all the passed info in input in newPracticeQuestionInUserLearningObjective
            const { question,
              ...newPracticeQuestionInUserLearningObjective }
              = practiceQuestionInUserLearningObjective;
            const questionConnectId = get(practiceQuestionInUserLearningObjective, 'question.id');
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
                Object.assign(newPracticeQuestionInUserLearningObjective, { questionConnectId });
                // case when individual question is incomplete and
                // practice question is also incomplete
                if (practiceQuestionStatusBeforeUpdate === userTopicTypeStatus.incomplete &&
                practiceQuestionInUserLearningObjective.status === userTopicTypeStatus.incomplete
                ) {
                  if (isHintused === true) {
                    Object.assign(newPracticeQuestionInUserLearningObjective, { isHintused });
                  }
                  if (isAnswerUsed === true) {
                    Object.assign(newPracticeQuestionInUserLearningObjective, { isAnswerUsed });
                  }
                  if (status === userTopicTypeStatus.complete) {
                    Object.assign(newPracticeQuestionInUserLearningObjective, { status });
                  }
                  if (isCorrect === true && attemptNumber) {
                    Object.assign(newPracticeQuestionInUserLearningObjective, { attemptNumber });
                  }
                // case when PQ is already completed and user is reattempting
                } else if (practiceQuestionStatus === userTopicTypeStatus.complete &&
                practiceQuestionInUserLearningObjective.status === userTopicTypeStatus.complete) {
                  Object.assign(newPracticeQuestionInUserLearningObjective, { isHintused });
                  Object.assign(newPracticeQuestionInUserLearningObjective, { isAnswerUsed });
                  if (isCorrect === true && attemptNumber) {
                    Object.assign(newPracticeQuestionInUserLearningObjective, { attemptNumber });
                  }
                }
              }
            });
            // ceating query which will be sent in UserLearningObjective
            pushManyQuery += `isHintused: ${newPracticeQuestionInUserLearningObjective.isHintused}, 
                                               isAnswerUsed: ${newPracticeQuestionInUserLearningObjective.isAnswerUsed}, 
                                               attemptNumber: ${newPracticeQuestionInUserLearningObjective.attemptNumber}, 
                                               status: ${newPracticeQuestionInUserLearningObjective.status}, 
                                              }, `;

            // these properties will be used in UserPracticeQuestionReport
            // PQ report will only be generated when user hits next
            if (pqAction === userActionType.next) {
              if (newPracticeQuestionInUserLearningObjective.isHintused) helpUsedCount += 1;
              if (newPracticeQuestionInUserLearningObjective.isAnswerUsed) answerUsedCount += 1;
              if (newPracticeQuestionInUserLearningObjective.attemptNumber === 1) {
                firstTryCount += 1;
              } else if (newPracticeQuestionInUserLearningObjective.attemptNumber === 2) {
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

      await callGraphqlApi(await updateUserLearningObjectiveMutation(
        userLearningObjectiveId,
        isPracticeQuestionBookmarked,
        practiceQuestionStatus,
        restQuery,
        popAllQuery,
      ));
      // pushing updated practice questions

      await callGraphqlApi(updateUserLearningObjectiveMutationPracticeQuestions(
        userLearningObjectiveId,
        pushManyQuery,
      ));
      // PQ report will only be generated when user hits next
      if (pqAction === userActionType.next) {
        await callGraphqlApi(await addUserPracticeQuestionReportMutation(
          userId,
          learningObjectivetId,
          firstTryCount,
          secondTryCount,
          threeOrMoreTryCount,
          helpUsedCount,
          answerUsedCount,
        ));
      }
    }
  }
};

export default addUserActivityPQDumpPostHookMethod;
